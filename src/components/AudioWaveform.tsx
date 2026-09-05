'use client';

import React, { useEffect, useRef } from 'react';

interface AudioWaveformProps {
  stream: MediaStream | null;
  isRecording: boolean;
  isPaused: boolean;
}

export default function AudioWaveform({ stream, isRecording, isPaused }: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  useEffect(() => {
    if (!stream || !isRecording || isPaused) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      sourceRef.current = source;
      source.connect(analyser);

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const draw = () => {
        animationFrameRef.current = requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const barWidth = (canvas.width / bufferLength) * 1.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * canvas.height * 0.9;

          // 부드러운 블루/에메랄드 그라데이션
          const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
          gradient.addColorStop(0, '#3b82f6');
          gradient.addColorStop(1, '#10b981');

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.roundRect(x, canvas.height - barHeight, barWidth - 2, barHeight, 3);
          ctx.fill();

          x += barWidth + 1;
        }
      };

      draw();
    } catch (err) {
      console.warn('AudioContext visualization setup failed:', err);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [stream, isRecording, isPaused]);

  return (
    <div className="w-full flex flex-col items-center justify-center py-2">
      <canvas
        ref={canvasRef}
        width={320}
        height={56}
        className="w-full max-w-xs h-14 bg-slate-900/5 rounded-xl border border-slate-200/80 px-2"
      />
      <span className="text-[12px] text-slate-400 mt-1">실시간 음성 감지 파형</span>
    </div>
  );
}
