export type GameMode = 'wordsearch' | 'chosung';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type ThemeId = 'all' | 'animals' | 'food' | 'school' | 'nature';

export interface WordItem {
  id: string;
  word: string;
  hint: string;
  theme: Exclude<ThemeId, 'all'>;
  level: Difficulty;
}

export interface ThemeMeta {
  id: ThemeId;
  label: string;
  description: string;
}

export interface DifficultyMeta {
  id: Difficulty;
  label: string;
  gradeLabel: string;
  gridSize: number;
  wordSearchCount: number;
  quizCount: number;
  allowDiagonal: boolean;
}

export const THEMES: ThemeMeta[] = [
  { id: 'all', label: '전체 모험', description: '모든 주제의 낱말이 골고루 나와요' },
  { id: 'animals', label: '동물 친구들', description: '귀엽고 멋진 동물 이름 맞히기' },
  { id: 'food', label: '맛있는 간식', description: '달콤하고 맛있는 음식 낱말' },
  { id: 'school', label: '우리 학교', description: '교실과 운동장에서 만나는 낱말' },
  { id: 'nature', label: '자연과 우주', description: '하늘, 바다, 별과 꽃 이야기' },
];

export const DIFFICULTIES: DifficultyMeta[] = [
  {
    id: 'easy',
    label: '새싹',
    gradeLabel: '1~2학년 추천',
    gridSize: 6,
    wordSearchCount: 4,
    quizCount: 6,
    allowDiagonal: false,
  },
  {
    id: 'medium',
    label: '튼튼',
    gradeLabel: '3~4학년 추천',
    gridSize: 7,
    wordSearchCount: 5,
    quizCount: 8,
    allowDiagonal: true,
  },
  {
    id: 'hard',
    label: '박사',
    gradeLabel: '5~6학년 추천',
    gridSize: 8,
    wordSearchCount: 6,
    quizCount: 10,
    allowDiagonal: true,
  },
];

const CHOSUNG_LIST = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ',
  'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
];

export function getChosung(word: string): string {
  return Array.from(word)
    .map((ch) => {
      const code = ch.charCodeAt(0);
      if (code >= 0xac00 && code <= 0xd7a3) {
        const index = Math.floor((code - 0xac00) / (21 * 28));
        return CHOSUNG_LIST[index] ?? ch;
      }
      return ch;
    })
    .join(' ');
}

