// 서버 사이드 음성 전사 모듈 (OpenAI Whisper & Gemini)

export interface TranscribeOptions {
  audioBuffer: Buffer;
  fileName: string;
  mimeType: string;
  title?: string;
  apiKey?: string;
  geminiKey?: string;
}

export interface TranscribeResponse {
  transcript: string;
  duration?: number;
  provider: 'openai-whisper' | 'gemini' | 'demo-fallback';
}

export function normalizeAudioMimeType(mimeType: string, fileName?: string): string {
  const lower = (mimeType || '').toLowerCase();
  const ext = (fileName || '').split('.').pop()?.toLowerCase();

  // Gemini 및 Whisper 지원 오디오 형식 정규화
  if (lower.includes('m4a') || lower.includes('mp4') || ext === 'm4a' || ext === 'mp4') {
    return 'audio/mp4';
  }
  if (lower.includes('mpeg') || lower.includes('mp3') || ext === 'mp3') {
    return 'audio/mp3';
  }
  if (lower.includes('wav') || ext === 'wav') {
    return 'audio/wav';
  }
  if (lower.includes('aac') || ext === 'aac') {
    return 'audio/aac';
  }
  if (lower.includes('ogg') || ext === 'ogg') {
    return 'audio/ogg';
  }
  if (lower.includes('flac') || ext === 'flac') {
    return 'audio/flac';
  }
  if (lower.includes('webm') || ext === 'webm') {
    return 'audio/webm';
  }
  return 'audio/mp4';
}

export async function transcribeAudio(options: TranscribeOptions): Promise<TranscribeResponse> {
  const openaiKey = options.apiKey?.trim() || process.env.OPENAI_API_KEY?.trim();
  const geminiKey = options.geminiKey?.trim() || process.env.GEMINI_API_KEY?.trim();

  // 1. API 키 미설정 시: 사용자에게 명확히 안내
  if (!openaiKey && !geminiKey) {
    throw new Error(
      'AI API 키가 설정되지 않았습니다. 상단 [API 설정] 메뉴에서 발급받으신 OpenAI 또는 Gemini API 키를 입력해 주세요. 실제 녹음 음성을 정확하게 텍스트로 변환하기 위해 필요합니다.'
    );
  }

  const normalizedMime = normalizeAudioMimeType(options.mimeType, options.fileName);
  let ext = normalizedMime.split('/')[1] || 'mp4';
  if (ext === 'mpeg') ext = 'mp3';
  const cleanFileName = options.fileName?.includes('.')
    ? options.fileName
    : `meeting_${Date.now()}.${ext}`;

  // 2. OpenAI Whisper API 시도 (OpenAI 키가 있을 때)
  if (openaiKey && openaiKey !== 'your_openai_api_key_here') {
    try {
      const formData = new FormData();
      const uint8Array = new Uint8Array(options.audioBuffer);
      const audioBlob = new Blob([uint8Array], { type: normalizedMime });
      formData.append('file', audioBlob, cleanFileName);
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

      if (!response.ok) {
        const errText = await response.text();
        console.error('OpenAI Whisper API error:', response.status, errText);
        let msg = `OpenAI Whisper 전사 실패 (${response.status}): ${errText}`;
        if (response.status === 401) msg = 'OpenAI API Key가 올바르지 않습니다. [API 설정]을 확인해주세요.';
        if (response.status === 429) msg = 'OpenAI API 크레딧 또는 사용량 한도를 초과했습니다.';
        throw new Error(msg);
      }

      const result = await response.json();
      return {
        transcript: result.text || '',
        duration: result.duration ? Math.round(result.duration) : undefined,
        provider: 'openai-whisper',
      };
    } catch (err: any) {
      if (!geminiKey) throw err;
      console.warn('Whisper API failed, trying Gemini audio fallback:', err.message);
    }
  }

  // 3. Gemini API 시도 (Gemini 키가 있을 때)
  if (geminiKey && geminiKey !== 'your_gemini_api_key_here') {
    const base64Audio = options.audioBuffer.toString('base64');
    const models = ['gemini-2.0-flash', 'gemini-1.5-flash'];
    let lastErrorMsg = '';

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

        if (!response.ok) {
          const errText = await response.text();
          console.error(`Gemini (${model}) Audio API error:`, response.status, errText);
          if (response.status === 400 && errText.includes('API_KEY_INVALID')) {
            throw new Error('Gemini API Key가 올바르지 않습니다. 상단 [API 설정]에서 키를 다시 확인해주세요.');
          }
          if (response.status === 429) {
            throw new Error('Gemini API 호출 한도를 초과했습니다 (429 Quota Exceeded). 잠시 후 다시 시도해주세요.');
          }
          lastErrorMsg = `${response.status}: ${errText}`;
          continue; // 다른 모델 시도
        }

        const data = await response.json();
        const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (generatedText && generatedText.trim()) {
          return {
            transcript: generatedText.trim(),
            provider: 'gemini',
          };
        }
      } catch (err: any) {
        if (err.message.includes('API Key') || err.message.includes('한도')) {
          throw err;
        }
        lastErrorMsg = err.message;
      }
    }

    throw new Error(`Gemini 음성 인식 실패: ${lastErrorMsg}`);
  }

  throw new Error('유효한 AI API Key를 찾을 수 없습니다. 상단 [API 설정]을 확인해주세요.');
}
