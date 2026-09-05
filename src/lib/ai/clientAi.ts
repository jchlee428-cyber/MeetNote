// 브라우저 클라이언트 사이드 AI 직통 호출 모듈
// Vercel 서버리스의 4.5MB 페이로드 제한 및 10초 타임아웃을 우회하여 대용량 음성도 안전하게 전사
import { MeetingMinutes, MeetingBasicInfo } from '@/types/meeting';
import { MEETING_MINUTES_SYSTEM_PROMPT, buildUserPrompt } from './prompt';
import { normalizeAudioMimeType, getSafeAudioExtension } from './transcribe';

interface ClientTranscribeResult {
  transcript: string;
  provider: string;
}

// 오디오 파일을 base64로 변환
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

function cleanJsonResponse(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return cleaned;
}

function normalizeMinutes(parsed: any, basicInfo?: Partial<MeetingBasicInfo>): MeetingMinutes {
  return {
    basicInfo: {
      title: parsed.basicInfo?.title || basicInfo?.title || '정기 회의록',
      dateTime: parsed.basicInfo?.dateTime || basicInfo?.dateTime || new Date().toISOString().slice(0, 16).replace('T', ' '),
      location: parsed.basicInfo?.location || basicInfo?.location || '회의실',
      attendees: parsed.basicInfo?.attendees || basicInfo?.attendees || '참석자 일동',
      objective: parsed.basicInfo?.objective || '주요 안건 심의 및 논의',
    },
    agenda: Array.isArray(parsed.agenda) ? parsed.agenda : ['1. 주요 현안 논의'],
    discussions: Array.isArray(parsed.discussions) ? parsed.discussions : [],
    decisions: Array.isArray(parsed.decisions) ? parsed.decisions : [],
    unresolved: Array.isArray(parsed.unresolved) ? parsed.unresolved : [],
    opinions: Array.isArray(parsed.opinions) ? parsed.opinions : [],
    actionItems: Array.isArray(parsed.actionItems)
      ? parsed.actionItems.map((item: any) => ({
          task: item.task || '업무 미지정',
          assignee: item.assignee || '미정',
          dueDate: item.dueDate || '미정',
          status: item.status || '예정',
        }))
      : [],
    nextMeeting: {
      dateTime: parsed.nextMeeting?.dateTime || '미정',
      location: parsed.nextMeeting?.location || '미정',
      note: parsed.nextMeeting?.note || '',
    },
  };
}

