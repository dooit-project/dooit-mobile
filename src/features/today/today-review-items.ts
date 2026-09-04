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

export function getDailyPlanFocusTasks(tasks: TaskResponse[], focusTaskIds?: number[], limit = 3) {
  const executionTasks = tasks.filter(
    (task) => task.status === 'TODAY' && task.type !== 'SCHEDULE',
  );

  if (focusTaskIds) {
    const tasksById = new Map(executionTasks.map((task) => [task.id, task]));
    return focusTaskIds
      .map((taskId) => tasksById.get(taskId))
      .filter((task): task is TaskResponse => task !== undefined)
      .slice(0, Math.max(0, limit));
  }

  return executionTasks
    .sort(
      (left, right) =>
        (left.todayOrder ?? Number.MAX_SAFE_INTEGER) -
        (right.todayOrder ?? Number.MAX_SAFE_INTEGER),
    )
    .slice(0, Math.max(0, limit));
}

export function getDailyShutdownTasks(tasks: TaskResponse[]) {
  return tasks
    .filter((task) => task.status === 'TODAY' && task.type !== 'SCHEDULE')
    .sort(
      (left, right) =>
        (left.todayOrder ?? Number.MAX_SAFE_INTEGER) -
        (right.todayOrder ?? Number.MAX_SAFE_INTEGER),
    );
}
