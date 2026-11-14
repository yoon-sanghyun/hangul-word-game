import React from 'react';
import { Award, Cloud, Home, RotateCcw, Star } from 'lucide-react';

interface VictoryModalProps {
  modeLabel: string;
  score: number;
  solvedCount: number;
  totalCount: number;
  elapsedSeconds: number;
  isNewBest: boolean;
  isSignedIn: boolean;
  cloudSaved: boolean;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  modeLabel,
  score,
  solvedCount,
  totalCount,
  elapsedSeconds,
  isNewBest,
  isSignedIn,
  cloudSaved,
  onPlayAgain,
  onBackToMenu,
}) => {
  const ratio = totalCount > 0 ? solvedCount / totalCount : 0;
  const stars = ratio >= 0.9 && score >= totalCount * 15 ? 3 : ratio >= 0.6 ? 2 : 1;

  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  const timeText = minutes > 0 ? `${minutes}분 ${seconds}초` : `${seconds}초`;

  const praiseTitle =
    stars === 3 ? '대단해요! 낱말 박사님!' : stars === 2 ? '참 잘했어요!' : '끝까지 도전했어요!';

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="victory-title"
    >
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6 animate-pop-in">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 mx-auto">
            <Award className="w-8 h-8" aria-hidden="true" />
          </div>

          <p className="text-xs font-semibold text-slate-500">
            {modeLabel} 완료 {isNewBest ? '· 새로운 최고 기록!' : ''}
          </p>

          <h2 id="victory-title" className="font-display text-3xl text-slate-900">
            {praiseTitle}
          </h2>

          {/* Star rating with clear text label */}
          <div className="flex items-center justify-center gap-2 pt-1" aria-label={`별 ${stars}개 획득`}>
            {[1, 2, 3].map((idx) => (
              <Star
                key={idx}
                className={`w-8 h-8 ${
                  idx <= stars ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-100'
                }`}
                aria-hidden="true"
              />
            ))}
          </div>
        </div>

        {/* Summary metrics */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-3 gap-2 text-center divide-x divide-slate-200">
          <div>
            <div className="text-xs text-slate-500">최종 점수</div>
            <div className="text-xl font-bold text-blue-700 tabular-nums mt-0.5">{score}점</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">맞힌 낱말</div>
            <div className="text-xl font-bold text-slate-900 tabular-nums mt-0.5">
              {solvedCount}/{totalCount}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">걸린 시간</div>
            <div className="text-xl font-bold text-slate-900 tabular-nums mt-0.5">{timeText}</div>
          </div>
        </div>

        {isSignedIn && (
          <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-blue-700">
            <Cloud className="w-3.5 h-3.5" aria-hidden="true" />
            <span>
              {cloudSaved ? 'Firebase 클라우드에 기록을 저장했어요' : '클라우드에 기록을 저장하는 중...'}
            </span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onPlayAgain}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl border-b-4 border-blue-800 transition-all whitespace-nowrap min-h-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            <span>한 판 더 하기</span>
          </button>

          <button
            type="button"
            onClick={onBackToMenu}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors whitespace-nowrap min-h-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <Home className="w-4 h-4" aria-hidden="true" />
            <span>다른 게임 고르기</span>
          </button>
        </div>
      </div>
    </div>
  );
};
