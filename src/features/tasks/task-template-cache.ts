import type { TaskTemplateResponse } from '@/types';

export function upsertTaskTemplate(
  templates: TaskTemplateResponse[] | undefined,
  template: TaskTemplateResponse,
) {
  const current = templates ?? [];
  const existingIndex = current.findIndex((item) => item.id === template.id);

  if (existingIndex < 0) {
    return [...current, template];
  }

  return current.map((item) => (item.id === template.id ? template : item));
}

export function removeTaskTemplate(
  templates: TaskTemplateResponse[] | undefined,
  templateId: number,
) {
  return (templates ?? []).filter((template) => template.id !== templateId);
}
