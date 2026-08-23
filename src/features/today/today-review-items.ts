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
