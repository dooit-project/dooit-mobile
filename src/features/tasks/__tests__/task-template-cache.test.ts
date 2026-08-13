import { removeTaskTemplate, upsertTaskTemplate } from '@/features/tasks/task-template-cache';
import type { TaskTemplateResponse } from '@/types';

const template = (id: number, title: string): TaskTemplateResponse => ({
  id,
  title,
  description: null,
  type: 'TODO',
  category: null,
  allDay: false,
  defaultStartTime: null,
  defaultDurationMinutes: null,
  recurrenceFrequency: null,
  recurrenceInterval: 1,
  recurrenceByDays: [],
  createdAt: '2026-08-13T09:00:00',
  updatedAt: null,
});

describe('Task 템플릿 캐시', () => {
  test('새 템플릿을 목록 끝에 추가한다', () => {
    expect(upsertTaskTemplate([template(1, '아침 정리')], template(2, '주간 회고'))).toEqual([
      template(1, '아침 정리'),
      template(2, '주간 회고'),
    ]);
  });

  test('수정한 템플릿을 기존 순서를 유지해 교체한다', () => {
    expect(
      upsertTaskTemplate(
        [template(1, '아침 정리'), template(2, '주간 회고')],
        template(1, '아침 계획'),
      ),
    ).toEqual([template(1, '아침 계획'), template(2, '주간 회고')]);
  });

  test('삭제한 템플릿만 목록에서 제거한다', () => {
    expect(removeTaskTemplate([template(1, '아침 정리'), template(2, '주간 회고')], 1)).toEqual([
      template(2, '주간 회고'),
    ]);
  });
});
