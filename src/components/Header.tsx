import React from 'react';

interface HeaderProps {
  isPlaying: boolean;
  hudText?: string;
  onGoHome: () => void;
  onQuickStart: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isPlaying,
  hudText,
  onGoHome,
  onQuickStart,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Wordmark */}
        <button
          type="button"
          onClick={onGoHome}
          className="font-display text-2xl tracking-tight text-slate-900 whitespace-nowrap shrink-0 hover:text-blue-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-md px-1"
        >
          한글 낱말 놀이터
        </button>

        {/* Zone 2: Nav links on menu OR unobtrusive HUD during play */}
        {isPlaying ? (
          <div
            className="hidden sm:flex items-center gap-3 text-sm font-medium text-slate-600 tabular-nums whitespace-nowrap truncate"
            aria-live="polite"
          >
            <span>{hudText}</span>
          </div>
        ) : (
          <nav
            aria-label="주요 메뉴"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
          >
            <a
              href="#game-setup"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              게임 고르기
            </a>
            <a
              href="#how-to-play"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              놀이 방법
            </a>
            <a
              href="#my-records"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              내 기록
            </a>
          </nav>
        )}

        {/* Zone 3: Single Primary Action */}
        <div className="flex items-center shrink-0">
          {isPlaying ? (
            <button
              type="button"
              onClick={onGoHome}
              className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              처음으로
            </button>
          ) : (
            <button
              type="button"
              onClick={onQuickStart}
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shrink-0 min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              바로 시작하기
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
