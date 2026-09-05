// AI 회의록 생성 모듈 (OpenAI GPT-4o & Gemini)
import { MeetingBasicInfo, MeetingMinutes } from '@/types/meeting';
import { MEETING_MINUTES_SYSTEM_PROMPT, buildUserPrompt } from './prompt';

export interface GenerateMinutesOptions {
  transcript: string;
  basicInfo?: Partial<MeetingBasicInfo>;
  apiKey?: string;
  geminiKey?: string;
}

export async function generateMeetingMinutes(
  options: GenerateMinutesOptions
): Promise<{ minutes: MeetingMinutes; provider: string }> {
  const { transcript, basicInfo } = options;
  const openaiKey = options.apiKey?.trim() || process.env.OPENAI_API_KEY?.trim();
  const geminiKey = options.geminiKey?.trim() || process.env.GEMINI_API_KEY?.trim();

  if (!openaiKey && !geminiKey) {
    throw new Error(
      'AI 회의록 작성을 위한 API 키가 설정되지 않았습니다. 상단 [API 설정] 메뉴에서 OpenAI 또는 Gemini 키를 입력해 주세요.'
    );
  }

  const userPrompt = buildUserPrompt(transcript, {
    title: basicInfo?.title,
    location: basicInfo?.location,
    attendees: basicInfo?.attendees,
  });

  // 1. OpenAI GPT-4o 시도
  if (openaiKey && openaiKey !== 'your_openai_api_key_here') {
    try {
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
          temperature: 0.2, // 환각 방지 및 일관성을 위해 낮은 온도
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
            provider: 'openai-gpt-4o',
          };
        }
      } else {
        const err = await response.text();
        console.error('OpenAI Chat Completion failed:', response.status, err);
        if (!geminiKey) {
          throw new Error(`OpenAI 회의록 생성 실패 (${response.status}): ${err}`);
        }
      }
    } catch (err: any) {
      if (!geminiKey) throw err;
      console.warn('OpenAI generate minutes failed, trying Gemini:', err.message);
    }
  }

  // 2. Google Gemini 시도
  if (geminiKey && geminiKey !== 'your_gemini_api_key_here') {
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

        if (!response.ok) {
          const errText = await response.text();
          console.error(`Gemini (${model}) generate minutes error:`, response.status, errText);
          lastError = `${response.status}: ${errText}`;
          continue;
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = JSON.parse(cleanJsonResponse(text));
          return {
            minutes: normalizeMinutes(parsed, basicInfo),
            provider: `gemini-${model}`,
          };
        }
      } catch (err: any) {
        lastError = err.message;
      }
    }

    throw new Error(`Gemini 회의록 생성 실패: ${lastError}`);
  }

  throw new Error('회의록을 생성할 수 있는 AI API Key가 없습니다.');
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
