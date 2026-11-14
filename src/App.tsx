import { useCallback, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { ChosungQuizGame } from './components/ChosungQuizGame';
import { Header } from './components/Header';
import { PlayerStats, TitleMenu } from './components/TitleMenu';
import { VictoryModal } from './components/VictoryModal';
import { WordSearchGame } from './components/WordSearchGame';
import { Difficulty, GameMode, ThemeId } from './data/words';
import { auth, googleProvider } from './firebase';
import {
  GameRecordDoc,
  LeaderboardEntryDoc,
  ensurePlayerProfile,
  saveRoundToFirestore,
  subscribeLeaderboard,
  subscribeMyHistory,
  updatePlayerNickname,
} from './services/firestoreService';
import { playTap, playVictory, setSoundMuted } from './utils/sound';

type GameState = 'TITLE_MENU' | 'PLAYING' | 'ROUND_SUMMARY';

const STATS_STORAGE_KEY = 'hangul_word_playground_stats_v1';

function loadLocalStats(): PlayerStats {
  try {
    const raw = window.localStorage.getItem(STATS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PlayerStats>;
      return {
        gamesCompleted: typeof parsed.gamesCompleted === 'number' ? parsed.gamesCompleted : 0,
        bestScore: typeof parsed.bestScore === 'number' ? parsed.bestScore : 0,
        totalWordsSolved: typeof parsed.totalWordsSolved === 'number' ? parsed.totalWordsSolved : 0,
      };
    }
  } catch {
    // Ignore storage access errors
  }
  return { gamesCompleted: 0, bestScore: 0, totalWordsSolved: 0 };
}

export default function App() {
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [mode, setMode] = useState<GameMode>('wordsearch');
  const [theme, setTheme] = useState<ThemeId>('all');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [isMuted, setIsMuted] = useState(false);
  const [hudText, setHudText] = useState('');
  const [stats, setStats] = useState<PlayerStats>(() => loadLocalStats());
  const [roundKey, setRoundKey] = useState(0);

  // Firebase Auth & Firestore state
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [nickname, setNickname] = useState('낱말탐험가');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntryDoc[]>([]);
  const [myHistory, setMyHistory] = useState<GameRecordDoc[]>([]);
  const [cloudError, setCloudError] = useState<string | null>(null);
  const [cloudSaved, setCloudSaved] = useState(false);

  const [lastResult, setLastResult] = useState<{
    score: number;
    solvedCount: number;
    totalCount: number;
    elapsedSeconds: number;
    isNewBest: boolean;
  } | null>(null);

  useEffect(() => {
    setSoundMuted(isMuted);
  }, [isMuted]);

  // Observe Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);

      if (!nextUser) {
        setStats(loadLocalStats());
        setLeaderboard([]);
        setMyHistory([]);
        setCloudError(null);
        return;
      }

      try {
        setCloudError(null);
        const profile = await ensurePlayerProfile(
          nextUser.uid,
          nextUser.displayName || '낱말탐험가'
        );
        setNickname(profile.nickname);
        setStats({
          bestScore: profile.bestScore,
          gamesCompleted: profile.gamesCompleted,
          totalWordsSolved: profile.totalWordsSolved,
        });
      } catch {
        setCloudError('클라우드 기록을 불러오는 중 잠시 문제가 생겼어요.');
      }
    });

    return () => unsubscribe();
  }, []);

  // Attach Firestore snapshot listeners only when auth is ready and user is authenticated
  useEffect(() => {
    if (!authReady || !user) return;

    const unsubBoard = subscribeLeaderboard(
      (entries) => setLeaderboard(entries),
      () => setCloudError('순위표를 불러오지 못했어요.')
    );
    const unsubHistory = subscribeMyHistory(
      user.uid,
      (records) => setMyHistory(records),
      () => setCloudError('최근 기록을 불러오지 못했어요.')
    );

    return () => {
      unsubBoard();
      unsubHistory();
    };
  }, [authReady, user]);

  const handleSignIn = useCallback(async () => {
    playTap();
    setAuthBusy(true);
    setCloudError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch {
      setCloudError('로그인 창이 닫혔거나 연결에 실패했어요. 다시 시도해 주세요.');
    } finally {
      setAuthBusy(false);
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    playTap();
    setAuthBusy(true);
    try {
      await signOut(auth);
    } finally {
      setAuthBusy(false);
    }
  }, []);

  const handleSaveNickname = useCallback(
    async (nextName: string) => {
      if (!user) return;
      const saved = await updatePlayerNickname(user.uid, nextName);
      setNickname(saved);
    },
    [user]
  );

  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      setSoundMuted(next);
      if (!next) {
        playTap();
      }
      return next;
    });
  }, []);

  const handleStartGame = useCallback(() => {
    playTap();
    setRoundKey((prev) => prev + 1);
    setLastResult(null);
    setCloudSaved(false);
    setGameState('PLAYING');
  }, []);

  const handleGoHome = useCallback(() => {
    playTap();
    setLastResult(null);
    setCloudSaved(false);
    setGameState('TITLE_MENU');
  }, []);

  const handleRoundComplete = useCallback(
    async (result: {
      score: number;
      solvedCount: number;
      totalCount: number;
      elapsedSeconds: number;
    }) => {
      playVictory();
      const isNewBest = result.score > stats.bestScore;
      const nextStats: PlayerStats = {
        gamesCompleted: stats.gamesCompleted + 1,
        bestScore: Math.max(stats.bestScore, result.score),
        totalWordsSolved: stats.totalWordsSolved + result.solvedCount,
      };
      setStats(nextStats);
      setLastResult({ ...result, isNewBest });
      setCloudSaved(false);
      setGameState('ROUND_SUMMARY');

      if (user) {
        try {
          const synced = await saveRoundToFirestore({
            uid: user.uid,
            nickname,
            currentProfile: stats,
            mode,
            theme,
            difficulty,
            score: result.score,
            solvedCount: result.solvedCount,
            totalCount: result.totalCount,
            elapsedSeconds: result.elapsedSeconds,
          });
          setStats(synced);
          setCloudSaved(true);
        } catch {
          setCloudError('점수를 클라우드에 저장하지 못했어요.');
        }
      } else {
        try {
          window.localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(nextStats));
        } catch {
          // Ignore storage errors
        }
      }
    },
    [stats, user, nickname, mode, theme, difficulty]
  );

  const handlePlayAgain = useCallback(() => {
    playTap();
    setLastResult(null);
    setCloudSaved(false);
    setRoundKey((prev) => prev + 1);
    setGameState('PLAYING');
  }, []);

  const isPlaying = gameState === 'PLAYING' || gameState === 'ROUND_SUMMARY';

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F9FC] text-slate-900">
      <Header
        isPlaying={isPlaying}
        hudText={hudText}
        onGoHome={handleGoHome}
        onQuickStart={handleStartGame}
      />

      <div className="flex-1">
        {gameState === 'TITLE_MENU' ? (
          <TitleMenu
            mode={mode}
            theme={theme}
            difficulty={difficulty}
            stats={stats}
            isMuted={isMuted}
            isSignedIn={Boolean(user)}
            authBusy={authBusy}
            nickname={nickname}
            leaderboard={leaderboard}
            myHistory={myHistory}
            cloudError={cloudError}
            onSelectMode={(next) => {
              playTap();
              setMode(next);
            }}
            onSelectTheme={(next) => {
              playTap();
              setTheme(next);
            }}
            onSelectDifficulty={(next) => {
              playTap();
              setDifficulty(next);
            }}
            onToggleMute={handleToggleMute}
            onStartGame={handleStartGame}
            onSignIn={handleSignIn}
            onSignOut={handleSignOut}
            onSaveNickname={handleSaveNickname}
          />
        ) : mode === 'wordsearch' ? (
          <WordSearchGame
            key={`ws-${roundKey}`}
            theme={theme}
            difficulty={difficulty}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onHudUpdate={setHudText}
            onComplete={handleRoundComplete}
          />
        ) : (
          <ChosungQuizGame
            key={`cq-${roundKey}`}
            theme={theme}
            difficulty={difficulty}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onHudUpdate={setHudText}
            onComplete={handleRoundComplete}
          />
        )}
      </div>

      {gameState === 'ROUND_SUMMARY' && lastResult && (
        <VictoryModal
          modeLabel={mode === 'wordsearch' ? '숨은 낱말 찾기' : '초성 낱말 퀴즈'}
          score={lastResult.score}
          solvedCount={lastResult.solvedCount}
          totalCount={lastResult.totalCount}
          elapsedSeconds={lastResult.elapsedSeconds}
          isNewBest={lastResult.isNewBest}
          isSignedIn={Boolean(user)}
          cloudSaved={cloudSaved}
          onPlayAgain={handlePlayAgain}
          onBackToMenu={handleGoHome}
        />
      )}

      <footer className="border-t border-slate-200 bg-white py-5 mt-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span>한글 낱말 놀이터 · 초등학생을 위한 어휘 학습 놀이</span>
          <span>동물 · 간식 · 학교 · 자연 주제 64개 낱말 수록</span>
        </div>
      </footer>
    </div>
  );
}
