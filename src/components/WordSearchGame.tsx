import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, Eye, EyeOff, Lightbulb, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import {
  DIFFICULTIES,
  Difficulty,
  THEMES,
  ThemeId,
  getChosung,
  selectWordsForRound,
} from '../data/words';
import {
  CellCoord,
  WordPlacement,
  WordSearchPuzzle,
  directionLabelKo,
  generateWordSearchPuzzle,
  getLineCells,
} from '../utils/wordSearchGenerator';
import { playCorrect, playHint, playTap, playWrong } from '../utils/sound';

interface WordSearchGameProps {
  theme: ThemeId;
  difficulty: Difficulty;
  isMuted: boolean;
  onToggleMute: () => void;
  onHudUpdate: (hudText: string) => void;
  onComplete: (result: { score: number; solvedCount: number; totalCount: number; elapsedSeconds: number }) => void;
}

const FOUND_PALETTES = [
  'bg-emerald-100 border-emerald-400 text-emerald-950',
  'bg-sky-100 border-sky-400 text-sky-950',
  'bg-amber-100 border-amber-400 text-amber-950',
  'bg-violet-100 border-violet-400 text-violet-950',
  'bg-rose-100 border-rose-400 text-rose-950',
  'bg-teal-100 border-teal-400 text-teal-950',
];

const LIST_DOT_COLORS = [
  'bg-emerald-500',
  'bg-sky-500',
  'bg-amber-500',
  'bg-violet-500',
  'bg-rose-500',
  'bg-teal-500',
];

function coordKey(c: CellCoord): string {
  return `${c.row}-${c.col}`;
}

