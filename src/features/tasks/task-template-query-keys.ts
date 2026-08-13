export const taskTemplateQueryKeys = {
  all: ['task-templates'] as const,
  list: () => [...taskTemplateQueryKeys.all, 'list'] as const,
  detail: (templateId: number) => [...taskTemplateQueryKeys.all, 'detail', templateId] as const,
};
