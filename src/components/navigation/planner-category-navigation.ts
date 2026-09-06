import type { TaskCategorySummaryResponse } from '@/types';

export type PlannerCategoryValue = 'ALL' | string | null;

export type PlannerCategoryNavigationItem = {
  category: PlannerCategoryValue;
  count: number;
  disabled: boolean;
  key: string;
  label: string;
};

export function getPlannerCategoryNavigationItems(
  summaries: TaskCategorySummaryResponse[],
): PlannerCategoryNavigationItem[] {
  const totalCount = summaries.reduce((sum, item) => sum + item.taskCount, 0);

  return [
    {
      category: 'ALL',
      count: totalCount,
      disabled: false,
      key: 'all',
      label: '전체',
    },
    ...summaries.map((summary) => ({
      category: summary.category,
      count: summary.taskCount,
      disabled: summary.category === null,
      key: summary.category ?? 'uncategorized',
      label: summary.displayName,
    })),
  ];
}
