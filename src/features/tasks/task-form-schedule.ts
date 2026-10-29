import type { LocalDateTimeString } from '@/types';
import { isLocalDateString, shiftLocalDate } from '@/utils';

const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

export type ScheduleFormInput = {
  allDay: boolean;
  date: string;
  endTime: string;
  startTime: string;
  /** Existing multi-day schedules retain their day span in focused editing. */
  endDayOffset?: number;
};

export type ScheduleFormResult =
  | {
      ok: true;
      allDay: boolean;
      endAt: LocalDateTimeString | null;
      startAt: LocalDateTimeString;
    }
  | {
      ok: false;
      field: 'date' | 'startTime' | 'endTime';
      message: string;
    };

export function normalizeScheduleFormInput(input: ScheduleFormInput): ScheduleFormResult {
  const date = input.date.trim();

  if (!isLocalDateString(date)) {
    return {
      ok: false,
      field: 'date',
      message: /^\d{4}-\d{2}-\d{2}$/.test(date)
        ? '존재하지 않는 날짜예요. 일정 날짜를 다시 확인해 주세요.'
        : '일정 날짜를 YYYY-MM-DD 형식으로 입력해 주세요.',
    };
  }

  if (input.allDay) {
    const nextDate = shiftLocalDate(date, Math.max(1, input.endDayOffset ?? 1));

    if (!nextDate) {
      return { ok: false, field: 'date', message: '일정 날짜를 다시 확인해 주세요.' };
    }

    return {
      ok: true,
      allDay: true,
      startAt: `${date}T00:00:00`,
      endAt: `${nextDate}T00:00:00`,
    };
  }

  const startTime = input.startTime.trim();
  const endTime = input.endTime.trim();

  if (!timePattern.test(startTime)) {
    return { ok: false, field: 'startTime', message: '시작 시간을 HH:mm 형식으로 입력해 주세요.' };
  }

  if (endTime && !timePattern.test(endTime)) {
    return { ok: false, field: 'endTime', message: '종료 시간을 HH:mm 형식으로 입력해 주세요.' };
  }

  if (endTime && !input.endDayOffset && endTime <= startTime) {
    return { ok: false, field: 'endTime', message: '종료 시간은 시작 시간 이후여야 합니다.' };
  }

  const endDate = shiftLocalDate(date, input.endDayOffset ?? 0);
  if (endTime && !endDate) {
    return { ok: false, field: 'date', message: '일정 날짜를 다시 확인해 주세요.' };
  }

  return {
    ok: true,
    allDay: false,
    startAt: `${date}T${startTime}:00`,
    endAt: endTime ? `${endDate}T${endTime}:00` : null,
  };
}
