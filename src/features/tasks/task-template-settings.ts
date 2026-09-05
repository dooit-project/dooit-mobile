import type {
  RecurrenceFrequency,
  TaskTemplateRequest,
  TaskTemplateResponse,
  TaskType,
} from '@/types';

export const templateWeekdays = [
  { code: 'MO', label: '월' },
  { code: 'TU', label: '화' },
  { code: 'WE', label: '수' },
  { code: 'TH', label: '목' },
  { code: 'FR', label: '금' },
  { code: 'SA', label: '토' },
  { code: 'SU', label: '일' },
] as const;

export type TaskTemplateRecurrenceMode = RecurrenceFrequency | 'NONE';

export type TaskTemplateSettingsValues = {
  type: TaskType;
  allDay: boolean;
  defaultStartTime: string;
  defaultDurationMinutes: string;
  recurrenceFrequency: TaskTemplateRecurrenceMode;
  recurrenceInterval: string;
  recurrenceByDays: string[];
};

type TaskTemplateSettingsRequest = Pick<
  TaskTemplateRequest,
  | 'type'
  | 'allDay'
  | 'defaultStartTime'
  | 'defaultDurationMinutes'
  | 'recurrenceFrequency'
  | 'recurrenceInterval'
  | 'recurrenceByDays'
>;

export type TaskTemplateSettingsResult =
  | { ok: true; request: TaskTemplateSettingsRequest }
  | { ok: false; message: string };

const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function getTaskTemplateSettingsValues(
  template: TaskTemplateResponse,
): TaskTemplateSettingsValues {
  return {
    type: template.type,
    allDay: template.allDay,
    defaultStartTime: template.defaultStartTime?.slice(0, 5) ?? '',
    defaultDurationMinutes: template.defaultDurationMinutes
      ? String(template.defaultDurationMinutes)
      : '',
    recurrenceFrequency: template.recurrenceFrequency ?? 'NONE',
    recurrenceInterval: String(template.recurrenceInterval || 1),
    recurrenceByDays: template.recurrenceByDays,
  };
}

export function buildTaskTemplateSettingsRequest(
  values: TaskTemplateSettingsValues,
): TaskTemplateSettingsResult {
  const startTime = values.defaultStartTime.trim();
  const recurrenceFrequency: RecurrenceFrequency | null =
    values.recurrenceFrequency === 'NONE' ? null : values.recurrenceFrequency;
  const hasRecurrence = recurrenceFrequency !== null;

  if (startTime && !timePattern.test(startTime)) {
    return { ok: false, message: '시작 시간을 HH:mm 형식으로 입력해 주세요.' };
  }

  if (values.allDay && startTime) {
    return { ok: false, message: '종일 템플릿에는 시작 시간을 함께 설정할 수 없어요.' };
  }

  if ((values.type === 'SCHEDULE' || hasRecurrence) && !values.allDay && !startTime) {
    return { ok: false, message: '일정 또는 반복 템플릿에는 시작 시간이나 종일 설정이 필요해요.' };
  }

  const durationResult = parseOptionalInteger(values.defaultDurationMinutes, 5, 1440);
  if (!durationResult.ok) {
    return { ok: false, message: '소요 시간은 5분 이상 1440분 이하로 입력해 주세요.' };
  }

  const intervalResult = parseOptionalInteger(values.recurrenceInterval, 1, 99);
  if (hasRecurrence && (!intervalResult.ok || intervalResult.value === null)) {
    return { ok: false, message: '반복 간격은 1 이상 99 이하로 입력해 주세요.' };
  }

  if (values.recurrenceFrequency === 'WEEKLY' && values.recurrenceByDays.length === 0) {
    return { ok: false, message: '매주 반복할 요일을 하나 이상 선택해 주세요.' };
  }

  return {
    ok: true,
    request: {
      type: values.type,
      allDay: values.allDay,
      defaultStartTime: values.allDay || !startTime ? null : `${startTime}:00`,
      defaultDurationMinutes: values.allDay ? null : durationResult.value,
      recurrenceFrequency,
      recurrenceInterval: hasRecurrence ? intervalResult.value : null,
      recurrenceByDays: values.recurrenceFrequency === 'WEEKLY' ? values.recurrenceByDays : null,
    },
  };
}

function parseOptionalInteger(value: string, min: number, max: number) {
  if (!value.trim()) {
    return { ok: true as const, value: null };
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    return { ok: false as const };
  }

  return { ok: true as const, value: parsed };
}
