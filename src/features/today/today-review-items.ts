import type { TaskRecommendationResponse, TaskResponse } from '@/types';

type TodayReviewItems = {
  recommendations: TaskRecommendationResponse[];
  inboxTasks: TaskResponse[];
};

export function separateTodayReviewItems(
  recommendations: TaskRecommendationResponse[],
  inboxTasks: TaskResponse[],
): TodayReviewItems {
  const recommendationTaskIds = new Set(
    recommendations.map((recommendation) => recommendation.task.id),
  );

  return {
    recommendations,
    inboxTasks: inboxTasks.filter((task) => !recommendationTaskIds.has(task.id)),
  };
}

export function getLatestInboxTask(inboxTasks: TaskResponse[]) {
  return [...inboxTasks].sort((left, right) => {
    const createdAtComparison = right.createdAt.localeCompare(left.createdAt);
    return createdAtComparison === 0 ? right.id - left.id : createdAtComparison;
  })[0];
}
