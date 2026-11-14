import { WordItem } from '../data/words';

export interface CellCoord {
  row: number;
  col: number;
}

export type DirectionType = 'horizontal' | 'vertical' | 'diagonal';

export interface WordPlacement {
  wordItem: WordItem;
  cells: CellCoord[];
  direction: DirectionType;
  colorIndex: number;
}

export interface WordSearchPuzzle {
  size: number;
  grid: string[][];
  placements: WordPlacement[];
}

const FILLER_SYLLABLES = [
  '가', '나', '다', '라', '마', '바', '사', '아', '자', '차', '카', '타', '파', '하',
  '고', '노', '도', '로', '모', '보', '소', '오', '조', '초', '코', '토', '포', '호',
  '구', '누', '두', '루', '무', '부', '수', '우', '주', '추', '쿠', '투', '푸', '후',
  '기', '니', '디', '리', '미', '비', '시', '이', '지', '치', '키', '티', '피', '히',
  '별', '달', '해', '꽃', '물', '불', '산', '들', '강', '눈', '비', '꿈', '빛', '숲',
];

const DIRECTIONS: { dr: number; dc: number; type: DirectionType }[] = [
  { dr: 0, dc: 1, type: 'horizontal' },
  { dr: 1, dc: 0, type: 'vertical' },
  { dr: 1, dc: 1, type: 'diagonal' },
];

export function directionLabelKo(dir: DirectionType): string {
  switch (dir) {
    case 'horizontal':
      return '가로 방향 (→)';
    case 'vertical':
      return '세로 방향 (↓)';
    case 'diagonal':
      return '대각선 방향 (↘)';
  }
}

export function generateWordSearchPuzzle(
  size: number,
  words: WordItem[],
  allowDiagonal: boolean
): WordSearchPuzzle {
  const grid: (string | null)[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => null)
  );
  const placements: WordPlacement[] = [];

  const sortedWords = [...words].sort((a, b) => b.word.length - a.word.length);
  const availableDirs = allowDiagonal ? DIRECTIONS : DIRECTIONS.slice(0, 2);

  sortedWords.forEach((wordItem, idx) => {
    const chars = Array.from(wordItem.word);
    if (chars.length > size) return;

    const candidates: {
      row: number;
      col: number;
      dr: number;
      dc: number;
      type: DirectionType;
    }[] = [];

    for (const dir of availableDirs) {
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          const endR = r + dir.dr * (chars.length - 1);
          const endC = c + dir.dc * (chars.length - 1);
          if (endR < 0 || endR >= size || endC < 0 || endC >= size) continue;

          let fits = true;
          for (let i = 0; i < chars.length; i++) {
            const nr = r + dir.dr * i;
            const nc = c + dir.dc * i;
            const existing = grid[nr][nc];
            if (existing !== null && existing !== chars[i]) {
              fits = false;
              break;
            }
          }
          if (fits) {
            candidates.push({ row: r, col: c, dr: dir.dr, dc: dir.dc, type: dir.type });
          }
        }
      }
    }

    if (candidates.length > 0) {
      const chosen = candidates[Math.floor(Math.random() * candidates.length)];
      const cells: CellCoord[] = [];
      for (let i = 0; i < chars.length; i++) {
        const nr = chosen.row + chosen.dr * i;
        const nc = chosen.col + chosen.dc * i;
        grid[nr][nc] = chars[i];
        cells.push({ row: nr, col: nc });
      }
      placements.push({
        wordItem,
        cells,
        direction: chosen.type,
        colorIndex: idx % 6,
      });
    }
  });

  // Collect syllables from target words + common filler syllables so board looks natural
  const wordSyllables = placements.flatMap((p) => Array.from(p.wordItem.word));
  const pool = [...FILLER_SYLLABLES, ...wordSyllables];

  const finalGrid: string[][] = grid.map((row) =>
    row.map((cell) => {
      if (cell !== null) return cell;
      return pool[Math.floor(Math.random() * pool.length)];
    })
  );

  return {
    size,
    grid: finalGrid,
    placements,
  };
}

export function getLineCells(start: CellCoord, end: CellCoord): CellCoord[] {
  const dr = end.row - start.row;
  const dc = end.col - start.col;

  if (dr === 0 && dc === 0) return [start];

  const absR = Math.abs(dr);
  const absC = Math.abs(dc);

  // Must be straight horizontal, vertical, or 45-degree diagonal
  if (dr !== 0 && dc !== 0 && absR !== absC) {
    return [];
  }

  const steps = Math.max(absR, absC);
  const stepR = dr === 0 ? 0 : dr / absR;
  const stepC = dc === 0 ? 0 : dc / absC;

  const cells: CellCoord[] = [];
  for (let i = 0; i <= steps; i++) {
    cells.push({
      row: start.row + stepR * i,
      col: start.col + stepC * i,
    });
  }
  return cells;
}
