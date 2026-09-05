import type { Metadata, Viewport } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'AI 음성 회의록 | 휴대폰 녹음으로 완성하는 전문 회의록',
  description: '휴대폰에서 회의를 녹음하면 Whisper AI가 한국어 텍스트로 변환하고 전문 회의록을 자동 작성해 주는 스마트 회의 비서 웹앱',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="min-h-screen flex flex-col bg-slate-50 antialiased text-slate-900 selection:bg-blue-100 selection:text-blue-900">
        <Navbar />
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {children}
        </main>
        <footer className="py-6 border-t border-slate-200 text-center text-xs text-slate-400 no-print">
          <div className="max-w-5xl mx-auto px-4">
            <p className="font-semibold text-slate-500">AI 음성 회의록 비서</p>
            <p className="mt-1">안전한 데이터 보호 및 서버 환경변수 암호화 적용 | 교회 · 비영리단체 · 마을공동체 최적화</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
