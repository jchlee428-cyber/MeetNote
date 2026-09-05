import { NextRequest, NextResponse } from 'next/server';
import { generateMeetingMinutes } from '@/lib/ai/minutes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { transcript, basicInfo } = body;

    if (!transcript || !transcript.trim()) {
      return NextResponse.json({ error: '전사된 한국어 텍스트가 없습니다.' }, { status: 400 });
    }

    const result = await generateMeetingMinutes({
      transcript: transcript.trim(),
      basicInfo,
    });

    return NextResponse.json({
      success: true,
      minutes: result.minutes,
      provider: result.provider,
    });
  } catch (error: any) {
    console.error('Generate minutes API error:', error);
    return NextResponse.json(
      {
        error: error.message || 'AI 회의록 생성에 실패했습니다. 다시 시도해주세요.',
      },
      { status: 500 }
    );
  }
}
