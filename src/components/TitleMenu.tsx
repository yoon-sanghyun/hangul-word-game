import React, { useState } from 'react';
import {
  BookOpen,
  Cloud,
  Grid3X3,
  HelpCircle,
  LogIn,
  LogOut,
  Pencil,
  Play,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
} from 'lucide-react';
import heroIllustration from '../assets/images/hangul_word_adventure_hero_1794638449308.jpg';
import {
  DIFFICULTIES,
  Difficulty,
  GameMode,
  THEMES,
  ThemeId,
} from '../data/words';
import { GameRecordDoc, LeaderboardEntryDoc } from '../services/firestoreService';

export interface PlayerStats {
  gamesCompleted: number;
  bestScore: number;
  totalWordsSolved: number;
}

interface TitleMenuProps {
  mode: GameMode;
  theme: ThemeId;
  difficulty: Difficulty;
  stats: PlayerStats;
  isMuted: boolean;
  isSignedIn: boolean;
  authBusy: boolean;
  nickname: string;
  leaderboard: LeaderboardEntryDoc[];
  myHistory: GameRecordDoc[];
  cloudError: string | null;
  onSelectMode: (mode: GameMode) => void;
  onSelectTheme: (theme: ThemeId) => void;
  onSelectDifficulty: (difficulty: Difficulty) => void;
  onToggleMute: () => void;
  onStartGame: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
  onSaveNickname: (nextName: string) => Promise<void>;
}

function formatModeLabel(mode: GameMode): string {
  return mode === 'wordsearch' ? '숨은 낱말 찾기' : '초성 낱말 퀴즈';
}

function formatDiffLabel(diff: Difficulty): string {
  return diff === 'easy' ? '새싹' : diff === 'medium' ? '튼튼' : '박사';
}

