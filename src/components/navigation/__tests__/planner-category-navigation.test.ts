import type { TaskCategorySummaryResponse } from '@/types';

import { getPlannerCategoryNavigationItems } from '../planner-category-navigation';

const summaries: TaskCategorySummaryResponse[] = [
  {
    category: '개인',
    displayName: '개인',
    taskCount: 4,
    inboxCount: 1,
    todayCount: 2,
    doneCount: 1,
  },
  {
    category: '업무',
    displayName: '업무',
    taskCount: 5,
    inboxCount: 2,
    todayCount: 2,
    doneCount: 1,
  },
  {
    category: null,
    displayName: '미분류',
    taskCount: 3,
    inboxCount: 2,
    todayCount: 1,
    doneCount: 0,
  },
];

describe('플래너 카테고리 탐색 항목', () => {
  it('전체 개수를 합산하고 서버 순서를 유지한다', () => {
    expect(getPlannerCategoryNavigationItems(summaries)).toEqual([
      { category: 'ALL', count: 12, disabled: false, key: 'all', label: '전체' },
      { category: '개인', count: 4, disabled: false, key: '개인', label: '개인' },
      { category: '업무', count: 5, disabled: false, key: '업무', label: '업무' },
      { category: null, count: 3, disabled: true, key: 'uncategorized', label: '미분류' },
    ]);
  });

  it('카테고리가 없어도 전체 진입점을 유지한다', () => {
    expect(getPlannerCategoryNavigationItems([])).toEqual([
      { category: 'ALL', count: 0, disabled: false, key: 'all', label: '전체' },
    ]);
  });
});
