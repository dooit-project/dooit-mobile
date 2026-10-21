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
  /** Longer originals remain available with their sources in settings. */
  headerEligible?: boolean;
} & ({ kind: 'original' } | { kind: 'quote'; author: string; source: QuoteSource });

export const motivationalLines: readonly MotivationalLine[] = [
  {
    id: 'franklin-well-done',
    text: 'Well done is better than well said.',
    kind: 'quote',
    author: 'Benjamin Franklin',
    source: {
      title: 'Proverbs from Poor Richard’s Almanac',
      locator: 'Franklin’s Autobiography, Proverbs section, p. 201',
      url: 'https://www.gutenberg.org/files/36151/36151-h/36151-h.htm',
      originalExcerpt: 'Well done is better than well said.',
      checkedOn: '2026-10-20',
    },
  },
  { id: 'small-start', text: '작게 시작해도 괜찮아요', kind: 'original' },
  { id: 'serious-wish', text: '원하는 일을 진지하게', kind: 'original' },
  { id: 'easy-return', text: 'Make it easy to return.', kind: 'original' },
  { id: 'small-evidence', text: '작은 행동이 자신감의 재료로', kind: 'original' },
  { id: 'today-size', text: 'A little is a beginning.', kind: 'original' },
  {
    id: 'emerson-self-trust',
    text: 'Trust thyself.',
    kind: 'quote',
    author: 'Ralph Waldo Emerson',
    source: {
      title: 'Essays — Self-Reliance',
      locator: 'Self-Reliance, paragraph beginning “Trust thyself” (excerpt)',
      url: 'https://www.gutenberg.org/files/16643/16643-h/16643-h.htm',
      originalExcerpt: 'Trust thyself:',
      checkedOn: '2026-10-20',
    },
  },
  { id: 'pause-return', text: 'Rest. Then return.', kind: 'original' },
  {
    id: 'keller-optimism',
    text: 'Optimism is the faith that leads to achievement.',
    headerEligible: false,
    kind: 'quote',
    author: '헬렌 켈러',
    source: {
      title: 'Optimism, 1903',
      locator: 'American Foundation for the Blind 인용 목록',
      url: 'https://www.afb.org/about-afb/history/helen-keller/quotes/helen-keller-quotes-optimism',
      originalExcerpt: 'Optimism is the faith that leads to achievement',
      checkedOn: '2026-10-20',
    },
  },
  { id: 'dream-action', text: '큰 꿈도 작은 행동으로', kind: 'original' },
  { id: 'routine-cue', text: 'Build a rhythm you can keep.', kind: 'original' },
  { id: 'one-record', text: '오늘의 한 번을 기록해요', kind: 'original' },
  { id: 'own-pace', text: 'One step, your pace.', kind: 'original' },
  { id: 'return-counts', text: '조금씩 돌아오면 돼요', kind: 'original' },
  {
    id: 'emerson-enthusiasm',
    text: 'Nothing great was ever achieved without enthusiasm.',
    headerEligible: false,
    kind: 'quote',
    author: 'Ralph Waldo Emerson',
    source: {
      title: 'Essays — Circles',
      locator: 'Circles, final paragraph',
      url: 'https://www.gutenberg.org/files/16643/16643-h/16643-h.htm',
      originalExcerpt: 'Nothing great was ever achieved without enthusiasm.',
      checkedOn: '2026-10-20',
    },
  },
  { id: 'quiet-dream', text: 'Make room for your dream.', kind: 'original' },
  { id: 'one-step', text: '원하는 방향으로 한 걸음씩', kind: 'original' },
];

export const headerMotivationalLines = motivationalLines.filter(
  (line) => line.headerEligible !== false,
);
