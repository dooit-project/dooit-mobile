import { useMutation, useQueryClient } from '@tanstack/react-query';

import { requestTaskNotificationSync } from '@/features/notifications';
import type { LocalDateString, TaskRecommendationResponse, TaskResponse } from '@/types';

import { moveTaskToDate } from './move-task-to-date';
import { taskQueryKeys } from './task-query-keys';

export function useMoveTaskToToday(date: LocalDateString) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: number) => moveTaskToDate(taskId, date),
    onSuccess: (movedTask) => {
      queryClient.setQueryData<TaskResponse[]>(taskQueryKeys.inbox(), (tasks = []) =>
        tasks.filter((task) => task.id !== movedTask.id),
      );
      queryClient.setQueryData<TaskResponse[]>(taskQueryKeys.stale(), (tasks = []) =>
        tasks.filter((task) => task.id !== movedTask.id),
      );
      queryClient.setQueryData<TaskRecommendationResponse[]>(
        taskQueryKeys.todayRecommendations(date),
        (recommendations = []) =>
          recommendations.filter((recommendation) => recommendation.task.id !== movedTask.id),
      );
      queryClient.setQueryData<TaskResponse[]>(taskQueryKeys.today(date), (tasks = []) => [
        ...tasks.filter((task) => task.id !== movedTask.id),
        movedTask,
      ]);
      requestTaskNotificationSync();
    },
  });
}
