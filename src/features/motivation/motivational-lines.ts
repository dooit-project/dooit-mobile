type QuoteSource = {
  title: string;
  url: string;
  locator: string;
  originalExcerpt: string;
  checkedOn: string;
};
export type MotivationalLine = {
  id: string;
  text: string;
} & ({ kind: 'original' } | { kind: 'quote'; author: string; source: QuoteSource });

export const motivationalLines: readonly MotivationalLine[] = [
  { id: 'small-start', text: '작게 시작해도 괜찮아요', kind: 'original' },
  {
    id: 'laozi-step',
    text: '천 리 길도 한 걸음부터',
    kind: 'quote',
    author: '노자',
    source: {
      title: '도덕경, James Legge 번역',
      locator: '64장 2절',
      url: 'https://www.gutenberg.org/files/216/216-h/216-h.htm',
      originalExcerpt: 'the journey of a thousand li commenced with a single step.',
      checkedOn: '2026-10-16',
    },
  },
  { id: 'serious-wish', text: '원하는 일을 진지하게', kind: 'original' },
  { id: 'easy-return', text: '다시 시작하기 쉽게', kind: 'original' },
  { id: 'small-evidence', text: '작은 행동이 자신감의 재료로', kind: 'original' },
  { id: 'today-size', text: '오늘 가능한 만큼부터', kind: 'original' },
  { id: 'pause-return', text: '쉬어가도 괜찮아요', kind: 'original' },
  {
    id: 'keller-optimism',
    text: '낙관은 성취로 이끄는 믿음이다',
    kind: 'quote',
    author: '헬렌 켈러',
    source: {
      title: 'Optimism, 1903',
      locator: 'American Foundation for the Blind 인용 목록',
      url: 'https://www.afb.org/about-afb/history/helen-keller/quotes/helen-keller-quotes-optimism',
      originalExcerpt: 'Optimism is the faith that leads to achievement',
      checkedOn: '2026-10-16',
    },
  },
  { id: 'dream-action', text: '큰 꿈도 작은 행동으로', kind: 'original' },
  { id: 'routine-cue', text: '시작하기 쉬운 환경을', kind: 'original' },
  { id: 'one-record', text: '오늘의 한 번을 기록해요', kind: 'original' },
  { id: 'own-pace', text: '내 속도로 이어가도 돼요', kind: 'original' },
  { id: 'return-counts', text: '조금씩 돌아오면 돼요', kind: 'original' },
  { id: 'quiet-dream', text: '내 꿈을 소중하게', kind: 'original' },
  { id: 'one-step', text: '원하는 방향으로 한 걸음씩', kind: 'original' },
];
