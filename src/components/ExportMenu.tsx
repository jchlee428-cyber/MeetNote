'use client';

import React, { useState } from 'react';
import { Copy, Printer, FileDown, Check, Download } from 'lucide-react';
import { MeetingMinutes } from '@/types/meeting';

interface ExportMenuProps {
  minutes: MeetingMinutes;
  transcript?: string;
}

export default function ExportMenu({ minutes, transcript }: ExportMenuProps) {
  const [copied, setCopied] = useState(false);
  const [isDownloadingWord, setIsDownloadingWord] = useState(false);

  // 클립보드 복사 (깔끔한 텍스트 포맷)
  const handleCopyText = async () => {
    try {
      const text = formatMinutesAsText(minutes);
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('복사 실패:', err);
    }
  };

  // 인쇄 / PDF 저장
  const handlePrint = () => {
    window.print();
  };

  // Word (.docx) 다운로드
  const handleDownloadWord = async () => {
    try {
      setIsDownloadingWord(true);
      const response = await fetch('/api/export/word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minutes }),
      });

      if (!response.ok) {
        throw new Error('Word 파일 생성에 실패했습니다.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const title = minutes.basicInfo?.title || '회의록';
      a.download = `${title.replace(/[^a-zA-Z0-9가-힣\s_-]/g, '')}_회의록.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(err.message || '다운로드 중 오류가 발생했습니다.');
    } finally {
      setIsDownloadingWord(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 export-controls no-print">
      <button
        onClick={handleCopyText}
        className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm transition flex items-center gap-1.5 whitespace-nowrap"
        title="회의록 전체 텍스트 복사"
      >
        {copied ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />}
        <span>{copied ? '복사 완료' : '텍스트 복사'}</span>
      </button>

      <button
        onClick={handlePrint}
        className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm transition flex items-center gap-1.5 whitespace-nowrap"
        title="인쇄 또는 PDF로 저장"
      >
        <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />
        <span>인쇄 / PDF</span>
      </button>

      <button
        onClick={handleDownloadWord}
        disabled={isDownloadingWord}
        className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-bold text-xs sm:text-sm transition flex items-center gap-1.5 active:scale-95 disabled:opacity-50 whitespace-nowrap"
        title="Word(.docx) 파일로 다운로드"
      >
        <FileDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
        <span>{isDownloadingWord ? '생성 중...' : 'Word 다운로드'}</span>
      </button>
    </div>
  );
}

function formatMinutesAsText(minutes: MeetingMinutes): string {
  const { basicInfo, agenda, discussions, decisions, unresolved, opinions, actionItems, nextMeeting } = minutes;

  let out = `[회의록] ${basicInfo?.title || '회의록'}\n`;
  out += `==============================================\n\n`;

  out += `1. 회의 기본정보\n`;
  out += `- 일시: ${basicInfo?.dateTime || '미정'}\n`;
  out += `- 장소: ${basicInfo?.location || '미정'}\n`;
  out += `- 참석자: ${basicInfo?.attendees || '미정'}\n`;
  if (basicInfo?.objective) out += `- 회의 목적: ${basicInfo.objective}\n`;
  out += `\n`;

  out += `2. 주요 안건\n`;
  agenda.forEach((a, i) => {
    out += `  ${i + 1}. ${a.replace(/^\d+[\.\)]\s*/, '')}\n`;
  });
  out += `\n`;

  out += `3. 주요 논의 내용\n`;
  discussions.forEach((d) => {
    out += `  [안건 ${d.agendaNumber}] ${d.topic}\n`;
    out += `  ${d.summary}\n\n`;
  });

  out += `4. 결정사항 (의결/가결)\n`;
  decisions.forEach((dec) => {
    out += `  - ${dec}\n`;
  });
  out += `\n`;

  if (unresolved.length > 0) {
    out += `5. 미결사항 (보류/추후 논의)\n`;
    unresolved.forEach((unres) => {
      out += `  - ${unres}\n`;
    });
    out += `\n`;
  }

  if (opinions.length > 0) {
    out += `6. 찬반 또는 주요 의견\n`;
    opinions.forEach((op) => {
      out += `  - ${op}\n`;
    });
    out += `\n`;
  }

  if (actionItems.length > 0) {
    out += `7. 실행사항 (Action Items)\n`;
    out += `  업무 | 담당자 | 기한 | 상태\n`;
    out += `  ------------------------------------\n`;
    actionItems.forEach((item) => {
      out += `  ${item.task} | ${item.assignee || '미정'} | ${item.dueDate || '미정'} | ${item.status || '예정'}\n`;
    });
    out += `\n`;
  }

  out += `8. 다음 회의\n`;
  out += `- 일시: ${nextMeeting?.dateTime || '미정'}\n`;
  out += `- 장소: ${nextMeeting?.location || '미정'}\n`;
  if (nextMeeting?.note) out += `- 비고: ${nextMeeting.note}\n`;

  return out;
}
