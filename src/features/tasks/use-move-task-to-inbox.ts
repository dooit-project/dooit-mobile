import { useMutation, useQueryClient } from '@tanstack/react-query';

import { requestTaskNotificationSync } from '@/features/notifications';
import { dailyPlanQueryKeys } from '@/features/daily-plan';
import type { TaskResponse } from '@/types';

import { taskApi } from './task-api';
import { taskQueryKeys } from './task-query-keys';

export function useMoveTaskToInbox() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: number) => taskApi.moveToInbox(taskId),
    onSuccess: (movedTask) => {
      queryClient.setQueryData<TaskResponse[]>(taskQueryKeys.stale(), (tasks = []) =>
        tasks.filter((task) => task.id !== movedTask.id),
      );
      queryClient.setQueryData<TaskResponse[]>(taskQueryKeys.inbox(), (tasks = []) => [
        movedTask,
        ...tasks.filter((task) => task.id !== movedTask.id),
      ]);
      void queryClient.invalidateQueries({ queryKey: taskQueryKeys.categories() });
      void queryClient.invalidateQueries({ queryKey: dailyPlanQueryKeys.all });
      requestTaskNotificationSync();
    },
  });
}