export const WORD_BANK: WordItem[] = [
  // 동물 친구들 (Animals)
  { id: 'a1', word: '사자', hint: '멋진 갈기가 있고 동물의 왕이라고 불려요.', theme: 'animals', level: 'easy' },
  { id: 'a2', word: '기린', hint: '목이 아주 길어서 높은 나무의 잎을 먹어요.', theme: 'animals', level: 'easy' },
  { id: 'a3', word: '토끼', hint: '귀가 길고 깡충깡충 뛰어다니는 동물이에요.', theme: 'animals', level: 'easy' },
  { id: 'a4', word: '고래', hint: '바다에 사는 아주 크고 멋진 동물이에요.', theme: 'animals', level: 'easy' },
  { id: 'a5', word: '펭귄', hint: '뒤뚱뒤뚱 걷고 얼음 나라에서 수영을 잘해요.', theme: 'animals', level: 'easy' },
  { id: 'a6', word: '나비', hint: '예쁜 날개를 펄럭이며 꽃을 찾아다녀요.', theme: 'animals', level: 'easy' },
  { id: 'a7', word: '코끼리', hint: '코가 아주 길고 큰 귀를 가진 육지 동물이에요.', theme: 'animals', level: 'medium' },
  { id: 'a8', word: '다람쥐', hint: '도토리를 좋아하고 나무를 잘 타는 작은 동물이에요.', theme: 'animals', level: 'medium' },
  { id: 'a9', word: '병아리', hint: '노란 솜털이 보송보송하고 삐약삐약 울어요.', theme: 'animals', level: 'medium' },
  { id: 'a10', word: '강아지', hint: '사람을 잘 따르고 멍멍 짖는 귀여운 친구예요.', theme: 'animals', level: 'medium' },
  { id: 'a11', word: '고양이', hint: '수염이 있고 야옹 울며 발소리가 아주 조용해요.', theme: 'animals', level: 'medium' },
  { id: 'a12', word: '개구리', hint: '개굴개굴 울고 뒷다리로 폴짝 높이 뛰어요.', theme: 'animals', level: 'medium' },
  { id: 'a13', word: '거북이', hint: '등에 단단한 등딱지를 지고 느릿느릿 걸어요.', theme: 'animals', level: 'hard' },
  { id: 'a14', word: '호랑이', hint: '주황색 털에 검은 줄무늬가 있는 용맹한 동물이에요.', theme: 'animals', level: 'hard' },
  { id: 'a15', word: '돌고래', hint: '영리하고 물 위로 점프하는 바다 동물이에요.', theme: 'animals', level: 'hard' },
  { id: 'a16', word: '얼룩말', hint: '하얀 몸에 검은 줄무늬가 가득한 초원의 동물이에요.', theme: 'animals', level: 'hard' },

  // 맛있는 간식 (Food)
  { id: 'f1', word: '사과', hint: '빨갛고 아삭아삭 달콤한 과일이에요.', theme: 'food', level: 'easy' },
  { id: 'f2', word: '딸기', hint: '빨간 빛깔에 작은 씨가 콕콕 박힌 봄 과일이에요.', theme: 'food', level: 'easy' },
  { id: 'f3', word: '수박', hint: '겉은 초록색이고 속은 빨간 여름 대표 과일이에요.', theme: 'food', level: 'easy' },
  { id: 'f4', word: '포도', hint: '보라색 작은 알맹이가 송이송이 달려 있어요.', theme: 'food', level: 'easy' },
  { id: 'f5', word: '우유', hint: '하얗고 고소하며 뼈를 튼튼하게 해 주어요.', theme: 'food', level: 'easy' },
  { id: 'f6', word: '김밥', hint: '김 위에 밥과 여러 재료를 올려 돌돌 말아 먹어요.', theme: 'food', level: 'easy' },
  { id: 'f7', word: '바나나', hint: '노란 껍질을 까서 먹는 길쭉하고 달콤한 과일이에요.', theme: 'food', level: 'medium' },
  { id: 'f8', word: '떡볶이', hint: '쫄깃한 떡을 빨갛고 매콤달콤한 양념에 볶았어요.', theme: 'food', level: 'medium' },
  { id: 'f9', word: '초콜릿', hint: '카카오로 만들어 달콤하고 사르르 녹는 간식이에요.', theme: 'food', level: 'medium' },
  { id: 'f10', word: '옥수수', hint: '노란 알갱이가 줄지어 달려 있고 쪄 먹으면 고소해요.', theme: 'food', level: 'medium' },
  { id: 'f11', word: '고구마', hint: '보라색 껍질 안에 노란 속이 달콤한 뿌리채소예요.', theme: 'food', level: 'medium' },
  { id: 'f12', word: '만두', hint: '얇은 피 안에 고기와 채소를 넣어 빚어 쪄 먹어요.', theme: 'food', level: 'easy' },
  { id: 'f13', word: '아이스크림', hint: '차갑고 달콤해서 여름에 특히 인기 있는 간식이에요.', theme: 'food', level: 'hard' },
  { id: 'f14', word: '치즈피자', hint: '둥근 도우 위에 쭉 늘어나는 치즈가 올라간 요리예요.', theme: 'food', level: 'hard' },
  { id: 'f15', word: '미역국', hint: '생일날 아침에 정성껏 끓여 먹는 따뜻한 국이에요.', theme: 'food', level: 'hard' },
  { id: 'f16', word: '감자튀김', hint: '길쭉하게 썬 감자를 노릇노릇 바삭하게 튀겼어요.', theme: 'food', level: 'hard' },

  // 우리 학교 (School)
  { id: 's1', word: '연필', hint: '공책에 글씨를 쓰거나 그림을 그릴 때 사용해요.', theme: 'school', level: 'easy' },
  { id: 's2', word: '공책', hint: '배운 내용을 적거나 숙제를 할 때 펼치는 책이에요.', theme: 'school', level: 'easy' },
  { id: 's3', word: '칠판', hint: '교실 앞쪽에 있어 선생님이 글을 써 주시는 판이에요.', theme: 'school', level: 'easy' },
  { id: 's4', word: '친구', hint: '학교에서 함께 공부하고 신나게 노는 짝꿍이에요.', theme: 'school', level: 'easy' },
  { id: 's5', word: '필통', hint: '연필과 지우개를 깔끔하게 넣어 다니는 통이에요.', theme: 'school', level: 'easy' },
  { id: 's6', word: '교실', hint: '우리 반 친구들이 모여 수업을 듣는 방이에요.', theme: 'school', level: 'easy' },
  { id: 's7', word: '지우개', hint: '연필로 잘못 쓴 글씨를 깨끗하게 지워 주어요.', theme: 'school', level: 'medium' },
  { id: 's8', word: '선생님', hint: '우리에게 즐겁게 공부하는 법을 가르쳐 주시는 분이에요.', theme: 'school', level: 'medium' },
  { id: 's9', word: '도서관', hint: '재미있는 책이 아주 많이 모여 있는 조용한 곳이에요.', theme: 'school', level: 'medium' },
  { id: 's10', word: '운동장', hint: '체육 시간에 달리기와 공놀이를 하는 넓은 곳이에요.', theme: 'school', level: 'medium' },
  { id: 's11', word: '책가방', hint: '교과서와 필통을 넣고 등에 메고 등교하는 가방이에요.', theme: 'school', level: 'medium' },
  { id: 's12', word: '급식실', hint: '점심시간에 맛있는 밥과 반찬을 먹는 곳이에요.', theme: 'school', level: 'hard' },
  { id: 's13', word: '색연필', hint: '여러 가지 예쁜 색깔로 그림을 색칠하는 도구예요.', theme: 'school', level: 'hard' },
  { id: 's14', word: '실내화', hint: '학교 건물 안에서 발이 편하도록 갈아 신는 신발이에요.', theme: 'school', level: 'hard' },
  { id: 's15', word: '받아쓰기', hint: '불러 주는 낱말이나 문장을 바르게 적어 보는 연습이에요.', theme: 'school', level: 'hard' },
  { id: 's16', word: '알림장', hint: '오늘의 숙제와 준비물을 적어 집에 가져가는 공책이에요.', theme: 'school', level: 'hard' },

  // 자연과 우주 (Nature & Space)
  { id: 'n1', word: '구름', hint: '파란 하늘에 솜사탕처럼 둥실둥실 떠 있어요.', theme: 'nature', level: 'easy' },
  { id: 'n2', word: '태양', hint: '낮 동안 세상을 밝고 따뜻하게 비춰 주는 별이에요.', theme: 'nature', level: 'easy' },
  { id: 'n3', word: '바다', hint: '넓고 푸른 물결이 치고 물고기가 사는 곳이에요.', theme: 'nature', level: 'easy' },
  { id: 'n4', word: '바람', hint: '눈에는 보이지 않지만 나뭇잎을 살랑살랑 흔들어요.', theme: 'nature', level: 'easy' },
  { id: 'n5', word: '별빛', hint: '밤하늘에서 반짝반짝 빛나는 작은 빛이에요.', theme: 'nature', level: 'easy' },
  { id: 'n6', word: '무지개', hint: '비가 그친 뒤 하늘에 일곱 빛깔로 뜨는 다리예요.', theme: 'nature', level: 'medium' },
  { id: 'n7', word: '소나무', hint: '사계절 내내 푸른 잎을 간직한 씩씩한 나무예요.', theme: 'nature', level: 'medium' },
  { id: 'n8', word: '민들레', hint: '노란 꽃이 피고 하얀 씨앗이 바람에 날아가요.', theme: 'nature', level: 'medium' },
  { id: 'n9', word: '눈사람', hint: '겨울에 내린 눈을 동그랗게 뭉쳐서 만들어요.', theme: 'nature', level: 'medium' },
  { id: 'n10', word: '우주선', hint: '우주비행사를 태우고 먼 우주로 날아가는 탈것이에요.', theme: 'nature', level: 'medium' },
  { id: 'n11', word: '달나라', hint: '밤하늘에 둥글게 떠 있는 지구의 가장 가까운 이웃이에요.', theme: 'nature', level: 'medium' },
  { id: 'n12', word: '해바라기', hint: '해가 있는 쪽을 바라보며 활짝 피는 큰 노란 꽃이에요.', theme: 'nature', level: 'hard' },
  { id: 'n13', word: '은하수', hint: '수많은 별들이 밤하늘에 강물처럼 흐르는 모습이에요.', theme: 'nature', level: 'hard' },
  { id: 'n14', word: '소나기', hint: '여름날 갑자기 세차게 쏟아지다 금방 그치는 비예요.', theme: 'nature', level: 'hard' },
  { id: 'n15', word: '단풍잎', hint: '가을이 되면 빨갛고 노랗게 물드는 예쁜 나뭇잎이에요.', theme: 'nature', level: 'hard' },
  { id: 'n16', word: '북극성', hint: '밤하늘에서 항상 북쪽 방향을 알려 주는 별이에요.', theme: 'nature', level: 'hard' },
];

export function selectWordsForRound(
  theme: ThemeId,
  difficulty: Difficulty,
  count: number,
  maxWordLength?: number
): WordItem[] {
  const themeFiltered =
    theme === 'all' ? WORD_BANK : WORD_BANK.filter((item) => item.theme === theme);

  const lengthFiltered = maxWordLength
    ? themeFiltered.filter((item) => item.word.length <= maxWordLength)
    : themeFiltered;

  // Prioritize words matching difficulty, then pad with other levels from same theme
  const primary = lengthFiltered.filter((item) => item.level === difficulty);
  const secondary = lengthFiltered.filter((item) => item.level !== difficulty);

  const shuffle = <T,>(arr: T[]): T[] => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const combined = [...shuffle(primary), ...shuffle(secondary)];
  return combined.slice(0, Math.min(count, combined.length));
}
