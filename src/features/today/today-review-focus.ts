export type TodayReviewFocus = 'inbox' | 'stale';

export function parseTodayReviewFocus(value?: string | string[]): TodayReviewFocus | null {
  const candidate = Array.isArray(value) ? value[0] : value;

  return candidate === 'inbox' || candidate === 'stale' ? candidate : null;
}

export function getTodayReviewFocusPresentation(focus: TodayReviewFocus | null) {
  if (focus === 'inbox') {
    return {
      title: '기록함',
      description: '날짜를 정하지 않은 기록을 확인하고 오늘 할 일로 옮겨요.',
      emptyTitle: '기록함이 비어 있어요',
      emptyDescription: '생각난 일을 날짜 없이 기록하면 이곳에서 다시 볼 수 있어요.',
    };
  }

  if (focus === 'stale') {
    return {
      title: '오래 미룬 일',
      description: '지난 미완료를 확인하고 오늘 다시 할지 결정해요.',
      emptyTitle: '미뤄진 일이 없어요',
      emptyDescription: '지금 다시 판단할 지난 미완료 항목이 없어요.',
    };
  }

  return {
    title: '오늘 계획',
    description: '오늘 할 수 있는 만큼 고르고, 먼저 할 일을 확인해요.',
    emptyTitle: '정리가 끝났어요',
    emptyDescription: '지금 다시 판단할 항목이 없어요.',
  };
}
