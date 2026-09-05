'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mic, Pause, Play, Square, Upload, AlertCircle, Clock, HardDrive, Calendar } from 'lucide-react';
import AudioWaveform from './AudioWaveform';

interface AudioRecorderProps {
  onRecordingComplete: (file: File, meta: { title: string; location: string; participants: string }) => void;
  disabled?: boolean;
}

export default function AudioRecorder({ onRecordingComplete, disabled = false }: AudioRecorderProps) {
  // 녹음 상태
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [micError, setMicError] = useState<string | null>(null);

  // 녹음 후 메타데이터 입력
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [participants, setParticipants] = useState('');

  // 탭 (직접 녹음 vs 파일 업로드)
  const [mode, setMode] = useState<'record' | 'upload'>('record');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 시간 포맷팅 (00:23:41)
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  // 타이머 작동
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerIntervalRef.current = setInterval(() => {
        setRecordSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isRecording, isPaused]);

  // 브라우저 지원 MIME 타입 결정
  const getSupportedMimeType = () => {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/aac',
      'audio/wav',
      'audio/ogg',
    ];
    for (const type of types) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return 'audio/webm';
  };

  // 녹음 시작
  const startRecording = async () => {
    setMicError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('사용하시는 브라우저가 오디오 녹음 기능을 지원하지 않습니다.');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      setStream(mediaStream);
      audioChunksRef.current = [];

      const mimeType = getSupportedMimeType();
      const recorder = new MediaRecorder(mediaStream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('wav') ? 'wav' : 'webm';
        const file = new File([blob], `meeting_${Date.now()}.${ext}`, { type: mimeType });
        setAudioFile(file);

        // 기본 제목 자동 입력 (현재 날짜 기준)
        if (!title) {
          const now = new Date();
          setTitle(`${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일 정기 회의`);
        }

        // 스트림 해제
        mediaStream.getTracks().forEach((track) => track.stop());
        setStream(null);
      };

      recorder.start(1000); // 1초마다 데이터 청크
      setIsRecording(true);
      setIsPaused(false);
      setRecordSeconds(0);
    } catch (err: any) {
      console.error('마이크 권한 거부 또는 녹음 오류:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicError('마이크 사용 권한이 필요합니다. 휴대폰의 브라우저 설정에서 마이크 권한을 허용해주세요.');
      } else {
        setMicError(err.message || '마이크를 초기화할 수 없습니다.');
      }
    }
  };

  // 일시정지
  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  };

  // 다시 시작
  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    }
  };

  // 녹음 종료
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
    }
  };

  // 직접 오디오 파일 업로드 처리
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioFile(file);
      setAudioBlob(file);
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      setRecordSeconds(0);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  // 음성 전사 시작 버튼 클릭
  const handleSubmit = () => {
    if (!audioFile) {
      alert('녹음 또는 업로드된 음성 파일이 없습니다.');
      return;
    }
    onRecordingComplete(audioFile, {
      title: title || '정기 회의록',
      location: location || '회의실',
      participants: participants || '참석자 일동',
    });
  };

  // 재녹음 하기
  const handleReset = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setAudioBlob(null);
    setAudioFile(null);
    setRecordSeconds(0);
    setIsRecording(false);
    setIsPaused(false);
    setMicError(null);
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-lg shadow-slate-100">
      {/* 탭: 직접 녹음 vs 기존 음성 파일 업로드 */}
      {!audioBlob && !isRecording && (
        <div className="flex bg-slate-100 p-1 rounded-2xl mb-8">
          <button
            onClick={() => {
              setMode('record');
              setMicError(null);
            }}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              mode === 'record' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Mic className="w-4 h-4" />
            휴대폰 마이크 녹음
          </button>
          <button
            onClick={() => {
              setMode('upload');
              setMicError(null);
            }}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              mode === 'upload' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Upload className="w-4 h-4" />
            음성 파일 업로드
          </button>
        </div>
      )}

      {/* 마이크 권한 에러 알림 (녹음 모드일 때만 표시) */}
      {mode === 'record' && micError && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">마이크 권한 필요</p>
            <p className="mt-1 leading-relaxed">{micError}</p>
          </div>
        </div>
      )}

      {/* 1. 녹음 전 / 녹음 진행 화면 */}
      {!audioBlob ? (
        mode === 'record' ? (
          <div className="flex flex-col items-center justify-center py-4">
            {/* 녹음 상태 표시 */}
            {isRecording ? (
              <div className="w-full text-center mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-600 font-bold text-sm mb-4">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></span>
                  <span>{isPaused ? '일시정지 중' : '녹음 중'}</span>
                </div>

                <div className="text-4xl sm:text-5xl font-black text-slate-900 tracking-wider font-mono">
                  {formatTime(recordSeconds)}
                </div>

                {/* 실시간 파형 시각화 */}
                <div className="mt-4">
                  <AudioWaveform stream={stream} isRecording={isRecording} isPaused={isPaused} />
                </div>
              </div>
            ) : (
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">회의 녹음 시작</h2>
                <p className="text-slate-500 text-sm mt-2 max-w-sm mx-auto">
                  버튼을 누르면 스마트폰 마이크로 회의 음성을 선명하게 기록합니다.
                </p>
              </div>
            )}

            {/* 메인 컨트롤 버튼: 텍스트 없이 마이크만 멋지게 나오는 원형 버튼 */}
            {!isRecording ? (
              <div className="flex flex-col items-center justify-center my-4">
                <button
                  type="button"
                  onClick={startRecording}
                  disabled={disabled}
                  aria-label="회의 녹음 시작"
                  title="회의 녹음 시작"
                  className="group relative inline-flex items-center justify-center cursor-pointer focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {/* 외곽 펄스 앰비언트 네온 글로우 */}
                  <span className="absolute -inset-3 sm:-inset-4 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-400 opacity-50 blur-xl sm:blur-2xl group-hover:opacity-90 group-hover:scale-110 transition-all duration-500 animate-pulse"></span>

                  {/* 투명 외곽 링 레이어 */}
                  <span className="relative flex items-center justify-center p-3 sm:p-4 rounded-full bg-white/80 backdrop-blur-sm border border-blue-200/80 shadow-xl shadow-blue-500/20 group-hover:border-blue-300 transition-all duration-300">
                    {/* 메인 마이크 오브 버튼 */}
                    <span className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 text-white flex items-center justify-center shadow-2xl shadow-blue-600/50 border-2 border-white/50 group-hover:scale-105 active:scale-95 transition-all duration-300">
                      <Mic className="w-12 h-12 sm:w-14 sm:h-14 text-white drop-shadow-lg group-hover:scale-110 transition-transform duration-300" />
                    </span>
                  </span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4 w-full justify-center">
                {/* 일시정지 / 다시 시작 */}
                {isPaused ? (
                  <button
                    onClick={resumeRecording}
                    className="flex-1 max-w-[140px] py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm flex items-center justify-center gap-2 transition active:scale-95"
                  >
                    <Play className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                    <span>다시 시작</span>
                  </button>
                ) : (
                  <button
                    onClick={pauseRecording}
                    className="flex-1 max-w-[140px] py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm flex items-center justify-center gap-2 transition active:scale-95"
                  >
                    <Pause className="w-4 h-4 text-slate-700" />
                    <span>일시정지</span>
                  </button>
                )}

                {/* 녹음 종료 */}
                <button
                  onClick={stopRecording}
                  className="flex-1 max-w-[160px] py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition active:scale-95"
                >
                  <Square className="w-4 h-4 fill-white" />
                  <span>녹음 종료</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* 기존 음성 파일 업로드 모드 */
          <div className="py-6 text-center">
            <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-3xl p-8 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-blue-50/20 transition-all block">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                <Upload className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">음성 파일 선택</h3>
              <p className="text-xs text-slate-500 mt-1">m4a, mp3, wav, webm, ogg 지원</p>
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        )
      ) : (
        /* 2. 녹음 완료 화면: 세부 정보 입력 및 전사 시작 */
        <div className="space-y-6">
          <div className="text-center pb-4 border-b border-slate-100">
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              녹음 완료
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-2">회의 정보 입력</h2>
            <p className="text-xs text-slate-500 mt-0.5">정확한 회의록 작성을 위해 기본 정보를 확인해주세요.</p>
          </div>

          {/* 녹음 정보 요약 배너 */}
          <div className="grid grid-cols-3 gap-2 p-3.5 bg-slate-50 rounded-2xl text-center border border-slate-200/80">
            <div>
              <div className="text-xs text-slate-500 flex items-center justify-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                녹음 시간
              </div>
              <div className="font-bold text-sm text-slate-800 mt-1">
                {recordSeconds > 0 ? formatTime(recordSeconds) : '음성 파일'}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 flex items-center justify-center gap-1">
                <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                파일 크기
              </div>
              <div className="font-bold text-sm text-slate-800 mt-1">
                {audioFile ? `${(audioFile.size / (1024 * 1024)).toFixed(2)} MB` : '-'}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 flex items-center justify-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                녹음 날짜
              </div>
              <div className="font-bold text-sm text-slate-800 mt-1">
                {new Date().toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}
              </div>
            </div>
          </div>

          {/* 녹음 음성 미리듣기 */}
          {audioUrl && (
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-600">녹음된 음성 미리듣기</span>
              <audio controls src={audioUrl} className="w-full h-10" />
            </div>
          )}

          {/* 메타데이터 입력 폼 */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">회의 제목 *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예: 2026년 9월 당회 및 장로회 정기 회의"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-100 text-base"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">회의 장소</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="예: 교회 1층 만나홀 / 본관 대회의실"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-100 text-base"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">참석자</label>
              <input
                type="text"
                value={participants}
                onChange={(e) => setParticipants(e.target.value)}
                placeholder="예: 김철수 장로, 이영희 권사, 박진우 집사, 최성호 총무"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-100 text-base"
              />
            </div>
          </div>

          {/* 버튼 액션 */}
          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={handleReset}
              className="px-4 py-3.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 font-semibold text-sm transition"
            >
              다시 녹음
            </button>
            <button
              onClick={handleSubmit}
              disabled={disabled}
              className="flex-1 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-black text-base shadow-lg shadow-blue-500/20 hover:shadow-xl transition-all active:scale-98 cursor-pointer"
            >
              음성 전사 시작
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
