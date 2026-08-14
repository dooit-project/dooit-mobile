import {
  buildTaskTemplateSettingsRequest,
  getTaskTemplateSettingsValues,
} from '@/features/tasks/task-template-settings';
import type { TaskTemplateResponse } from '@/types';

const baseValues = {
  type: 'SCHEDULE' as const,
  allDay: false,
  defaultStartTime: '09:30',
  defaultDurationMinutes: '60',
  recurrenceFrequency: 'NONE' as const,
  recurrenceInterval: '1',
  recurrenceByDays: [],
};

describe('Task 템플릿 일정·반복 설정', () => {
  test('시간 일정 설정을 API 요청 형식으로 바꾼다', () => {
    expect(buildTaskTemplateSettingsRequest(baseValues)).toEqual({
      ok: true,
      request: {
        type: 'SCHEDULE',
        allDay: false,
        defaultStartTime: '09:30:00',
        defaultDurationMinutes: 60,
        recurrenceFrequency: null,
        recurrenceInterval: null,
        recurrenceByDays: null,
      },
    });
  });

  test('종일 설정에서는 시간과 소요 시간을 제거한다', () => {
    expect(
      buildTaskTemplateSettingsRequest({
        ...baseValues,
        allDay: true,
        defaultStartTime: '',
      }),
    ).toMatchObject({
      ok: true,
      request: { allDay: true, defaultStartTime: null, defaultDurationMinutes: null },
    });
  });

  test('매주 반복 요일과 간격을 보존한다', () => {
    expect(
      buildTaskTemplateSettingsRequest({
        ...baseValues,
        recurrenceFrequency: 'WEEKLY',
        recurrenceInterval: '2',
        recurrenceByDays: ['MO', 'FR'],
      }),
    ).toMatchObject({
      ok: true,
      request: {
        recurrenceFrequency: 'WEEKLY',
        recurrenceInterval: 2,
        recurrenceByDays: ['MO', 'FR'],
      },
    });
  });

  test.each([
    [{ ...baseValues, defaultStartTime: '25:00' }, '시작 시간을'],
    [{ ...baseValues, defaultDurationMinutes: '0' }, '소요 시간은'],
    [
      { ...baseValues, recurrenceFrequency: 'WEEKLY' as const, recurrenceByDays: [] },
      '요일을 하나 이상',
    ],
  ])('잘못된 조합을 거부한다', (values, message) => {
    expect(buildTaskTemplateSettingsRequest(values)).toEqual({
      ok: false,
      message: expect.stringContaining(message),
    });
  });

  test('응답의 초 단위 시간을 폼 값으로 정리한다', () => {
    const template: TaskTemplateResponse = {
      id: 1,
      title: '주간 회고',
      description: null,
      type: 'SCHEDULE',
      category: null,
      allDay: false,
      defaultStartTime: '18:30:00',
      defaultDurationMinutes: 45,
      recurrenceFrequency: 'WEEKLY',
      recurrenceInterval: 1,
      recurrenceByDays: ['FR'],
      createdAt: '2026-08-14T09:00:00',
      updatedAt: null,
    };

    expect(getTaskTemplateSettingsValues(template)).toMatchObject({
      defaultStartTime: '18:30',
      defaultDurationMinutes: '45',
      recurrenceFrequency: 'WEEKLY',
      recurrenceByDays: ['FR'],
    });
  });
});