export const TitleMenu: React.FC<TitleMenuProps> = ({
  mode,
  theme,
  difficulty,
  stats,
  isMuted,
  isSignedIn,
  authBusy,
  nickname,
  leaderboard,
  myHistory,
  cloudError,
  onSelectMode,
  onSelectTheme,
  onSelectDifficulty,
  onToggleMute,
  onStartGame,
  onSignIn,
  onSignOut,
  onSaveNickname,
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(nickname);
  const [savingName, setSavingName] = useState(false);

  const selectedThemeMeta = THEMES.find((t) => t.id === theme) ?? THEMES[0];
  const selectedDiffMeta = DIFFICULTIES.find((d) => d.id === difficulty) ?? DIFFICULTIES[0];

  const handleNicknameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftName.trim()) return;
    setSavingName(true);
    try {
      await onSaveNickname(draftName);
      setEditingName(false);
    } finally {
      setSavingName(false);
    }
  };

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-12">
      {/* Hero Split: Balanced 2-Column Layout */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <p className="text-sm font-semibold text-blue-700">
              초등학생 맞춤 한글 어휘 놀이 · 무료 낱말 게임
            </p>
            <h1
              className="font-display text-4xl sm:text-5xl text-slate-900 leading-tight"
              style={{ textWrap: 'balance' }}
            >
              글자 블록을 누르며 재미있게 낱말을 찾아봐요
            </h1>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
              숨어 있는 낱말을 찾거나, 초성과 설명을 보고 글자 타일을 맞춰 보세요.
              어려운 문제가 나와도 단계별 힌트가 있어서 누구나 끝까지 풀 수 있어요.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              type="button"
              onClick={onStartGame}
              className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 text-base font-bold text-white bg-blue-600 hover:bg-blue-700 active:translate-y-0.5 rounded-xl border-b-4 border-blue-800 transition-all whitespace-nowrap shrink-0 min-h-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              <Play className="w-5 h-5 fill-current" aria-hidden="true" />
              <span>게임 시작하기</span>
            </button>

            <button
              type="button"
              onClick={onToggleMute}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors whitespace-nowrap shrink-0 min-h-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              {isMuted ? (
                <>
                  <VolumeX className="w-4 h-4 text-slate-500" aria-hidden="true" />
                  <span>소리 꺼짐</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-blue-600" aria-hidden="true" />
                  <span>효과음 켜짐</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="lg:col-span-6 flex">
          <div className="w-full rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm flex items-center justify-center min-h-[260px]">
            {!imgFailed ? (
              <img
                src={heroIllustration}
                alt="곰과 토끼 친구가 책상 위에서 즐겁게 낱말 카드를 맞추는 모습"
                referrerPolicy="no-referrer"
                onError={() => setImgFailed(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full p-8 bg-gradient-to-br from-blue-50 via-slate-50 to-amber-50 flex flex-col items-center justify-center text-center gap-3">
                <BookOpen className="w-12 h-12 text-blue-600" aria-hidden="true" />
                <p className="font-display text-2xl text-slate-800">한글 낱말 놀이터</p>
                <p className="text-sm text-slate-600">동물, 간식, 학교, 자연 낱말을 모아 보아요</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Game Configuration Section */}
      <section
        id="game-setup"
        aria-labelledby="setup-heading"
        className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 border-b border-slate-100 pb-4">
          <h2 id="setup-heading" className="font-display text-2xl text-slate-900">
            오늘 어떤 놀이를 해볼까요?
          </h2>
          <p className="text-sm text-slate-500">
            선택 중: {mode === 'wordsearch' ? '숨은 낱말 찾기' : '초성 낱말 퀴즈'} ·{' '}
            {selectedThemeMeta.label} · {selectedDiffMeta.label} ({selectedDiffMeta.gradeLabel})
          </p>
        </div>

        {/* 1. Game Mode Selection */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-700">1. 놀이 방식 고르기</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => onSelectMode('wordsearch')}
              aria-pressed={mode === 'wordsearch'}
              className={`text-left p-5 rounded-xl border-2 transition-all min-h-[88px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                mode === 'wordsearch'
                  ? 'border-blue-600 bg-blue-50/70 text-slate-900'
                  : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`p-2.5 rounded-lg shrink-0 ${
                    mode === 'wordsearch' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Grid3X3 className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="space-y-1">
                  <div className="font-bold text-base text-slate-900">숨은 낱말 찾기</div>
                  <p className="text-sm text-slate-600 leading-snug">
                    글자판에 숨어 있는 낱말을 가로, 세로, 대각선으로 드래그하거나 눌러서 찾아요.
                  </p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onSelectMode('chosung')}
              aria-pressed={mode === 'chosung'}
              className={`text-left p-5 rounded-xl border-2 transition-all min-h-[88px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                mode === 'chosung'
                  ? 'border-blue-600 bg-blue-50/70 text-slate-900'
                  : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`p-2.5 rounded-lg shrink-0 ${
                    mode === 'chosung' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <HelpCircle className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="space-y-1">
                  <div className="font-bold text-base text-slate-900">초성 낱말 퀴즈</div>
                  <p className="text-sm text-slate-600 leading-snug">
                    초성(예: ㅅ ㅈ)과 뜻풀이를 보고 알맞은 글자 타일을 순서대로 눌러 완성해요.
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* 2. Theme Selection */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-700">2. 낱말 주제 고르기</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {THEMES.map((item) => {
              const active = theme === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTheme(item.id)}
                  aria-pressed={active}
                  className={`px-4 py-3 rounded-xl border text-left transition-all min-h-[68px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    active
                      ? 'border-blue-600 bg-blue-600 text-white font-semibold'
                      : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  <div className="text-sm font-bold whitespace-nowrap truncate">{item.label}</div>
                  <div
                    className={`text-xs mt-1 leading-tight ${
                      active ? 'text-blue-100' : 'text-slate-500'
                    }`}
                  >
                    {item.description}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Difficulty Selection */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-700">3. 난이도 고르기</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {DIFFICULTIES.map((diff) => {
              const active = difficulty === diff.id;
              return (
                <button
                  key={diff.id}
                  type="button"
                  onClick={() => onSelectDifficulty(diff.id)}
                  aria-pressed={active}
                  className={`px-4 py-3.5 rounded-xl border text-left transition-all min-h-[64px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    active
                      ? 'border-blue-600 bg-blue-50 text-blue-950 ring-1 ring-blue-600'
                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-base whitespace-nowrap">{diff.label} 단계</span>
                    <span className="text-xs font-medium text-slate-500 whitespace-nowrap">
                      {diff.gradeLabel}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 mt-1 tabular-nums">
                    {mode === 'wordsearch'
                      ? `${diff.gridSize}×${diff.gridSize} 글자판 · 낱말 ${diff.wordSearchCount}개`
                      : `퀴즈 ${diff.quizCount}문제 · ${diff.allowDiagonal ? '2~4글자 낱말' : '2~3글자 낱말'}`}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA inside Setup */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-slate-100">
          <div className="text-sm text-slate-600">
            타자를 치지 않고 마우스나 손가락으로 글자를 누르기만 하면 돼요.
          </div>
          <button
            type="button"
            onClick={onStartGame}
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base font-bold text-white bg-blue-600 hover:bg-blue-700 active:translate-y-0.5 rounded-xl border-b-4 border-blue-800 transition-all whitespace-nowrap shrink-0 min-h-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <Play className="w-4 h-4 fill-current" aria-hidden="true" />
            <span>이 설정으로 시작하기</span>
          </button>
        </div>
      </section>

      {/* Bottom 2-column strip: How to Play + Player Records & Cloud Leaderboard */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
        <div id="how-to-play" className="lg:col-span-6 space-y-4">
          <h2 className="font-display text-2xl text-slate-900">어떻게 노나요?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
              <div className="text-sm font-bold text-blue-700">01. 고르기</div>
              <p className="text-sm text-slate-600 leading-relaxed">
                좋아하는 주제와 학년에 맞는 난이도를 골라 시작 버튼을 눌러요.
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
              <div className="text-sm font-bold text-blue-700">02. 찾고 맞히기</div>
              <p className="text-sm text-slate-600 leading-relaxed">
                숨은 낱말은 첫 글자부터 끝 글자까지 쭉 이어 보고, 퀴즈는 글자 타일을 차례대로 눌러요.
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
              <div className="text-sm font-bold text-blue-700">03. 힌트 쓰기</div>
              <p className="text-sm text-slate-600 leading-relaxed">
                헷갈릴 때는 힌트 버튼을 눌러 첫 글자나 방향 힌트를 받아 보세요.
              </p>
            </div>
          </div>
        </div>

        <div id="my-records" className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-2xl text-slate-900">나의 놀이 기록</h2>
            {isSignedIn ? (
              <button
                type="button"
                onClick={onSignOut}
                disabled={authBusy}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors whitespace-nowrap"
              >
                <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                <span>로그아웃</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onSignIn}
                disabled={authBusy}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap min-h-[36px]"
              >
                <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{authBusy ? '연결 중...' : 'Google 로그인으로 저장'}</span>
              </button>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-5">
            <div className="grid grid-cols-3 gap-4 divide-x divide-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                  <Trophy className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
                  <span>최고 점수</span>
                </div>
                <div className="text-2xl font-bold text-slate-900 tabular-nums">
                  {stats.bestScore}점
                </div>
              </div>
              <div className="pl-4 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
                  <span>맞힌 낱말</span>
                </div>
                <div className="text-2xl font-bold text-slate-900 tabular-nums">
                  {stats.totalWordsSolved}개
                </div>
              </div>
              <div className="pl-4 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                  <span>완료한 판</span>
                </div>
                <div className="text-2xl font-bold text-slate-900 tabular-nums">
                  {stats.gamesCompleted}판
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-3">
              {isSignedIn ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <Cloud className="w-4 h-4 text-blue-600 shrink-0" aria-hidden="true" />
                      <span>
                        클라우드 연결됨 · 별명 <strong className="text-slate-900">{nickname}</strong>
                      </span>
                    </div>
                    {!editingName && (
                      <button
                        type="button"
                        onClick={() => {
                          setDraftName(nickname);
                          setEditingName(true);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline"
                      >
                        <Pencil className="w-3 h-3" aria-hidden="true" />
                        <span>별명 바꾸기</span>
                      </button>
                    )}
                  </div>

                  {editingName && (
                    <form onSubmit={handleNicknameSubmit} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={draftName}
                        onChange={(e) => setDraftName(e.target.value)}
                        maxLength={20}
                        placeholder="새 별명 (최대 20자)"
                        className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="submit"
                        disabled={savingName || !draftName.trim()}
                        className="px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg whitespace-nowrap"
                      >
                        {savingName ? '저장 중' : '저장'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingName(false)}
                        className="px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg whitespace-nowrap"
                      >
                        취소
                      </button>
                    </form>
                  )}
                </>
              ) : (
                <p className="text-xs text-slate-500 leading-relaxed">
                  Google 로그인을 연결하면 다른 기기에서도 내 기록이 이어지고 명예의 전당에 점수를 남길 수 있어요. 로그인하지 않아도 모든 게임을 바로 즐길 수 있습니다.
                </p>
              )}

              {cloudError && (
                <p className="text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  {cloudError}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Signed-in Leaderboard & Recent History */}
      {isSignedIn && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
            <div className="flex items-baseline justify-between gap-2 border-b border-slate-100 pb-3">
              <h2 className="font-display text-xl text-slate-900">명예의 전당 상위 10명</h2>
              <span className="text-xs text-slate-500">실시간 Firestore 순위</span>
            </div>

            {leaderboard.length === 0 ? (
              <p className="text-sm text-slate-500 py-4">
                아직 등록된 점수가 없어요. 첫 번째 1등 주인공이 되어 보세요!
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="text-xs text-slate-500 border-b border-slate-100">
                      <th className="py-2 pr-3 font-semibold">순위</th>
                      <th className="py-2 pr-3 font-semibold">별명</th>
                      <th className="py-2 pr-3 font-semibold">놀이 · 단계</th>
                      <th className="py-2 text-right font-semibold">점수</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 tabular-nums">
                    {leaderboard.map((entry, idx) => (
                      <tr key={entry.id}>
                        <td className="py-2.5 pr-3 font-bold text-slate-700">{idx + 1}위</td>
                        <td className="py-2.5 pr-3 font-medium text-slate-900">{entry.nickname}</td>
                        <td className="py-2.5 pr-3 text-slate-600 text-xs">
                          {formatModeLabel(entry.mode)} · {formatDiffLabel(entry.difficulty)}
                        </td>
                        <td className="py-2.5 text-right font-bold text-blue-700">
                          {entry.score}점
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
            <div className="flex items-baseline justify-between gap-2 border-b border-slate-100 pb-3">
              <h2 className="font-display text-xl text-slate-900">최근 내 놀이 기록</h2>
              <span className="text-xs text-slate-500">최근 5판</span>
            </div>

            {myHistory.length === 0 ? (
              <p className="text-sm text-slate-500 py-4">
                게임을 한 판 완료하면 여기에 최근 기록이 차곡차곡 모여요.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {myHistory.map((rec) => (
                  <li key={rec.id} className="py-2.5 flex items-center justify-between gap-3 text-sm">
                    <div>
                      <div className="font-semibold text-slate-800">
                        {formatModeLabel(rec.mode)}
                      </div>
                      <div className="text-xs text-slate-500 tabular-nums">
                        {formatDiffLabel(rec.difficulty)} 단계 · {rec.solvedCount}/{rec.totalCount}개 맞힘
                      </div>
                    </div>
                    <div className="font-bold text-blue-700 tabular-nums">{rec.score}점</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}
    </main>
  );
};
