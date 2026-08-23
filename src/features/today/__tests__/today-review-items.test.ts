import type { TaskRecommendationResponse, TaskResponse } from '@/types';

import { separateTodayReviewItems } from '../today-review-items';

function createInboxTask(id: number): TaskResponse {
  return {
    id,
    type: 'TODO',
    title: `Task ${id}`,
    description: null,
    startAt: null,
    endAt: null,
    allDay: false,
    unscheduled: true,
    category: null,
    status: 'INBOX',
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
    createdAt: '2026-08-23T12:00:00',
    updatedAt: null,
  };
}

describe('separateTodayReviewItems', () => {
  it('추천과 기록함에 같은 Task가 있으면 추천에만 남긴다', () => {
    const recommendedTask = createInboxTask(1);
    const inboxOnlyTask = createInboxTask(2);
    const recommendations: TaskRecommendationResponse[] = [
      { task: recommendedTask, reason: '오늘 처리하기 좋아요.' },
    ];

    expect(separateTodayReviewItems(recommendations, [recommendedTask, inboxOnlyTask])).toEqual({
      recommendations,
      inboxTasks: [inboxOnlyTask],
    });
  });

  it('겹치는 Task가 없으면 원래 목록을 유지한다', () => {
    const recommendation: TaskRecommendationResponse = {
      task: createInboxTask(1),
      reason: '오늘 처리하기 좋아요.',
    };
    const inboxTask = createInboxTask(2);

    expect(separateTodayReviewItems([recommendation], [inboxTask])).toEqual({
      recommendations: [recommendation],
      inboxTasks: [inboxTask],
    });
  });
});
