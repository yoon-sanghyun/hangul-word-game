import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Check,
  Eraser,
  Lightbulb,
  RotateCcw,
  SkipForward,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  DIFFICULTIES,
  Difficulty,
  THEMES,
  ThemeId,
  WORD_BANK,
  WordItem,
  getChosung,
  selectWordsForRound,
} from '../data/words';
import { playCorrect, playHint, playTap, playWrong } from '../utils/sound';

interface ChosungQuizGameProps {
  theme: ThemeId;
  difficulty: Difficulty;
  isMuted: boolean;
  onToggleMute: () => void;
  onHudUpdate: (hudText: string) => void;
  onComplete: (result: { score: number; solvedCount: number; totalCount: number; elapsedSeconds: number }) => void;
}

interface TileOption {
  id: string;
  char: string;
  usedInSlotIndex: number | null;
}

const EXTRA_SYLLABLES = [
  '가', '나', '다', '라', '마', '바', '사', '아', '자', '차', '카', '타', '파', '하',
  '고', '노', '도', '로', '모', '보', '소', '오', '조', '기', '니', '리', '미', '시',
  '이', '지', '구', '누', '수', '우', '주', '별', '달', '꽃', '물', '해', '눈', '비',
];

function buildTileOptions(word: string, difficulty: Difficulty): TileOption[] {
  const answerChars = Array.from(word);
  const totalTiles = difficulty === 'easy' ? 6 : difficulty === 'medium' ? 8 : 9;

  // Gather plausible distractor syllables from word bank + common syllables
  const bankChars = WORD_BANK.flatMap((w) => Array.from(w.word));
  const pool = [...bankChars, ...EXTRA_SYLLABLES];

  const chars = [...answerChars];
  while (chars.length < totalTiles) {
    const candidate = pool[Math.floor(Math.random() * pool.length)];
    // Allow occasional duplicates only if needed, prefer distinct distractors
    if (!answerChars.includes(candidate) || Math.random() > 0.6) {
      chars.push(candidate);
    }
  }

  // Fisher-Yates shuffle
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.map((char, idx) => ({
    id: `tile-${idx}-${char}`,
    char,
    usedInSlotIndex: null,
  }));
}

