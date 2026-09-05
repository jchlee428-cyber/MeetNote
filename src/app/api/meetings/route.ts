import { NextRequest, NextResponse } from 'next/server';
import { getMeetings, createMeeting } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 회의 목록 조회 (검색 파라미터 ?q=...)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const meetings = await getMeetings(query);
    return NextResponse.json({ success: true, meetings });
  } catch (error: any) {
    console.error('GET /api/meetings error:', error);
    return NextResponse.json({ error: '회의 목록을 불러오지 못했습니다.' }, { status: 500 });
  }
}

// 회의 저장
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const meeting = await createMeeting(body);
    return NextResponse.json({ success: true, meeting }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/meetings error:', error);
    return NextResponse.json({ error: '회의 저장에 실패했습니다.' }, { status: 500 });
  }
}
