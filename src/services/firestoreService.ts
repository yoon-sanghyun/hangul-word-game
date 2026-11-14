import {
  Timestamp,
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Difficulty, GameMode, ThemeId } from '../data/words';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface PlayerProfileDoc {
  uid: string;
  nickname: string;
  bestScore: number;
  gamesCompleted: number;
  totalWordsSolved: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface LeaderboardEntryDoc {
  id: string;
  uid: string;
  nickname: string;
  mode: GameMode;
  theme: ThemeId;
  difficulty: Difficulty;
  score: number;
  solvedCount: number;
  elapsedSeconds: number;
  isPublic: boolean;
  createdAt: Timestamp | null;
}

export interface GameRecordDoc {
  id: string;
  uid: string;
  mode: GameMode;
  theme: ThemeId;
  difficulty: Difficulty;
  score: number;
  solvedCount: number;
  totalCount: number;
  elapsedSeconds: number;
  createdAt: Timestamp | null;
}

export function sanitizeNickname(rawName: string | null | undefined): string {
  const cleaned = (rawName ?? '낱말탐험가').trim().replace(/\s+/g, ' ');
  if (cleaned.length === 0) return '낱말탐험가';
  return Array.from(cleaned).slice(0, 20).join('');
}

function clampInt(value: number, min: number, max: number): number {
  const rounded = Math.round(Number.isFinite(value) ? value : 0);
  return Math.max(min, Math.min(max, rounded));
}

function makeRecordId(): string {
  return `rec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function ensurePlayerProfile(
  uid: string,
  defaultNickname: string
): Promise<PlayerProfileDoc> {
  const path = `playerProfiles/${uid}`;
  const ref = doc(db, 'playerProfiles', uid);
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data() as PlayerProfileDoc;
    }

    const safeNickname = sanitizeNickname(defaultNickname);
    const payload = {
      uid,
      nickname: safeNickname,
      bestScore: 0,
      gamesCompleted: 0,
      totalWordsSolved: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(ref, payload);
    const createdSnap = await getDoc(ref);
    return createdSnap.data() as PlayerProfileDoc;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updatePlayerNickname(uid: string, nextNickname: string): Promise<string> {
  const safeNickname = sanitizeNickname(nextNickname);
  const path = `playerProfiles/${uid}`;
  try {
    await updateDoc(doc(db, 'playerProfiles', uid), {
      nickname: safeNickname,
      updatedAt: serverTimestamp(),
    });
    return safeNickname;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function saveRoundToFirestore(params: {
  uid: string;
  nickname: string;
  currentProfile: {
    bestScore: number;
    gamesCompleted: number;
    totalWordsSolved: number;
  };
  mode: GameMode;
  theme: ThemeId;
  difficulty: Difficulty;
  score: number;
  solvedCount: number;
  totalCount: number;
  elapsedSeconds: number;
}): Promise<{ bestScore: number; gamesCompleted: number; totalWordsSolved: number }> {
  const safeNickname = sanitizeNickname(params.nickname);
  const safeScore = clampInt(params.score, 0, 1000);
  const safeSolved = clampInt(params.solvedCount, 0, 50);
  const safeTotal = clampInt(params.totalCount, 1, 50);
  const safeElapsed = clampInt(params.elapsedSeconds, 0, 86400);

  const nextBest = clampInt(Math.max(params.currentProfile.bestScore, safeScore), 0, 10000);
  const nextCompleted = clampInt(params.currentProfile.gamesCompleted + 1, 0, 100000);
  const nextSolvedTotal = clampInt(
    params.currentProfile.totalWordsSolved + safeSolved,
    0,
    1000000
  );

  const recordId = makeRecordId();
  const profileRef = doc(db, 'playerProfiles', params.uid);
  const historyRef = doc(db, 'playerProfiles', params.uid, 'history', recordId);
  const leaderboardRef = doc(db, 'leaderboard', recordId);

  const batchPath = `playerProfiles/${params.uid}`;
  try {
    const batch = writeBatch(db);
    batch.update(profileRef, {
      nickname: safeNickname,
      bestScore: nextBest,
      gamesCompleted: nextCompleted,
      totalWordsSolved: nextSolvedTotal,
      updatedAt: serverTimestamp(),
    });

    batch.set(historyRef, {
      uid: params.uid,
      mode: params.mode,
      theme: params.theme,
      difficulty: params.difficulty,
      score: safeScore,
      solvedCount: safeSolved,
      totalCount: safeTotal,
      elapsedSeconds: safeElapsed,
      createdAt: serverTimestamp(),
    });

    batch.set(leaderboardRef, {
      uid: params.uid,
      nickname: safeNickname,
      mode: params.mode,
      theme: params.theme,
      difficulty: params.difficulty,
      score: safeScore,
      solvedCount: safeSolved,
      elapsedSeconds: safeElapsed,
      isPublic: true,
      createdAt: serverTimestamp(),
    });

    await batch.commit();
    return {
      bestScore: nextBest,
      gamesCompleted: nextCompleted,
      totalWordsSolved: nextSolvedTotal,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, batchPath);
  }
}

export function subscribeLeaderboard(
  onData: (entries: LeaderboardEntryDoc[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = 'leaderboard';
  const q = query(
    collection(db, path),
    where('isPublic', '==', true),
    limit(100)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const entries: LeaderboardEntryDoc[] = snapshot.docs
        .map((d) => {
          const data = d.data();
          return {
            id: d.id,
            uid: data.uid,
            nickname: data.nickname,
            mode: data.mode,
            theme: data.theme,
            difficulty: data.difficulty,
            score: data.score,
            solvedCount: data.solvedCount,
            elapsedSeconds: data.elapsedSeconds,
            isPublic: data.isPublic,
            createdAt: data.createdAt ?? null,
          };
        })
        .sort((a, b) => b.score - a.score || a.elapsedSeconds - b.elapsedSeconds)
        .slice(0, 10);
      onData(entries);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export function subscribeMyHistory(
  uid: string,
  onData: (records: GameRecordDoc[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = `playerProfiles/${uid}/history`;
  const q = query(
    collection(db, 'playerProfiles', uid, 'history'),
    where('uid', '==', uid),
    limit(50)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const records: GameRecordDoc[] = snapshot.docs
        .map((d) => {
          const data = d.data();
          return {
            id: d.id,
            uid: data.uid,
            mode: data.mode,
            theme: data.theme,
            difficulty: data.difficulty,
            score: data.score,
            solvedCount: data.solvedCount,
            totalCount: data.totalCount,
            elapsedSeconds: data.elapsedSeconds,
            createdAt: data.createdAt ?? null,
          };
        })
        .sort((a, b) => {
          const timeA = a.createdAt?.toMillis() ?? 0;
          const timeB = b.createdAt?.toMillis() ?? 0;
          return timeB - timeA;
        })
        .slice(0, 5);
      onData(records);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}
