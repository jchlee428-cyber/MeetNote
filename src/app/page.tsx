import Link from 'next/link';
import { Mic, Sparkles, Shield, Clock, FileCheck, CheckCircle2 } from 'lucide-react';
import MeetingList from '@/components/MeetingList';
import { getMeetings } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const initialMeetings = await getMeetings();

  return (
    <div className="space-y-10">
      {/* 1. 히어로 섹션 (Section 13 요구사항 준수: 직관적이고 큰 버튼) */}
      <section className="text-center py-6 sm:py-10 bg-gradient-to-b from-blue-50/70 via-white to-transparent rounded-3xl p-6 sm:p-10 border border-blue-100 shadow-xs">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/80 text-blue-800 text-xs font-bold mb-4">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Whisper 음성인식 & AI 전문 회의록</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          AI 음성 회의록
        </h1>

        <p className="text-base sm:text-xl text-slate-600 font-medium mt-3 max-w-lg mx-auto">
          음성으로 회의록을 자동으로 만들어보세요.
        </p>

        {/* 60대 이상 시니어 사용자도 한눈에 누를 수 있는 초대형 CTA 버튼 */}
        <div className="mt-8">
          <Link
            href="/record"
            className="inline-flex items-center justify-center gap-3 w-full sm:w-auto px-10 py-5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black text-xl shadow-xl shadow-blue-500/25 hover:shadow-2xl hover:scale-[1.02] active:scale-95 transition-all duration-200"
          >
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Mic className="w-6 h-6 text-white" />
            </div>
            <span>🎙 회의 녹음 시작</span>
          </Link>
        </div>

        {/* 회의 유형 태그 안내 */}
        <div className="mt-8 pt-6 border-t border-slate-200/60 max-w-2xl mx-auto">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
            최적화된 회의 유형
          </p>
          <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs text-slate-600">
            {['당회', '제직회', '장로회', '사역위원회', '목장/셀 모임', '중보기도팀', '비영리단체', '사업회의', '주민회의'].map(
              (tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-semibold shadow-2xs"
                >
                  {tag}
                </span>
              )
            )}
          </div>
        </div>
      </section>

      {/* 2. 핵심 프로세스 안내 카드 (3단계) */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 font-bold">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-sm">1. 스마트폰 간편 녹음</h2>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              설치 없이 브라우저에서 바로 고음질 녹음 및 실시간 파형 확인
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-sm">2. Whisper 한국어 전사</h2>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              전문 음성인식 AI가 왜곡 없이 실제 한국어 발언을 텍스트로 변환
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 font-bold">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-sm">3. 8단계 정형 회의록</h2>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              결정사항, 미결사항, 실행과제표까지 완성하여 Word/PDF로 출력
            </p>
          </div>
        </div>
      </section>

      {/* 3. 최근 회의 목록 섹션 (Section 11 요구사항) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">최근 회의</h2>
            <p className="text-xs text-slate-500 mt-0.5">과거 회의록을 열람하거나 검색하고 다운로드하세요.</p>
          </div>
        </div>

        <MeetingList initialMeetings={initialMeetings} />
      </section>
    </div>
  );
}
