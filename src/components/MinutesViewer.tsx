'use client';

import React from 'react';
import { MeetingMinutes } from '@/types/meeting';
import {
  Calendar,
  MapPin,
  Users,
  Target,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  CheckSquare,
} from 'lucide-react';

interface MinutesViewerProps {
  minutes: MeetingMinutes;
}

export default function MinutesViewer({ minutes }: MinutesViewerProps) {
  const { basicInfo, agenda, discussions, decisions, unresolved, opinions, actionItems, nextMeeting } = minutes;

  return (
    <div className="minutes-document bg-white rounded-2xl p-6 sm:p-10 border border-slate-200 shadow-sm max-w-4xl mx-auto my-6">
      {/* 회의록 메인 헤더 */}
      <div className="text-center pb-6 border-b-2 border-slate-900/10">
        <span className="text-xs font-bold tracking-widest text-blue-600 uppercase bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
          Official Meeting Minutes
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-3 tracking-tight">
          {basicInfo?.title || '회의록'}
        </h1>
        <p className="text-sm text-slate-500 mt-1">인공지능 회의 비서 자동 생성 및 공인 양식</p>
      </div>

      {/* ① 회의 기본정보 */}
      <section className="mt-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
            1
          </span>
          <h2 className="text-lg font-bold text-slate-900">회의 기본정보</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm">
          <div className="flex items-center gap-2 text-slate-700">
            <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="font-semibold text-slate-500 w-16">일시:</span>
            <span className="font-medium text-slate-900">{basicInfo?.dateTime || '미정'}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="font-semibold text-slate-500 w-16">장소:</span>
            <span className="font-medium text-slate-900">{basicInfo?.location || '미정'}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700 sm:col-span-2">
            <Users className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="font-semibold text-slate-500 w-16">참석자:</span>
            <span className="font-medium text-slate-900">{basicInfo?.attendees || '미정'}</span>
          </div>
          {basicInfo?.objective && (
            <div className="flex items-start gap-2 text-slate-700 sm:col-span-2 pt-1 border-t border-slate-200/60">
              <Target className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span className="font-semibold text-slate-500 w-16">목적:</span>
              <span className="font-medium text-slate-900">{basicInfo.objective}</span>
            </div>
          )}
        </div>
      </section>

      {/* ② 주요 안건 */}
      <section className="mt-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
            2
          </span>
          <h2 className="text-lg font-bold text-slate-900">주요 안건</h2>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
          {agenda && agenda.length > 0 ? (
            agenda.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-base text-slate-800">
                <span className="font-bold text-blue-600 shrink-0">{idx + 1}.</span>
                <span>{item.replace(/^\d+[\.\)]\s*/, '')}</span>
              </div>
            ))
          ) : (
            <p className="text-slate-400 text-sm">상정된 안건이 없습니다.</p>
          )}
        </div>
      </section>

      {/* ③ 주요 논의 내용 */}
      <section className="mt-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
            3
          </span>
          <h2 className="text-lg font-bold text-slate-900">주요 논의 내용</h2>
        </div>

        <div className="space-y-3">
          {discussions && discussions.length > 0 ? (
            discussions.map((disc, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-slate-200 text-slate-800 rounded text-xs">
                    안건 {disc.agendaNumber || idx + 1}
                  </span>
                  {disc.topic}
                </h3>
                <p className="text-slate-700 text-sm mt-2 leading-relaxed whitespace-pre-wrap pl-1">
                  {disc.summary}
                </p>
              </div>
            ))
          ) : (
            <p className="text-slate-400 text-sm">논의 내용이 없습니다.</p>
          )}
        </div>
      </section>

      {/* ④ 결정사항 (가결 사항만 녹색 강조) */}
      <section className="mt-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-6 h-6 rounded-md bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
            4
          </span>
          <h2 className="text-lg font-bold text-emerald-900">결정사항 (의결/가결)</h2>
        </div>

        <div className="bg-emerald-50/80 border-2 border-emerald-200/90 rounded-xl p-4 sm:p-5">
          {decisions && decisions.length > 0 ? (
            <ul className="space-y-2.5">
              {decisions.map((dec, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-emerald-950 font-medium text-base">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="leading-snug">{dec}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500 text-sm">회의에서 명확히 결정된 사항이 없습니다.</p>
          )}
        </div>
      </section>

      {/* ⑤ 미결사항 (보류/차기 논의 주황색) */}
      <section className="mt-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-6 h-6 rounded-md bg-amber-600 text-white flex items-center justify-center font-bold text-xs">
            5
          </span>
          <h2 className="text-lg font-bold text-amber-900">미결사항 (보류/추후 논의)</h2>
        </div>

        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4">
          {unresolved && unresolved.length > 0 ? (
            <ul className="space-y-2">
              {unresolved.map((unres, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-amber-950 text-sm">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>{unres}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500 text-sm">미결된 사항이 없습니다.</p>
          )}
        </div>
      </section>

      {/* ⑥ 찬반 또는 주요 의견 */}
      <section className="mt-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
            6
          </span>
          <h2 className="text-lg font-bold text-slate-900">찬반 또는 주요 의견</h2>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          {opinions && opinions.length > 0 ? (
            <ul className="space-y-2">
              {opinions.map((op, idx) => (
                <li key={idx} className="flex items-start gap-2 text-slate-700 text-sm">
                  <HelpCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <span>{op}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-400 text-sm">특이 이견 사항이 없습니다.</p>
          )}
        </div>
      </section>

      {/* ⑦ 실행사항(Action Items) */}
      <section className="mt-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
            7
          </span>
          <h2 className="text-lg font-bold text-slate-900">실행사항 (Action Items)</h2>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700">
                <th className="py-3 px-4 font-bold">업무 내용</th>
                <th className="py-3 px-4 font-bold text-center w-28">담당자</th>
                <th className="py-3 px-4 font-bold text-center w-28">기한</th>
                <th className="py-3 px-4 font-bold text-center w-24">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {actionItems && actionItems.length > 0 ? (
                actionItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-900">{item.task}</td>
                    <td className="py-3 px-4 text-center text-slate-600">{item.assignee || '미정'}</td>
                    <td className="py-3 px-4 text-center text-slate-600">{item.dueDate || '미정'}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          item.status === '완료'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.status === '진행중'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.status || '예정'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-slate-400">
                    등록된 실행사항이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ⑧ 다음 회의 */}
      <section className="mt-8 pt-6 border-t border-slate-200">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
            8
          </span>
          <h2 className="text-lg font-bold text-slate-900">다음 회의 일정</h2>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row gap-4 text-sm">
          <div className="flex items-center gap-2 text-slate-700">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-slate-500">일시:</span>
            <span className="font-medium text-slate-900">{nextMeeting?.dateTime || '미정'}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-slate-500">장소:</span>
            <span className="font-medium text-slate-900">{nextMeeting?.location || '미정'}</span>
          </div>
          {nextMeeting?.note && (
            <div className="flex items-center gap-2 text-slate-700 sm:ml-auto">
              <span className="font-semibold text-slate-500">비고:</span>
              <span className="text-slate-600">{nextMeeting.note}</span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
