import { getTodayReviewFocusPresentation, parseTodayReviewFocus } from '../today-review-focus';

describe('today review focus', () => {
  test('기록함과 지난 미완료 focus만 허용한다', () => {
    expect(parseTodayReviewFocus('inbox')).toBe('inbox');
    expect(parseTodayReviewFocus(['stale'])).toBe('stale');
    expect(parseTodayReviewFocus('recommendation')).toBeNull();
    expect(parseTodayReviewFocus()).toBeNull();
  });

  test('기록함 직접 진입 문구를 제공한다', () => {
    expect(getTodayReviewFocusPresentation('inbox')).toEqual({
      title: '기록함',
      description: '날짜를 정하지 않은 기록을 확인하고 오늘 할 일로 옮겨요.',
      emptyTitle: '기록함이 비어 있어요',
      emptyDescription: '생각난 일을 날짜 없이 기록하면 이곳에서 다시 볼 수 있어요.',
    });
  });
});
