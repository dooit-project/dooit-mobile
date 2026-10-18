import { useMutation, useQueryClient } from '@tanstack/react-query';

import { requestTaskNotificationSync } from '@/features/notifications';
import { dailyPlanQueryKeys } from '@/features/daily-plan';
import type { LocalDateString, TaskRecommendationResponse, TaskResponse } from '@/types';
import { isLocalDateString, toApiLocalDate } from '@/utils';

import { moveTaskToDate } from './move-task-to-date';
import { taskQueryKeys } from './task-query-keys';

export function useMoveTaskToToday(date?: LocalDateString) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: number) => moveTaskToDate(taskId, date ?? toApiLocalDate()),
    onSuccess: (movedTask) => {
      queryClient.setQueryData<TaskResponse>(taskQueryKeys.detail(movedTask.id), movedTask);
      queryClient.setQueryData<TaskResponse[]>(taskQueryKeys.inbox(), (tasks = []) =>
        tasks.filter((task) => task.id !== movedTask.id),
      );
      queryClient.setQueryData<TaskResponse[]>(taskQueryKeys.stale(), (tasks = []) =>
        tasks.filter((task) => task.id !== movedTask.id),
      );
      const savedDate = movedTask.plannedDate;
      if (savedDate && isLocalDateString(savedDate)) {
        queryClient.setQueryData<TaskRecommendationResponse[]>(
          taskQueryKeys.todayRecommendations(savedDate),
          (recommendations = []) =>
            recommendations.filter((recommendation) => recommendation.task.id !== movedTask.id),
        );
        queryClient.setQueryData<TaskResponse[]>(taskQueryKeys.today(savedDate), (tasks = []) => [
          ...tasks.filter((task) => task.id !== movedTask.id),
          movedTask,
        ]);
      } else {
        void queryClient.invalidateQueries({ queryKey: taskQueryKeys.all });
      }
      void queryClient.invalidateQueries({ queryKey: taskQueryKeys.categories() });
      void queryClient.invalidateQueries({ queryKey: dailyPlanQueryKeys.all });
      requestTaskNotificationSync();
    },
  });
}