export const WordSearchGame: React.FC<WordSearchGameProps> = ({
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

  const createNewPuzzle = useCallback((): WordSearchPuzzle => {
    const words = selectWordsForRound(
      theme,
      difficulty,
      diffMeta.wordSearchCount,
      diffMeta.gridSize
    );
    return generateWordSearchPuzzle(diffMeta.gridSize, words, diffMeta.allowDiagonal);
  }, [theme, difficulty, diffMeta]);

  const [puzzle, setPuzzle] = useState<WordSearchPuzzle>(() => createNewPuzzle());
  const [foundIds, setFoundIds] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [chosungOnlyMode, setChosungOnlyMode] = useState(false);

  // Selection states (supports both pointer drag and two-tap)
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<CellCoord | null>(null);
  const [dragEnd, setDragEnd] = useState<CellCoord | null>(null);
  const [tapAnchor, setTapAnchor] = useState<CellCoord | null>(null);

  // Hint state (3 tiers: 1 = first letter, 2 = direction, 3 = auto-reveal)
  const [hintTargetId, setHintTargetId] = useState<string | null>(null);
  const [hintTier, setHintTier] = useState<0 | 1 | 2>(0);
  const [feedback, setFeedback] = useState<{
    type: 'info' | 'success' | 'warn';
    text: string;
  }>({
    type: 'info',
    text: '첫 글자부터 끝 글자까지 드래그하거나, 시작과 끝 글자를 차례로 눌러 보세요.',
  });
  const [shakeGrid, setShakeGrid] = useState(false);

  const finishedRef = useRef(false);

  // Reset when theme/difficulty changes
  useEffect(() => {
    setPuzzle(createNewPuzzle());
    setFoundIds([]);
    setScore(0);
    setElapsedSeconds(0);
    setTapAnchor(null);
    setDragStart(null);
    setDragEnd(null);
    setIsDragging(false);
    setHintTargetId(null);
    setHintTier(0);
    finishedRef.current = false;
    setFeedback({
      type: 'info',
      text: '첫 글자부터 끝 글자까지 드래그하거나, 시작과 끝 글자를 차례로 눌러 보세요.',
    });
  }, [createNewPuzzle]);

  // Elapsed timer
  useEffect(() => {
    const timer = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Update Header HUD
  useEffect(() => {
    const remaining = puzzle.placements.length - foundIds.length;
    onHudUpdate(
      `점수 ${score}점 · 남은 낱말 ${remaining}개 · ${themeMeta.label} (${diffMeta.label})`
    );
  }, [score, foundIds.length, puzzle.placements.length, themeMeta.label, diffMeta.label, onHudUpdate]);

  // Check completion
  useEffect(() => {
    if (
      !finishedRef.current &&
      puzzle.placements.length > 0 &&
      foundIds.length === puzzle.placements.length
    ) {
      finishedRef.current = true;
      const timer = window.setTimeout(() => {
        onComplete({
          score,
          solvedCount: foundIds.length,
          totalCount: puzzle.placements.length,
          elapsedSeconds,
        });
      }, 600);
      return () => window.clearTimeout(timer);
    }
  }, [foundIds.length, puzzle.placements.length, score, elapsedSeconds, onComplete]);

  // Map found cell keys to color index
  const foundCellColorMap = useMemo(() => {
    const map = new Map<string, number>();
    puzzle.placements.forEach((p) => {
      if (foundIds.includes(p.wordItem.id)) {
        p.cells.forEach((c) => {
          map.set(coordKey(c), p.colorIndex);
        });
      }
    });
    return map;
  }, [puzzle.placements, foundIds]);

  // Active preview line cells
  const activeSelectionCells = useMemo(() => {
    if (isDragging && dragStart && dragEnd) {
      return getLineCells(dragStart, dragEnd);
    }
    if (tapAnchor) {
      return [tapAnchor];
    }
    return [];
  }, [isDragging, dragStart, dragEnd, tapAnchor]);

  const activeSelectionSet = useMemo(() => {
    return new Set(activeSelectionCells.map(coordKey));
  }, [activeSelectionCells]);

  // Hinted cell (first letter of hintTargetId)
  const hintedPlacement = useMemo(() => {
    if (!hintTargetId) return null;
    return puzzle.placements.find((p) => p.wordItem.id === hintTargetId) ?? null;
  }, [hintTargetId, puzzle.placements]);

  const hintedCellKey = useMemo(() => {
    if (!hintedPlacement || hintTier < 1) return null;
    return coordKey(hintedPlacement.cells[0]);
  }, [hintedPlacement, hintTier]);

  const validateSelection = useCallback(
    (start: CellCoord, end: CellCoord) => {
      const cells = getLineCells(start, end);
      if (cells.length < 2) return;

      const forwardWord = cells.map((c) => puzzle.grid[c.row][c.col]).join('');
      const reverseWord = Array.from(forwardWord).reverse().join('');

      const match: WordPlacement | undefined = puzzle.placements.find((p) => {
        if (foundIds.includes(p.wordItem.id)) return false;
        return p.wordItem.word === forwardWord || p.wordItem.word === reverseWord;
      });

      if (match) {
        playCorrect();
        const pointsEarned =
          hintTargetId === match.wordItem.id ? 15 : 25 + match.wordItem.word.length * 5;
        setFoundIds((prev) => [...prev, match.wordItem.id]);
        setScore((prev) => prev + pointsEarned);
        if (hintTargetId === match.wordItem.id) {
          setHintTargetId(null);
          setHintTier(0);
        }
        setFeedback({
          type: 'success',
          text: `정답! "${match.wordItem.word}" — ${match.wordItem.hint} (+${pointsEarned}점)`,
        });
      } else {
        playWrong();
        setShakeGrid(true);
        window.setTimeout(() => setShakeGrid(false), 360);
        setFeedback({
          type: 'warn',
          text: `"${forwardWord}"는 찾는 낱말이 아니에요. 다시 이어 볼까요?`,
        });
      }
    },
    [puzzle.grid, puzzle.placements, foundIds, hintTargetId]
  );

  const handlePointerDownCell = (coord: CellCoord) => {
    playTap();
    setIsDragging(true);
    setDragStart(coord);
    setDragEnd(coord);
  };

  const handlePointerMoveBoard = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const cellBtn = el?.closest('[data-row][data-col]') as HTMLElement | null;
    if (cellBtn) {
      const r = Number(cellBtn.dataset.row);
      const c = Number(cellBtn.dataset.col);
      if (!Number.isNaN(r) && !Number.isNaN(c)) {
        if (!dragEnd || dragEnd.row !== r || dragEnd.col !== c) {
          setDragEnd({ row: r, col: c });
        }
      }
    }
  };

  const handlePointerUpGlobal = useCallback(() => {
    if (!isDragging || !dragStart || !dragEnd) return;
    setIsDragging(false);

    const moved = dragStart.row !== dragEnd.row || dragStart.col !== dragEnd.col;
    if (moved) {
      setTapAnchor(null);
      validateSelection(dragStart, dragEnd);
    } else {
      // Single tap / click behavior (two-tap support)
      if (!tapAnchor) {
        setTapAnchor(dragStart);
        setFeedback({
          type: 'info',
          text: `"${puzzle.grid[dragStart.row][dragStart.col]}"부터 시작해요. 마지막 글자를 눌러 주세요!`,
        });
      } else if (tapAnchor.row === dragStart.row && tapAnchor.col === dragStart.col) {
        setTapAnchor(null);
        setFeedback({
          type: 'info',
          text: '선택을 취소했어요. 원하는 글자를 다시 골라 보세요.',
        });
      } else {
        const start = tapAnchor;
        setTapAnchor(null);
        validateSelection(start, dragStart);
      }
    }

    setDragStart(null);
    setDragEnd(null);
  }, [isDragging, dragStart, dragEnd, tapAnchor, puzzle.grid, validateSelection]);

  useEffect(() => {
    window.addEventListener('pointerup', handlePointerUpGlobal);
    return () => window.removeEventListener('pointerup', handlePointerUpGlobal);
  }, [handlePointerUpGlobal]);

  const handleUseHint = () => {
    const remaining = puzzle.placements.filter((p) => !foundIds.includes(p.wordItem.id));
    if (remaining.length === 0) return;

    playHint();
    const target =
      remaining.find((p) => p.wordItem.id === hintTargetId) ?? remaining[0];

    if (hintTargetId !== target.wordItem.id || hintTier === 0) {
      setHintTargetId(target.wordItem.id);
      setHintTier(1);
      setFeedback({
        type: 'info',
        text: `힌트 1단계: "${chosungOnlyMode ? getChosung(target.wordItem.word) : target.wordItem.word}"의 첫 글자 위치를 반짝 표시했어요!`,
      });
    } else if (hintTier === 1) {
      setHintTier(2);
      setFeedback({
        type: 'info',
        text: `힌트 2단계: 첫 글자에서 ${directionLabelKo(target.direction)}으로 이어져 있어요!`,
      });
    } else {
      // Tier 3: reveal the word cleanly
      setFoundIds((prev) => [...prev, target.wordItem.id]);
      setScore((prev) => prev + 10);
      setHintTargetId(null);
      setHintTier(0);
      setFeedback({
        type: 'success',
        text: `힌트 3단계: "${target.wordItem.word}" 낱말을 찾아 주었어요! (${target.wordItem.hint})`,
      });
    }
  };

  const handleRestartPuzzle = () => {
    playTap();
    setPuzzle(createNewPuzzle());
    setFoundIds([]);
    setScore(0);
    setElapsedSeconds(0);
    setTapAnchor(null);
    setHintTargetId(null);
    setHintTier(0);
    finishedRef.current = false;
    setFeedback({
      type: 'info',
      text: '새 글자판이 준비되었어요! 낱말을 찾아보세요.',
    });
  };

  const gridSizeClass =
    puzzle.size <= 6
      ? 'w-12 h-12 sm:w-14 sm:h-14 text-xl sm:text-2xl'
      : puzzle.size === 7
        ? 'w-11 h-11 sm:w-13 sm:h-13 text-lg sm:text-xl'
        : 'w-10 h-10 sm:w-12 sm:h-12 text-base sm:text-xl';

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Workspace Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="font-display text-2xl sm:text-3xl text-slate-900">숨은 낱말 찾기</h1>
          <p className="text-sm text-slate-500">
            {themeMeta.label} · {diffMeta.label} 단계 ({puzzle.size}×{puzzle.size})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              playTap();
              setChosungOnlyMode((prev) => !prev);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors whitespace-nowrap min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {chosungOnlyMode ? (
              <>
                <Eye className="w-4 h-4 text-blue-600" aria-hidden="true" />
                <span>낱말 보이기</span>
              </>
            ) : (
              <>
                <EyeOff className="w-4 h-4 text-slate-500" aria-hidden="true" />
                <span>초성으로 도전</span>
              </>
            )}
          </button>

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
            onClick={handleRestartPuzzle}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors whitespace-nowrap min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <RotateCcw className="w-4 h-4 text-slate-600" aria-hidden="true" />
            <span>새 판 짜기</span>
          </button>
        </div>
      </div>

      {/* Feedback Strip (Clear Text + Icon, never hue-only) */}
      <div
        role="status"
        aria-live="polite"
        className={`rounded-xl px-4 py-3 text-sm sm:text-base font-medium border flex items-center gap-2.5 transition-colors ${
          feedback.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : feedback.type === 'warn'
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-white border-slate-200 text-slate-700'
        }`}
      >
        {feedback.type === 'success' ? (
          <Check className="w-5 h-5 text-emerald-600 shrink-0" aria-hidden="true" />
        ) : (
          <Lightbulb
            className={`w-5 h-5 shrink-0 ${
              feedback.type === 'warn' ? 'text-amber-600' : 'text-blue-600'
            }`}
            aria-hidden="true"
          />
        )}
        <span>{feedback.text}</span>
      </div>

      {/* Main 2-Column Game Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Interactive Syllable Grid */}
        <div className="lg:col-span-7 flex justify-center">
          <div
            onPointerMove={handlePointerMoveBoard}
            className={`bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm select-none touch-none ${
              shakeGrid ? 'animate-gentle-shake' : ''
            }`}
          >
            <div
              className="grid gap-1.5 sm:gap-2"
              style={{ gridTemplateColumns: `repeat(${puzzle.size}, minmax(0, 1fr))` }}
            >
              {puzzle.grid.map((row, rIdx) =>
                row.map((char, cIdx) => {
                  const key = `${rIdx}-${cIdx}`;
                  const isActive = activeSelectionSet.has(key);
                  const foundColorIdx = foundCellColorMap.get(key);
                  const isFound = foundColorIdx !== undefined;
                  const isHinted = hintedCellKey === key;

                  let tileStyle =
                    'bg-slate-50 border-slate-200 border-b-3 text-slate-900 hover:bg-slate-100';
                  if (isActive) {
                    tileStyle =
                      'bg-blue-600 border-blue-700 border-b-3 text-white scale-105 z-10';
                  } else if (isFound) {
                    tileStyle = `${FOUND_PALETTES[foundColorIdx]} border-b-2`;
                  } else if (isHinted) {
                    tileStyle =
                      'bg-amber-50 border-amber-500 border-b-3 text-amber-950 ring-2 ring-amber-400';
                  }

                  return (
                    <button
                      key={key}
                      type="button"
                      data-row={rIdx}
                      data-col={cIdx}
                      onPointerDown={() => handlePointerDownCell({ row: rIdx, col: cIdx })}
                      aria-label={`${rIdx + 1}행 ${cIdx + 1}열 글자 ${char}`}
                      className={`${gridSizeClass} rounded-xl border font-bold flex items-center justify-center transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${tileStyle}`}
                    >
                      {char}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right: Target Word List & Multi-Tier Hint */}
        <aside className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-display text-xl text-slate-900">찾을 낱말 목록</h2>
              <p className="text-xs text-slate-500 tabular-nums mt-0.5">
                {foundIds.length}개 찾음 / 전체 {puzzle.placements.length}개 · 점수 {score}점
              </p>
            </div>
            <button
              type="button"
              onClick={handleUseHint}
              disabled={foundIds.length === puzzle.placements.length}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 disabled:opacity-40 rounded-lg border-b-2 border-amber-300 transition-colors whitespace-nowrap shrink-0 min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              <Lightbulb className="w-4 h-4 text-amber-700" aria-hidden="true" />
              <span>힌트 쓰기</span>
            </button>
          </div>

          <ul className="divide-y divide-slate-100">
            {puzzle.placements.map((placement) => {
              const isFound = foundIds.includes(placement.wordItem.id);
              const isHintTarget = hintTargetId === placement.wordItem.id;
              const displayWord =
                isFound || !chosungOnlyMode
                  ? placement.wordItem.word
                  : getChosung(placement.wordItem.word);

              return (
                <li
                  key={placement.wordItem.id}
                  className={`py-3 flex items-start justify-between gap-3 ${
                    isHintTarget && !isFound ? 'bg-amber-50/60 -mx-2 px-2 rounded-lg' : ''
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-2.5 h-2.5 rounded-sm shrink-0 ${
                          isFound ? LIST_DOT_COLORS[placement.colorIndex] : 'bg-slate-300'
                        }`}
                        aria-hidden="true"
                      />
                      <span
                        className={`text-lg font-bold tracking-wide ${
                          isFound ? 'line-through text-slate-400' : 'text-slate-900'
                        }`}
                      >
                        {displayWord}
                      </span>
                      {isFound && (
                        <span className="text-xs font-semibold text-emerald-700">찾음 ✓</span>
                      )}
                      {isHintTarget && !isFound && (
                        <span className="text-xs font-semibold text-amber-700">
                          힌트 {hintTier}단계
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 pl-5 leading-snug">
                      {placement.wordItem.hint}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </aside>
      </div>
    </main>
  );
};
