import { NextRequest, NextResponse } from 'next/server';
import { transcribeAudio } from '@/lib/ai/transcribe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const title = (formData.get('title') as string) || '';

    if (!file) {
      return NextResponse.json({ error: '오디오 파일이 전송되지 않았습니다.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await transcribeAudio({
      audioBuffer: buffer,
      fileName: file.name || 'audio.webm',
      mimeType: file.type || 'audio/webm',
      title,
    });

    return NextResponse.json({
      success: true,
      transcript: result.transcript,
      duration: result.duration,
      provider: result.provider,
    });
  } catch (error: any) {
    console.error('Transcribe API error:', error);
    return NextResponse.json(
      {
        error: error.message || '음성을 텍스트로 변환하지 못했습니다. 잠시 후 다시 시도해주세요.',
      },
      { status: 500 }
    );
  }
}