export const ChosungQuizGame: React.FC<ChosungQuizGameProps> = ({
  theme,
  difficulty,
  isMuted,
  onToggleMute,
  onHudUpdate,
  onComplete,
}) => {
  const diffMeta = useMemo(
    () => DIFFICULTIES.find((d) => d.id === difficulty) ?? DIFFICULTIES[0],
    [difficulty]
  );
  const themeMeta = useMemo(
    () => THEMES.find((t) => t.id === theme) ?? THEMES[0],
    [theme]
  );

  const [questions, setQuestions] = useState<WordItem[]>(() =>
    selectWordsForRound(theme, difficulty, diffMeta.quizCount)
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [solvedCount, setSolvedCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const currentQuestion = questions[currentIndex];
  const answerChars = useMemo(
    () => (currentQuestion ? Array.from(currentQuestion.word) : []),
    [currentQuestion]
  );

  const [tiles, setTiles] = useState<TileOption[]>(() =>
    currentQuestion ? buildTileOptions(currentQuestion.word, difficulty) : []
  );
  const [slots, setSlots] = useState<(TileOption | null)[]>(() =>
    Array.from({ length: answerChars.length }, () => null)
  );
  const [lockedSlots, setLockedSlots] = useState<boolean[]>(() =>
    Array.from({ length: answerChars.length }, () => false)
  );
  const [questionStatus, setQuestionStatus] = useState<'answering' | 'correct' | 'wrong'>('answering');
  const [usedHintThisQuestion, setUsedHintThisQuestion] = useState(false);

  const autoAdvanceTimerRef = useRef<number | null>(null);
  const wrongResetTimerRef = useRef<number | null>(null);

  const clearTimers = () => {
    if (autoAdvanceTimerRef.current) {
      window.clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    if (wrongResetTimerRef.current) {
      window.clearTimeout(wrongResetTimerRef.current);
      wrongResetTimerRef.current = null;
    }
  };

  const setupQuestion = useCallback(
    (q: WordItem) => {
      clearTimers();
      const len = Array.from(q.word).length;
      setTiles(buildTileOptions(q.word, difficulty));
      setSlots(Array.from({ length: len }, () => null));
      setLockedSlots(Array.from({ length: len }, () => false));
      setQuestionStatus('answering');
      setUsedHintThisQuestion(false);
    },
    [difficulty]
  );

  const restartRound = useCallback(() => {
    clearTimers();
    const nextQuestions = selectWordsForRound(theme, difficulty, diffMeta.quizCount);
    setQuestions(nextQuestions);
    setCurrentIndex(0);
    setScore(0);
    setSolvedCount(0);
    setStreak(0);
    setElapsedSeconds(0);
    if (nextQuestions[0]) {
      setupQuestion(nextQuestions[0]);
    }
  }, [theme, difficulty, diffMeta.quizCount, setupQuestion]);

  useEffect(() => {
    restartRound();
    return () => clearTimers();
  }, [restartRound]);

  // Elapsed timer
  useEffect(() => {
    const timer = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Update Header HUD
  useEffect(() => {
    onHudUpdate(
      `점수 ${score}점 · 문제 ${Math.min(currentIndex + 1, questions.length)}/${questions.length} · 연속 ${streak}회`
    );
  }, [score, currentIndex, questions.length, streak, onHudUpdate]);

  const advanceToNext = useCallback(
    (nextScore: number, nextSolved: number) => {
      clearTimers();
      if (currentIndex + 1 >= questions.length) {
        onComplete({
          score: nextScore,
          solvedCount: nextSolved,
          totalCount: questions.length,
          elapsedSeconds,
        });
      } else {
        const nextIdx = currentIndex + 1;
        setCurrentIndex(nextIdx);
        setupQuestion(questions[nextIdx]);
      }
    },
    [currentIndex, questions, elapsedSeconds, onComplete, setupQuestion]
  );

  const checkAnswer = useCallback(
    (updatedSlots: (TileOption | null)[]) => {
      if (!currentQuestion) return;
      if (updatedSlots.some((s) => s === null)) return;

      const attempt = updatedSlots.map((s) => s?.char ?? '').join('');
      if (attempt === currentQuestion.word) {
        playCorrect();
        const earned = (usedHintThisQuestion ? 15 : 25) + streak * 5;
        const nextScore = score + earned;
        const nextSolved = solvedCount + 1;
        setScore(nextScore);
        setSolvedCount(nextSolved);
        setStreak((prev) => prev + 1);
        setQuestionStatus('correct');

        autoAdvanceTimerRef.current = window.setTimeout(() => {
          advanceToNext(nextScore, nextSolved);
        }, 1050);
      } else {
        playWrong();
        setStreak(0);
        setQuestionStatus('wrong');

        wrongResetTimerRef.current = window.setTimeout(() => {
          // Clear unlocked slots so the student can immediately retry
          setSlots((prevSlots) =>
            prevSlots.map((slot, idx) => (lockedSlots[idx] ? slot : null))
          );
          setTiles((prevTiles) =>
            prevTiles.map((tile) =>
              tile.usedInSlotIndex !== null && !lockedSlots[tile.usedInSlotIndex]
                ? { ...tile, usedInSlotIndex: null }
                : tile
            )
          );
          setQuestionStatus('answering');
        }, 650);
      }
    },
    [
      currentQuestion,
      usedHintThisQuestion,
      streak,
      score,
      solvedCount,
      advanceToNext,
      lockedSlots,
    ]
  );

  const handleTileClick = (tileId: string) => {
    if (questionStatus !== 'answering') return;
    const tile = tiles.find((t) => t.id === tileId);
    if (!tile || tile.usedInSlotIndex !== null) return;

    const emptySlotIdx = slots.findIndex((s) => s === null);
    if (emptySlotIdx === -1) return;

    playTap();
    const updatedTile: TileOption = { ...tile, usedInSlotIndex: emptySlotIdx };
    const nextTiles = tiles.map((t) => (t.id === tileId ? updatedTile : t));
    const nextSlots = slots.map((s, idx) => (idx === emptySlotIdx ? updatedTile : s));

    setTiles(nextTiles);
    setSlots(nextSlots);

    if (nextSlots.every((s) => s !== null)) {
      checkAnswer(nextSlots);
    }
  };

  const handleSlotClick = (slotIdx: number) => {
    if (questionStatus !== 'answering') return;
    if (lockedSlots[slotIdx]) return;
    const tileInSlot = slots[slotIdx];
    if (!tileInSlot) return;

    playTap();
    setSlots((prev) => prev.map((s, idx) => (idx === slotIdx ? null : s)));
    setTiles((prev) =>
      prev.map((t) => (t.id === tileInSlot.id ? { ...t, usedInSlotIndex: null } : t))
    );
  };

  const handleClearUnlocked = () => {
    if (questionStatus !== 'answering') return;
    playTap();
    setSlots((prev) => prev.map((s, idx) => (lockedSlots[idx] ? s : null)));
    setTiles((prev) =>
      prev.map((t) =>
        t.usedInSlotIndex !== null && !lockedSlots[t.usedInSlotIndex]
          ? { ...t, usedInSlotIndex: null }
          : t
      )
    );
  };

  const handleHintFillOne = () => {
    if (questionStatus !== 'answering' || !currentQuestion) return;

    // Find first slot that isn't already locked with the right character
    const targetIdx = answerChars.findIndex(
      (ch, idx) => !lockedSlots[idx] && slots[idx]?.char !== ch
    );
    if (targetIdx === -1) return;

    const neededChar = answerChars[targetIdx];
    // Find an unused tile with neededChar, or reclaim one from another unlocked slot
    let candidateTile = tiles.find((t) => t.char === neededChar && t.usedInSlotIndex === null);
    if (!candidateTile) {
      candidateTile = tiles.find(
        (t) =>
          t.char === neededChar &&
          t.usedInSlotIndex !== null &&
          !lockedSlots[t.usedInSlotIndex]
      );
    }
    if (!candidateTile) return;

    playHint();
    setUsedHintThisQuestion(true);

    // If targetIdx currently has another tile, free it; if candidateTile was in another slot, free that slot
    const prevTileInTarget = slots[targetIdx];
    const oldSlotOfCandidate = candidateTile.usedInSlotIndex;

    const nextTiles = tiles.map((t) => {
      if (t.id === candidateTile!.id) {
        return { ...t, usedInSlotIndex: targetIdx };
      }
      if (prevTileInTarget && t.id === prevTileInTarget.id) {
        return { ...t, usedInSlotIndex: null };
      }
      return t;
    });

    const nextSlots = slots.map((s, idx) => {
      if (idx === targetIdx) {
        return { ...candidateTile!, usedInSlotIndex: targetIdx };
      }
      if (oldSlotOfCandidate !== null && idx === oldSlotOfCandidate) {
        return null;
      }
      return s;
    });

    const nextLocked = lockedSlots.map((locked, idx) => (idx === targetIdx ? true : locked));

    setTiles(nextTiles);
    setSlots(nextSlots);
    setLockedSlots(nextLocked);

    if (nextSlots.every((s) => s !== null)) {
      checkAnswer(nextSlots);
    }
  };

  const handleSkip = () => {
    if (questionStatus !== 'answering') return;
    playTap();
    setStreak(0);
    advanceToNext(score, solvedCount);
  };

  if (!currentQuestion) {
    return null;
  }

  const chosungText = getChosung(currentQuestion.word);

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="font-display text-2xl sm:text-3xl text-slate-900">초성 낱말 퀴즈</h1>
          <p className="text-sm text-slate-500">
            {themeMeta.label} · {diffMeta.label} 단계 · 문제 {currentIndex + 1} / {questions.length}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onToggleMute}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors whitespace-nowrap min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {isMuted ? (
              <>
                <VolumeX className="w-4 h-4 text-slate-500" aria-hidden="true" />
                <span>소리 꺼짐</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-blue-600" aria-hidden="true" />
                <span>소리 켜짐</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              playTap();
              restartRound();
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors whitespace-nowrap min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <RotateCcw className="w-4 h-4 text-slate-600" aria-hidden="true" />
            <span>다시 풀기</span>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden" aria-hidden="true">
        <div
          className="h-full bg-blue-600 transition-transform duration-300 origin-left"
          style={{
            transform: `scaleX(${(currentIndex + (questionStatus === 'correct' ? 1 : 0)) / questions.length})`,
          }}
        />
      </div>

      {/* Center Clue & Answer Card */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-sm space-y-8 text-center">
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-500 tabular-nums">
            현재 점수 {score}점 · 연속 정답 {streak}회
          </p>

          {/* Big Chosung Prompt */}
          <div className="font-display text-4xl sm:text-5xl tracking-[0.22em] text-blue-700 py-1">
            {chosungText}
          </div>

          <p className="text-base sm:text-xl font-medium text-slate-800 max-w-xl mx-auto leading-relaxed">
            “{currentQuestion.hint}”
          </p>
        </div>

        {/* Answer Slots */}
        <div
          className={`flex items-center justify-center gap-3 sm:gap-4 ${
            questionStatus === 'wrong' ? 'animate-gentle-shake' : ''
          }`}
        >
          {slots.map((slot, idx) => {
            const isLocked = lockedSlots[idx];
            let slotClass =
              'bg-slate-50 border-2 border-dashed border-slate-300 text-slate-400';

            if (questionStatus === 'correct') {
              slotClass =
                'bg-emerald-50 border-2 border-emerald-500 text-emerald-900 shadow-xs';
            } else if (questionStatus === 'wrong') {
              slotClass = 'bg-amber-50 border-2 border-amber-500 text-amber-900';
            } else if (slot && isLocked) {
              slotClass =
                'bg-amber-50 border-2 border-amber-400 text-amber-950 cursor-default';
            } else if (slot) {
              slotClass =
                'bg-blue-50 border-2 border-blue-500 text-blue-950 hover:bg-blue-100';
            }

            return (
              <button
                key={`slot-${idx}`}
                type="button"
                onClick={() => handleSlotClick(idx)}
                disabled={!slot || isLocked || questionStatus !== 'answering'}
                aria-label={`${idx + 1}번째 글자 자리 ${slot ? slot.char : '비어 있음'}`}
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl text-2xl sm:text-3xl font-bold flex items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${slotClass}`}
              >
                {slot ? slot.char : answerChars[idx] ? '' : ''}
              </button>
            );
          })}
        </div>

        {/* Live Status Banner */}
        <div className="min-h-[36px] flex items-center justify-center" aria-live="polite">
          {questionStatus === 'correct' && (
            <div className="inline-flex items-center gap-2 text-emerald-700 font-bold text-base animate-pop-in">
              <Check className="w-5 h-5" aria-hidden="true" />
              <span>정답이에요! 참 잘했어요!</span>
              <button
                type="button"
                onClick={() => advanceToNext(score, solvedCount)}
                className="ml-2 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <span>다음 문제</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          )}
          {questionStatus === 'wrong' && (
            <p className="text-amber-700 font-bold text-base">
              조금 달라요! 글자 순서를 다시 골라 볼까요?
            </p>
          )}
          {questionStatus === 'answering' && (
            <p className="text-sm text-slate-500">
              아래 글자 블록을 순서대로 눌러 빈칸을 채워 주세요.
            </p>
          )}
        </div>

        {/* Tactile Syllable Tile Tray */}
        <div className="pt-2 border-t border-slate-100 space-y-5">
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-3.5 max-w-lg mx-auto">
            {tiles.map((tile) => {
              const isUsed = tile.usedInSlotIndex !== null;
              return (
                <button
                  key={tile.id}
                  type="button"
                  disabled={isUsed || questionStatus !== 'answering'}
                  onClick={() => handleTileClick(tile.id)}
                  aria-label={`글자 ${tile.char}`}
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl text-2xl font-bold flex items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    isUsed
                      ? 'bg-slate-100 border border-slate-200 text-slate-300 translate-y-0.5 cursor-default'
                      : 'bg-white border border-slate-300 border-b-4 text-slate-900 hover:bg-blue-50 hover:border-blue-400 active:translate-y-0.5 active:border-b-2 shadow-xs'
                  }`}
                >
                  {tile.char}
                </button>
              );
            })}
          </div>

          {/* Action Controls */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleClearUnlocked}
              disabled={questionStatus !== 'answering' || slots.every((s) => s === null)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-xl transition-colors whitespace-nowrap min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <Eraser className="w-4 h-4" aria-hidden="true" />
              <span>비우기</span>
            </button>

            <button
              type="button"
              onClick={handleHintFillOne}
              disabled={questionStatus !== 'answering'}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 disabled:opacity-40 rounded-xl border-b-2 border-amber-300 transition-colors whitespace-nowrap min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              <Lightbulb className="w-4 h-4 text-amber-700" aria-hidden="true" />
              <span>한 글자 힌트</span>
            </button>

            <button
              type="button"
              onClick={handleSkip}
              disabled={questionStatus !== 'answering'}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 disabled:opacity-40 rounded-xl transition-colors whitespace-nowrap min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <SkipForward className="w-4 h-4" aria-hidden="true" />
              <span>건너뛰기</span>
            </button>
          </div>
        </div>
      </section>
    </main>
  );
};
