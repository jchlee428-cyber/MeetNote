import { NextRequest, NextResponse } from 'next/server';
import { generateWordDocument } from '@/lib/export/word';
import { MeetingMinutes } from '@/types/meeting';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const minutes: MeetingMinutes = body.minutes;

    if (!minutes || !minutes.basicInfo) {
      return NextResponse.json({ error: '유효한 회의록 데이터가 없습니다.' }, { status: 400 });
    }

    const docBuffer = await generateWordDocument(minutes);
    const fileName = `${(minutes.basicInfo.title || '회의록').replace(/[^a-zA-Z0-9가-힣\s_-]/g, '')}_회의록.docx`;
    const encodedFileName = encodeURIComponent(fileName);

    const uint8Array = new Uint8Array(docBuffer);
    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodedFileName}`,
      },
    });
  } catch (error: any) {
    console.error('Word export error:', error);
    return NextResponse.json({ error: 'Word 문서 생성에 실패했습니다.' }, { status: 500 });
  }
}
