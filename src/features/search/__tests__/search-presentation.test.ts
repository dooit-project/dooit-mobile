import type { TaskSearchItem } from '@/types';

import { getSearchResultMeta } from '../search-overview';

const item: TaskSearchItem = {
  task: {
    id: 1,
    type: 'SCHEDULE',
    title: '백엔드 계약 확인 미팅',
    description: null,
    startAt: '2026-08-25T14:00:00',
    endAt: '2026-08-25T14:30:00',
    allDay: false,
    unscheduled: false,
    category: '일정',
    status: 'TODAY',
    plannedDate: null,
    targetDate: null,
    todayOrder: null,
    completedAt: null,
    carryOverCount: 0,
    staleCarryOver: false,
    deferReason: null,
    deferReasonLabel: null,
    ddayGoalId: null,
    ddayGoalTitle: null,
    ddayGoalTargetDate: null,
    ddayDaysLeft: null,
    createdAt: '2026-08-25T09:00:00',
    updatedAt: null,
  },
  relevantDate: '2026-08-25',
  dateSource: 'START_AT',
};

describe('검색 결과 표시', () => {
  it('날짜 출처·유형·카테고리의 같은 라벨을 한 번만 표시한다', () => {
    expect(getSearchResultMeta(item)).toBe('일정 · 8월 25일 (화)');
  });

  it('서로 다른 유형과 카테고리는 유지한다', () => {
    expect(
      getSearchResultMeta({
        ...item,
        task: { ...item.task, type: 'TODO', category: 'API' },
        dateSource: 'TARGET_DATE',
      }),
    ).toBe('목표일 · 8월 25일 (화) · Task · API');
  });
});
