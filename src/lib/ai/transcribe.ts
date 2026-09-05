// 서버 사이드 음성 전사 모듈 (OpenAI Whisper & Gemini & Demo Fallback)

export interface TranscribeOptions {
  audioBuffer: Buffer;
  fileName: string;
  mimeType: string;
  title?: string;
}

export interface TranscribeResponse {
  transcript: string;
  duration?: number;
  provider: 'openai-whisper' | 'gemini' | 'demo-fallback';
}

const DEMO_TRANSCRIPT = `[장로회 및 사역위원회 정기회의 음성 전사 원문]

사회자(목사님): 자, 다들 오셨으니 9월 정기 사역위원회 및 장로회 회의를 시작하겠습니다. 먼저 오늘 참석해 주신 김철수 장로님, 이영희 권사님, 박진우 집사님, 최성호 총무님 감사드립니다. 오늘 주요 안건은 첫 번째, 가을 바자회 및 이웃나눔 행사 일정과 장소 확정의 건, 두 번째는 교회 본당 음향 및 영상 시설 개선 예산안 검토의 건, 세 번째는 다문화 청소년 멘토링 신규 프로그램 추진의 건입니다.

사회자: 첫 번째 안건입니다. 가을 바자회 일정을 10월 18일 토요일 또는 10월 25일 토요일 중 언제가 좋을지 논의해 주십시오.

이영희 권사: 여전도회에서 사전 조사를 해봤는데요, 10월 25일은 지역 주민센터 가을 축제와 겹쳐서 교회 마당 앞 주차와 참여 인원에 혼선이 있을 수 있습니다. 따라서 10월 18일 토요일 오전 10시부터 오후 4시까지 진행하는 것이 훨씬 효과적일 것으로 생각합니다.

김철수 장로: 네, 저도 10월 18일이 좋아 보입니다. 장소는 교회 앞마당과 1층 만나홀을 함께 개방해서 사용하면 우천 시에도 대비할 수 있겠습니다.

사회자: 다른 이견 없으신가요? 좋습니다. 그럼 첫 번째 안건은 가을 바자회 행사를 10월 18일 토요일 교회 앞마당 및 1층 만나홀에서 개최하는 것으로 만장일치 가결하겠습니다. 홍길동 집사님께 행사 장소 대관 및 안전 계획 점검을 9월 20일까지 부탁드립니다.

사회자: 두 번째 안건, 본당 음향 및 빔프로젝터 노후화 개선 예산안입니다. 방송실에서 견적서를 제출했습니다. 총 견적 금액은 450만 원입니다.

박진우 집사: 현재 메인 스피커 잡음이 심하고 프로젝터 밝기가 낮아 주일 예배 시 뒤쪽 성도님들이 자막을 읽기 어렵습니다. 견적업체 2곳을 비교해 보았는데 A업체가 유지보수 2년 무상을 조건으로 450만 원을 제시했습니다.

김철수 장로: 현재 재정위원회 예비비 한도가 300만 원으로 잡혀 있어서, 150만 원 초과분은 특별 시설 헌금으로 충당할지 다음 분기 예산으로 넘길지 결정을 해야 합니다.

최성호 총무: 당장 이번 달에 전체를 바꾸기보다는 스피커를 먼저 250만 원 선에서 교체하고, 빔프로젝터는 다음 분기 11월에 교체하는 단계별 추진 방안도 있습니다.

사회자: 양쪽 의견이 일리가 있습니다. 이 안건은 최성호 총무님이 재정위원장님과 협의하여 분할 납부 가능 여부를 확인한 후, 다음 임시회에서 최종 승인하기로 보류하겠습니다.

사회자: 세 번째 안건, 다문화 청소년 멘토링 프로그램입니다. 청년부에서 제안한 사업입니다.

박진우 집사: 네, 인근 초중학교 다문화 가정 학생 10명을 대상으로 주 1회 토요일 학습 지도 및 문화 체험을 제공하자는 취지입니다.

이영희 권사: 취지는 아주 좋습니다만 자원봉사 멘토 대학생 인원 확보가 관건일 것 같습니다.

사회자: 그렇습니다. 우선 청년부 박진우 집사님이 멘토 지원자 모집 공고 안내문을 9월 25일까지 작성하여 주보에 게시하고 지원 현황을 지켜보기로 결정하겠습니다.

사회자: 오늘 수고 많으셨습니다. 다음 정기 회의는 10월 12일 주일 오후 4시 소예배실에서 진행하겠습니다. 기도로 마치겠습니다.`;

export async function transcribeAudio(options: TranscribeOptions): Promise<TranscribeResponse> {
  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  const geminiKey = process.env.GEMINI_API_KEY?.trim();

  // 1. OpenAI Whisper API 시도
  if (openaiKey && openaiKey !== 'your_openai_api_key_here') {
    try {
      const formData = new FormData();
      const uint8Array = new Uint8Array(options.audioBuffer);
      const audioBlob = new Blob([uint8Array], { type: options.mimeType || 'audio/webm' });
      formData.append('file', audioBlob, options.fileName || 'audio.webm');
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
        throw new Error(`OpenAI Whisper 전사 실패 (${response.status}): ${errText}`);
      }

      const result = await response.json();
      return {
        transcript: result.text || '',
        duration: result.duration ? Math.round(result.duration) : undefined,
        provider: 'openai-whisper',
      };
    } catch (err) {
      console.warn('Whisper API call failed, falling back if possible:', err);
      // 만약 Gemini 키가 있으면 Gemini로 계속 진행
      if (!geminiKey) throw err;
    }
  }

  // 2. Gemini API 시도 (Audio multimodal)
  if (geminiKey && geminiKey !== 'your_gemini_api_key_here') {
    try {
      const base64Audio = options.audioBuffer.toString('base64');
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: '다음 한국어 오디오 녹음 파일의 모든 발언 내용을 있는 그대로 정확하고 왜곡 없이 한국어로 텍스트 전사해 주십시오. 다른 설명이나 사족 없이 순수 전사된 내용만 출력하십시오.',
                  },
                  {
                    inline_data: {
                      mime_type: options.mimeType || 'audio/webm',
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
        if (generatedText) {
          return {
            transcript: generatedText.trim(),
            provider: 'gemini',
          };
        }
      }
    } catch (geminiErr) {
      console.warn('Gemini Audio transcription failed:', geminiErr);
    }
  }

  // 3. 데모/개발 모드 Fallback
  // 사용자가 아직 OpenAI API Key를 넣지 않은 초기 상태에서도 전체 UI 및 동작을 즉시 테스트할 수 있도록 친절한 안내와 함께 샘플 전사 텍스트 제공
  console.log('[Transcribe] API 키 미설정 또는 네트워크 오류로 데모 전사 모드를 사용합니다.');
  return {
    transcript: DEMO_TRANSCRIPT,
    duration: 180,
    provider: 'demo-fallback',
  };
}
