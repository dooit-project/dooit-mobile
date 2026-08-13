import { apiClient } from '@/services/api';
import type {
  TaskResponse,
  TaskTemplateCreateTaskRequest,
  TaskTemplateRequest,
  TaskTemplateResponse,
} from '@/types';

const TASK_TEMPLATES_PATH = '/api/v1/task-templates';

export const taskTemplateApi = {
  list(signal?: AbortSignal) {
    return apiClient.get<TaskTemplateResponse[]>(TASK_TEMPLATES_PATH, { signal });
  },

  get(templateId: number, signal?: AbortSignal) {
    return apiClient.get<TaskTemplateResponse>(`${TASK_TEMPLATES_PATH}/${templateId}`, { signal });
  },

  create(request: TaskTemplateRequest, signal?: AbortSignal) {
    return apiClient.post<TaskTemplateResponse>(TASK_TEMPLATES_PATH, request, { signal });
  },

  update(templateId: number, request: TaskTemplateRequest, signal?: AbortSignal) {
    return apiClient.put<TaskTemplateResponse>(`${TASK_TEMPLATES_PATH}/${templateId}`, request, {
      signal,
    });
  },

  delete(templateId: number, signal?: AbortSignal) {
    return apiClient.delete<null>(`${TASK_TEMPLATES_PATH}/${templateId}`, { signal });
  },

  createTask(templateId: number, request: TaskTemplateCreateTaskRequest, signal?: AbortSignal) {
    return apiClient.post<TaskResponse>(`${TASK_TEMPLATES_PATH}/${templateId}/tasks`, request, {
      signal,
    });
  },
};
