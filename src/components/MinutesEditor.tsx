'use client';

import React, { useState } from 'react';
import { MeetingMinutes, ActionItem, AgendaDiscussion } from '@/types/meeting';
import { Plus, Trash2, Save, X } from 'lucide-react';

interface MinutesEditorProps {
  initialMinutes: MeetingMinutes;
  onSave: (updated: MeetingMinutes) => void;
  onCancel?: () => void;
  isSaving?: boolean;
}

export default function MinutesEditor({
  initialMinutes,
  onSave,
  onCancel,
  isSaving = false,
}: MinutesEditorProps) {
  const [minutes, setMinutes] = useState<MeetingMinutes>(JSON.parse(JSON.stringify(initialMinutes)));

  // 기본 정보 수정
  const handleBasicChange = (field: string, val: string) => {
    setMinutes((prev) => ({
      ...prev,
      basicInfo: { ...prev.basicInfo, [field]: val },
    }));
  };

  // 안건 수정/추가/삭제
  const handleAgendaChange = (idx: number, val: string) => {
    setMinutes((prev) => {
      const next = [...prev.agenda];
      next[idx] = val;
      return { ...prev, agenda: next };
    });
  };

  const handleAddAgenda = () => {
    setMinutes((prev) => ({
      ...prev,
      agenda: [...prev.agenda, `${prev.agenda.length + 1}. 새로운 안건`],
    }));
  };

  const handleRemoveAgenda = (idx: number) => {
    setMinutes((prev) => ({
      ...prev,
      agenda: prev.agenda.filter((_, i) => i !== idx),
    }));
  };

  // 논의 내용 수정/추가/삭제
  const handleDiscussionChange = (idx: number, field: keyof AgendaDiscussion, val: any) => {
    setMinutes((prev) => {
      const next = [...prev.discussions];
      next[idx] = { ...next[idx], [field]: val };
      return { ...prev, discussions: next };
    });
  };

  const handleAddDiscussion = () => {
    setMinutes((prev) => ({
      ...prev,
      discussions: [
        ...prev.discussions,
        {
          agendaNumber: prev.discussions.length + 1,
          topic: '새로운 논의 안건',
          summary: '논의 내용을 입력하세요.',
        },
      ],
    }));
  };

  const handleRemoveDiscussion = (idx: number) => {
    setMinutes((prev) => ({
      ...prev,
      discussions: prev.discussions.filter((_, i) => i !== idx),
    }));
  };

  // 결정사항 수정/추가/삭제
  const handleDecisionChange = (idx: number, val: string) => {
    setMinutes((prev) => {
      const next = [...prev.decisions];
      next[idx] = val;
      return { ...prev, decisions: next };
    });
  };

  const handleAddDecision = () => {
    setMinutes((prev) => ({
      ...prev,
      decisions: [...prev.decisions, '새로운 결정사항'],
    }));
  };

  const handleRemoveDecision = (idx: number) => {
    setMinutes((prev) => ({
      ...prev,
      decisions: prev.decisions.filter((_, i) => i !== idx),
    }));
  };

  // 미결사항 수정/추가/삭제
  const handleUnresolvedChange = (idx: number, val: string) => {
    setMinutes((prev) => {
      const next = [...prev.unresolved];
      next[idx] = val;
      return { ...prev, unresolved: next };
    });
  };

  const handleAddUnresolved = () => {
    setMinutes((prev) => ({
      ...prev,
      unresolved: [...prev.unresolved, '추후 논의할 미결사항'],
    }));
  };

  const handleRemoveUnresolved = (idx: number) => {
    setMinutes((prev) => ({
      ...prev,
      unresolved: prev.unresolved.filter((_, i) => i !== idx),
    }));
  };

  // 찬반 또는 주요 의견 수정/추가/삭제
  const handleOpinionChange = (idx: number, val: string) => {
    setMinutes((prev) => {
      const next = [...(prev.opinions || [])];
      next[idx] = val;
      return { ...prev, opinions: next };
    });
  };

  const handleAddOpinion = () => {
    setMinutes((prev) => ({
      ...prev,
      opinions: [...(prev.opinions || []), '주요 의견 또는 이견'],
    }));
  };

  const handleRemoveOpinion = (idx: number) => {
    setMinutes((prev) => ({
      ...prev,
      opinions: (prev.opinions || []).filter((_, i) => i !== idx),
    }));
  };

  // 실행사항(Action Items) 수정/추가/삭제
  const handleActionItemChange = (idx: number, field: keyof ActionItem, val: string) => {
    setMinutes((prev) => {
      const next = [...prev.actionItems];
      next[idx] = { ...next[idx], [field]: val };
      return { ...prev, actionItems: next };
    });
  };

  const handleAddActionItem = () => {
    setMinutes((prev) => ({
      ...prev,
      actionItems: [
        ...prev.actionItems,
        { task: '신규 업무', assignee: '미정', dueDate: '미정', status: '예정' },
      ],
    }));
  };

  const handleRemoveActionItem = (idx: number) => {
    setMinutes((prev) => ({
      ...prev,
      actionItems: prev.actionItems.filter((_, i) => i !== idx),
    }));
  };

  // 다음 회의 수정
  const handleNextMeetingChange = (field: string, val: string) => {
    setMinutes((prev) => ({
      ...prev,
      nextMeeting: { ...prev.nextMeeting, [field]: val },
    }));
  };

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 border-2 border-blue-200 shadow-sm max-w-4xl mx-auto my-4 sm:my-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900">회의록 수정</h2>
          <p className="text-xs text-slate-500 mt-0.5">각 영역의 내용을 직접 검토하고 수정할 수 있습니다.</p>
        </div>
        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 bg-slate-100 rounded-xl transition"
            >
              취소
            </button>
          )}
          <button
            onClick={() => onSave(minutes)}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm hover:shadow flex items-center gap-2 transition active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? '저장 중...' : '저장 완료'}</span>
          </button>
        </div>
      </div>

      <div className="space-y-8 mt-6">
        {/* ① 기본정보 편집 */}
        <div>
          <h3 className="text-base font-bold text-slate-900 mb-3">1. 회의 기본정보</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">회의명</label>
              <input
                type="text"
                value={minutes.basicInfo?.title || ''}
                onChange={(e) => handleBasicChange('title', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">일시</label>
              <input
                type="text"
                value={minutes.basicInfo?.dateTime || ''}
                onChange={(e) => handleBasicChange('dateTime', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">장소</label>
              <input
                type="text"
                value={minutes.basicInfo?.location || ''}
                onChange={(e) => handleBasicChange('location', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">참석자</label>
              <input
                type="text"
                value={minutes.basicInfo?.attendees || ''}
                onChange={(e) => handleBasicChange('attendees', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">회의 목적</label>
              <input
                type="text"
                value={minutes.basicInfo?.objective || ''}
                onChange={(e) => handleBasicChange('objective', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
          </div>
        </div>

        {/* ② 주요 안건 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-slate-900">2. 주요 안건</h3>
            <button
              onClick={handleAddAgenda}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> 안건 추가
            </button>
          </div>
          <div className="space-y-2">
            {minutes.agenda.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => handleAgendaChange(idx, e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveAgenda(idx)}
                  className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition"
                  title="삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ③ 주요 논의 내용 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-slate-900">3. 주요 논의 내용</h3>
            <button
              type="button"
              onClick={handleAddDiscussion}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> 논의 추가
            </button>
          </div>
          <div className="space-y-4">
            {minutes.discussions.map((disc, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">안건 번호:</span>
                  <input
                    type="number"
                    value={disc.agendaNumber || idx + 1}
                    onChange={(e) => handleDiscussionChange(idx, 'agendaNumber', parseInt(e.target.value) || 1)}
                    className="w-16 px-2 py-1 text-xs rounded border border-slate-300"
                  />
                  <input
                    type="text"
                    value={disc.topic}
                    onChange={(e) => handleDiscussionChange(idx, 'topic', e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-sm font-semibold"
                    placeholder="안건 제목"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveDiscussion(idx)}
                    className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition"
                    title="삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <textarea
                  value={disc.summary}
                  onChange={(e) => handleDiscussionChange(idx, 'summary', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm resize-y"
                  placeholder="참석자 발언 및 논의 내용 요약"
                />
              </div>
            ))}
          </div>
        </div>

        {/* ④ 결정사항 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-emerald-800">4. 결정사항 (의결/가결)</h3>
            <button
              type="button"
              onClick={handleAddDecision}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> 결정사항 추가
            </button>
          </div>
          <div className="space-y-2">
            {minutes.decisions.map((dec, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={dec}
                  onChange={(e) => handleDecisionChange(idx, e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border-2 border-emerald-200 focus:ring-2 focus:ring-emerald-400 text-sm"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveDecision(idx)}
                  className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition"
                  title="삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ⑤ 미결사항 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-amber-800">5. 미결사항 (보류)</h3>
            <button
              onClick={handleAddUnresolved}
              className="text-xs font-semibold text-amber-700 hover:text-amber-900 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> 미결사항 추가
            </button>
          </div>
          <div className="space-y-2">
            {minutes.unresolved.map((unres, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={unres}
                  onChange={(e) => handleUnresolvedChange(idx, e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-amber-200 focus:ring-2 focus:ring-amber-400 text-sm"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveUnresolved(idx)}
                  className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition"
                  title="삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ⑥ 찬반 또는 주요 의견 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-slate-900">6. 찬반 또는 주요 의견</h3>
            <button
              type="button"
              onClick={handleAddOpinion}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> 의견 추가
            </button>
          </div>
          <div className="space-y-2">
            {(minutes.opinions || []).map((op, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={op}
                  onChange={(e) => handleOpinionChange(idx, e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-400 text-sm"
                  placeholder="참석자 발언 또는 주요 이견"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveOpinion(idx)}
                  className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition"
                  title="삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ⑦ 실행사항(Action Items) 테이블 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-slate-900">7. 실행사항 (Action Items)</h3>
            <button
              onClick={handleAddActionItem}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> 항목 추가
            </button>
          </div>
          <div className="space-y-3">
            {minutes.actionItems.map((item, idx) => (
              <div key={idx} className="p-3 sm:p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-600">업무 #{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveActionItem(idx)}
                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition"
                    title="삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <input
                    type="text"
                    value={item.task}
                    onChange={(e) => handleActionItemChange(idx, 'task', e.target.value)}
                    placeholder="업무 내용 (예: 안내문 발송, 예산안 정리 등)"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">담당자</label>
                    <input
                      type="text"
                      value={item.assignee}
                      onChange={(e) => handleActionItemChange(idx, 'assignee', e.target.value)}
                      placeholder="담당자"
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs sm:text-sm text-center bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">기한</label>
                    <input
                      type="text"
                      value={item.dueDate}
                      onChange={(e) => handleActionItemChange(idx, 'dueDate', e.target.value)}
                      placeholder="기한"
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs sm:text-sm text-center bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">상태</label>
                    <select
                      value={item.status}
                      onChange={(e) => handleActionItemChange(idx, 'status', e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs sm:text-sm bg-white font-medium"
                    >
                      <option value="예정">예정</option>
                      <option value="진행중">진행중</option>
                      <option value="완료">완료</option>
                      <option value="보류">보류</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ⑧ 다음 회의 */}
        <div>
          <h3 className="text-base font-bold text-slate-900 mb-3">8. 다음 회의 일정</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">일시</label>
              <input
                type="text"
                value={minutes.nextMeeting?.dateTime || ''}
                onChange={(e) => handleNextMeetingChange('dateTime', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">장소</label>
              <input
                type="text"
                value={minutes.nextMeeting?.location || ''}
                onChange={(e) => handleNextMeetingChange('location', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">비고</label>
              <input
                type="text"
                value={minutes.nextMeeting?.note || ''}
                onChange={(e) => handleNextMeetingChange('note', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end gap-3">
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition"
          >
            취소
          </button>
        )}
        <button
          onClick={() => onSave(minutes)}
          disabled={isSaving}
          className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md hover:shadow transition flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? '저장 중...' : '수정사항 저장하기'}</span>
        </button>
      </div>
    </div>
  );
}
