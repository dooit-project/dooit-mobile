import { useMutation, useQueryClient } from '@tanstack/react-query';

import { requestTaskNotificationSync } from '@/features/notifications';
import { dailyPlanQueryKeys } from '@/features/daily-plan';
import type { LocalDateString, TaskResponse } from '@/types';

import { taskApi } from './task-api';
import { taskQueryKeys } from './task-query-keys';

type ChangeTaskDateVariables = {
  taskId: number;
  targetDate: LocalDateString | null;
};

export function useChangeTaskDate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, targetDate }: ChangeTaskDateVariables) =>
      targetDate ? taskApi.moveToToday(taskId, targetDate) : taskApi.moveToInbox(taskId),
    onSuccess: (updatedTask) => {
      queryClient.setQueryData<TaskResponse>(taskQueryKeys.detail(updatedTask.id), updatedTask);
      void queryClient.invalidateQueries({ queryKey: taskQueryKeys.all });
      void queryClient.invalidateQueries({ queryKey: dailyPlanQueryKeys.all });
      requestTaskNotificationSync();
    },
  });
}