// 1. 클라이언트 전사 (Direct Client Whisper / Gemini)
export async function transcribeAudioClient(
  file: File,
  meta: { title: string; location: string; participants: string },
  keys: { openaiKey?: string; geminiKey?: string; preferredEngine?: 'auto' | 'openai' | 'gemini' }
): Promise<ClientTranscribeResult> {
  const openaiKey = keys.openaiKey?.trim();
  const geminiKey = keys.geminiKey?.trim();
  const preferredEngine = keys.preferredEngine || 'auto';

  if (!file || file.size === 0) {
    throw new Error('녹음 파일이 비어있습니다 (0바이트). 다시 녹음하거나 파일을 선택해주세요.');
  }

  // Gemini 직접 호출 내부 함수
  const callGeminiStt = async (): Promise<ClientTranscribeResult> => {
    if (!geminiKey) throw new Error('Gemini API Key가 설정되지 않았습니다.');
    const base64Audio = await fileToBase64(file);
    const normalizedMime = normalizeAudioMimeType(file.type, file.name);
    const models = ['gemini-2.0-flash', 'gemini-1.5-flash'];
    let lastError = '';

    for (const model of models) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: '다음 한국어 오디오 녹음 파일의 모든 발언 내용을 있는 그대로 정확하고 왜곡 없이 한국어로 텍스트 전사해 주십시오. 다른 부연 설명이나 인사말, 사족 없이 오디오에서 발언된 순수 한국어 내용만을 그대로 출력하십시오.',
                    },
                    {
                      inline_data: {
                        mime_type: normalizedMime,
                        data: base64Audio,
                      },
                    },
                  ],
                },
              ],
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (generatedText && generatedText.trim()) {
            return {
              transcript: generatedText.trim(),
              provider: `gemini-${model}-direct`,
            };
          }
        } else {
          const errText = await response.text();
          console.error(`Direct Gemini (${model}) error:`, response.status, errText);
          let parsedDetail = '';
          try {
            const p = JSON.parse(errText);
            parsedDetail = p.error?.message || '';
          } catch {
            parsedDetail = errText;
          }
          if (response.status === 400 && (errText.includes('API_KEY_INVALID') || parsedDetail.includes('API key not valid'))) {
            throw new Error('Gemini API Key가 올바르지 않습니다. 상단 [API 설정]에서 키를 다시 확인해주세요.');
          }
          if (response.status === 429) {
            throw new Error('Gemini API 호출 한도를 초과했습니다 (429 Quota Exceeded). 잠시 후 다시 시도해주세요.');
          }
          lastError = `${response.status}: ${parsedDetail || errText}`;
        }
      } catch (err: any) {
        if (err.message.includes('API Key') || err.message.includes('한도')) {
          throw err;
        }
        lastError = err.message;
      }
    }

    throw new Error(`Gemini 음성 전사 실패: ${lastError}`);
  };

  // OpenAI Whisper 직접 호출 내부 함수
  const callWhisperStt = async (): Promise<ClientTranscribeResult> => {
    if (!openaiKey) throw new Error('OpenAI API Key가 설정되지 않았습니다.');

    // 25MB 파일 용량 제한 체크
    const MAX_WHISPER_SIZE = 25 * 1024 * 1024;
    if (file.size > MAX_WHISPER_SIZE) {
      if (geminiKey) {
        console.info('File > 25MB, switching to Gemini...');
        return await callGeminiStt();
      }
      throw new Error(
        `오디오 파일 용량(${(file.size / (1024 * 1024)).toFixed(1)}MB)이 OpenAI Whisper 한도(25MB)를 초과합니다. 파일을 분할하시거나 상단 [API 설정]에 Google Gemini API 키를 등록해주세요.`
      );
    }

    const safeExt = getSafeAudioExtension(file.name, file.type);
    const safeFileName = `audio_${Date.now()}.${safeExt}`;
    // 특수문자나 한글 파일명으로 인한 OpenAI HTTP 400 오류를 방지하기 위해 ASCII 안전 파일 객체 생성
    const audioBlob = file.slice(0, file.size, file.type || `audio/${safeExt}`);
    const safeFile = new File([audioBlob], safeFileName, { type: file.type || `audio/${safeExt}` });

    const formData = new FormData();
    formData.append('file', safeFile, safeFileName);
    formData.append('model', 'whisper-1');
    formData.append('language', 'ko');
    formData.append('response_format', 'verbose_json');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openaiKey}`,
      },
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      return {
        transcript: data.text || '',
        provider: 'openai-whisper-direct',
      };
    } else {
      const errText = await response.text();
      console.warn('Direct OpenAI Whisper failed:', response.status, errText);

      let detailMsg = '';
      try {
        const parsed = JSON.parse(errText);
        detailMsg = parsed.error?.message || '';
      } catch {
        detailMsg = errText;
      }

      // Gemini 키가 있으면 자동 대체 실행
      if (geminiKey && preferredEngine !== 'openai') {
        console.info('Whisper failed, attempting Gemini fallback...', detailMsg);
        return await callGeminiStt();
      }

      let msg = `OpenAI Whisper 전사 실패 (${response.status}): ${detailMsg || '오디오 처리 실패'}`;
      if (response.status === 401) {
        msg = 'OpenAI API Key가 올바르지 않습니다. 상단 [API 설정]에서 키를 다시 확인해주세요.';
      } else if (response.status === 429) {
        msg = 'OpenAI API 사용량 한도를 초과했습니다 (429 Quota). OpenAI 잔액을 충전하시거나, 상단 [API 설정]에 무료 Google Gemini API 키를 등록해주세요.';
      }
      throw new Error(msg);
    }
  };

  // 엔진 우선순위에 따른 분기 처리
  if (preferredEngine === 'gemini' && geminiKey) {
    try {
      return await callGeminiStt();
    } catch (err: any) {
      if (openaiKey) {
        console.warn('Gemini failed, trying OpenAI Whisper fallback:', err);
        return await callWhisperStt();
      }
      throw err;
    }
  }

  if (openaiKey) {
    try {
      return await callWhisperStt();
    } catch (err: any) {
      if (geminiKey && preferredEngine !== 'openai') {
        console.warn('Whisper failed, trying Gemini fallback:', err);
        return await callGeminiStt();
      }
      throw err;
    }
  }

  if (geminiKey) {
    return await callGeminiStt();
  }

  // (3) 키가 없으면 서버 라우트(/api/transcribe)로 요청
  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', meta.title);
  formData.append('location', meta.location);
  formData.append('participants', meta.participants);

  const res = await fetch('/api/transcribe', {
    method: 'POST',
    body: formData,
  });

  const resText = await res.text();
  if (!res.ok) {
    if (res.status === 413 || resText.includes('Request Entity Too Large')) {
      throw new Error(
        '오디오 파일이 너무 큽니다 (Vercel 무료 서버 한도 4.5MB 초과). 상단 [API 설정]에 OpenAI 또는 Gemini 키를 입력하시면 용량 제한 없이 직접 고속 전사하실 수 있습니다.'
      );
    }
    let errMsg = '음성 전사에 실패했습니다.';
    try {
      const data = JSON.parse(resText);
      errMsg = data.error || errMsg;
    } catch {
      errMsg = resText || errMsg;
    }
    throw new Error(errMsg);
  }

  const data = JSON.parse(resText);
  return {
    transcript: data.transcript || '',
    provider: data.provider || 'server',
  };
}

// 2. 클라이언트 회의록 생성 (Direct Client OpenAI / Gemini)
export async function generateMinutesClient(
  transcript: string,
  basicInfo: Partial<MeetingBasicInfo>,
  keys: { openaiKey?: string; geminiKey?: string; preferredEngine?: 'auto' | 'openai' | 'gemini' }
): Promise<{ minutes: MeetingMinutes; provider: string }> {
  const openaiKey = keys.openaiKey?.trim();
  const geminiKey = keys.geminiKey?.trim();
  const preferredEngine = keys.preferredEngine || 'auto';

  const userPrompt = buildUserPrompt(transcript, {
    title: basicInfo?.title,
    location: basicInfo?.location,
    attendees: basicInfo?.attendees,
  });

  const callGeminiMinutes = async (): Promise<{ minutes: MeetingMinutes; provider: string }> => {
    if (!geminiKey) throw new Error('Gemini API Key가 설정되지 않았습니다.');
    const models = ['gemini-2.0-flash', 'gemini-1.5-flash'];
    let lastError = '';

    for (const model of models) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: {
                parts: [{ text: MEETING_MINUTES_SYSTEM_PROMPT }],
              },
              contents: [
                {
                  parts: [{ text: userPrompt }],
                },
              ],
              generationConfig: {
                temperature: 0.2,
                responseMimeType: 'application/json',
              },
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            const parsed = JSON.parse(cleanJsonResponse(text));
            return {
              minutes: normalizeMinutes(parsed, basicInfo),
              provider: `gemini-${model}-direct`,
            };
          }
        } else {
          const errText = await response.text();
          let detail = '';
          try {
            const p = JSON.parse(errText);
            detail = p.error?.message || '';
          } catch {
            detail = errText;
          }
          if (response.status === 400 && (errText.includes('API_KEY_INVALID') || detail.includes('API key not valid'))) {
            throw new Error('Gemini API Key가 올바르지 않습니다. 상단 [API 설정]에서 키를 다시 확인해주세요.');
          }
          if (response.status === 429) {
            throw new Error('Gemini API 호출 한도를 초과했습니다 (429 Quota Exceeded). 잠시 후 다시 시도해주세요.');
          }
          lastError = `${response.status}: ${detail || errText}`;
        }
      } catch (err: any) {
        if (err.message.includes('API Key') || err.message.includes('한도')) {
          throw err;
        }
        lastError = err.message;
      }
    }

    throw new Error(`Gemini 회의록 생성 실패: ${lastError}`);
  };

  const callOpenAIMinutes = async (): Promise<{ minutes: MeetingMinutes; provider: string }> => {
    if (!openaiKey) throw new Error('OpenAI API Key가 설정되지 않았습니다.');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: MEETING_MINUTES_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(cleanJsonResponse(content));
        return {
          minutes: normalizeMinutes(parsed, basicInfo),
          provider: 'openai-gpt-4o-direct',
        };
      }
      throw new Error('OpenAI 응답 데이터가 올바르지 않습니다.');
    } else {
      const errText = await response.text();
      let detailMsg = '';
      try {
        const parsed = JSON.parse(errText);
        detailMsg = parsed.error?.message || '';
      } catch {
        detailMsg = errText;
      }

      if (geminiKey && preferredEngine !== 'openai') {
        console.info('GPT-4o failed, attempting Gemini fallback...', detailMsg);
        return await callGeminiMinutes();
      }

      let msg = `OpenAI 회의록 생성 실패 (${response.status}): ${detailMsg || '생성 실패'}`;
      if (response.status === 401) {
        msg = 'OpenAI API Key가 올바르지 않습니다. 상단 [API 설정]에서 키를 다시 확인해주세요.';
      } else if (response.status === 429) {
        msg = 'OpenAI API 사용량 한도를 초과했습니다 (429 Quota). 크레딧을 충전하시거나, 무료 Google Gemini API 키를 [API 설정]에 등록해주세요.';
      }
      throw new Error(msg);
    }
  };

  // 엔진 우선순위에 따른 분기 처리
  if (preferredEngine === 'gemini' && geminiKey) {
    try {
      return await callGeminiMinutes();
    } catch (err: any) {
      if (openaiKey) {
        console.warn('Gemini failed, trying OpenAI GPT-4o fallback:', err);
        return await callOpenAIMinutes();
      }
      throw err;
    }
  }

  if (openaiKey) {
    try {
      return await callOpenAIMinutes();
    } catch (err: any) {
      if (geminiKey && preferredEngine !== 'openai') {
        console.warn('OpenAI failed, trying Gemini fallback:', err);
        return await callGeminiMinutes();
      }
      throw err;
    }
  }

  if (geminiKey) {
    return await callGeminiMinutes();
  }

  // (3) 키가 없으면 서버 라우트(/api/generate-minutes)로 요청
  const res = await fetch('/api/generate-minutes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      transcript,
      basicInfo,
    }),
  });

  const resText = await res.text();
  if (!res.ok) {
    let errMsg = 'AI 회의록 생성에 실패했습니다.';
    try {
      const data = JSON.parse(resText);
      errMsg = data.error || errMsg;
    } catch {
      errMsg = resText || errMsg;
    }
    throw new Error(errMsg);
  }

  const data = JSON.parse(resText);
  return {
    minutes: data.minutes,
    provider: data.provider || 'server',
  };
}
