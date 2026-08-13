import { useMutation, useQueryClient } from '@tanstack/react-query';

import type {
  TaskTemplateCreateTaskRequest,
  TaskTemplateRequest,
  TaskTemplateResponse,
} from '@/types';

import { taskQueryKeys } from './task-query-keys';
import { removeTaskTemplate, upsertTaskTemplate } from './task-template-cache';
import { taskTemplateApi } from './task-template-api';
import { taskTemplateQueryKeys } from './task-template-query-keys';

export function useCreateTaskTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: TaskTemplateRequest) => taskTemplateApi.create(request),
    onSuccess: (template) => {
      queryClient.setQueryData<TaskTemplateResponse[]>(taskTemplateQueryKeys.list(), (current) =>
        upsertTaskTemplate(current, template),
      );
      queryClient.setQueryData(taskTemplateQueryKeys.detail(template.id), template);
    },
  });
}

export function useUpdateTaskTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ templateId, request }: { templateId: number; request: TaskTemplateRequest }) =>
      taskTemplateApi.update(templateId, request),
    onSuccess: (template) => {
      queryClient.setQueryData<TaskTemplateResponse[]>(taskTemplateQueryKeys.list(), (current) =>
        upsertTaskTemplate(current, template),
      );
      queryClient.setQueryData(taskTemplateQueryKeys.detail(template.id), template);
    },
  });
}

export function useDeleteTaskTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (templateId: number) => taskTemplateApi.delete(templateId),
    onSuccess: (_, templateId) => {
      queryClient.setQueryData<TaskTemplateResponse[]>(taskTemplateQueryKeys.list(), (current) =>
        removeTaskTemplate(current, templateId),
      );
      queryClient.removeQueries({ queryKey: taskTemplateQueryKeys.detail(templateId) });
    },
  });
}

export function useCreateTaskFromTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      templateId,
      request,
    }: {
      templateId: number;
      request: TaskTemplateCreateTaskRequest;
    }) => taskTemplateApi.createTask(templateId, request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: taskQueryKeys.all }),
  });
}
