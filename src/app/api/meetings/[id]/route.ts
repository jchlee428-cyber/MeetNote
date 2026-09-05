import { NextRequest, NextResponse } from 'next/server';
import { getMeetingById, updateMeeting, deleteMeeting } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// 특정 회의 상세 조회
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const meeting = await getMeetingById(id);
    if (!meeting) {
      return NextResponse.json({ error: '해당 회의를 찾을 수 없습니다.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, meeting });
  } catch (error: any) {
    console.error('GET /api/meetings/[id] error:', error);
    return NextResponse.json({ error: '회의를 조회하지 못했습니다.' }, { status: 500 });
  }
}

// 회의 내용 수정 (회의록 편집 저장)
export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const updated = await updateMeeting(id, body);
    if (!updated) {
      return NextResponse.json({ error: '수정할 회의를 찾을 수 없습니다.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, meeting: updated });
  } catch (error: any) {
    console.error('PUT /api/meetings/[id] error:', error);
    return NextResponse.json({ error: '회의 수정에 실패했습니다.' }, { status: 500 });
  }
}

// 회의 삭제
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const success = await deleteMeeting(id);
    if (!success) {
      return NextResponse.json({ error: '삭제할 회의를 찾을 수 없습니다.' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/meetings/[id] error:', error);
    return NextResponse.json({ error: '회의 삭제에 실패했습니다.' }, { status: 500 });
  }
}
