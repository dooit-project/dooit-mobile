import { normalizeScheduleFormInput } from '../task-form-schedule';

describe('normalizeScheduleFormInput', () => {
  it('시간이 있는 일정을 API LocalDateTime으로 변환한다', () => {
    expect(
      normalizeScheduleFormInput({
        allDay: false,
        date: '2026-07-27',
        startTime: '14:00',
        endTime: '14:30',
      }),
    ).toEqual({
      ok: true,
      allDay: false,
      startAt: '2026-07-27T14:00:00',
      endAt: '2026-07-27T14:30:00',
    });
  });

  it('종료 시간이 없으면 단일 시작 일정으로 변환한다', () => {
    expect(
      normalizeScheduleFormInput({
        allDay: false,
        date: '2026-07-27',
        startTime: '09:00',
        endTime: '',
      }),
    ).toEqual({
      ok: true,
      allDay: false,
      startAt: '2026-07-27T09:00:00',
      endAt: null,
    });
  });

  it('종일 일정은 다음 날 자정 exclusive 종료로 변환한다', () => {
    expect(
      normalizeScheduleFormInput({
        allDay: true,
        date: '2026-07-27',
        startTime: '',
        endTime: '',
      }),
    ).toEqual({
      ok: true,
      allDay: true,
      startAt: '2026-07-27T00:00:00',
      endAt: '2026-07-28T00:00:00',
    });
  });

  it('종료 시간이 시작 시간보다 빠르면 오류를 반환한다', () => {
    expect(
      normalizeScheduleFormInput({
        allDay: false,
        date: '2026-07-27',
        startTime: '14:00',
        endTime: '13:59',
      }),
    ).toEqual({
      ok: false,
      field: 'endTime',
      message: '종료 시간은 시작 시간 이후여야 합니다.',
    });
  });

  it('형식에 맞지만 존재하지 않는 날짜는 다시 확인하도록 안내한다', () => {
    expect(
      normalizeScheduleFormInput({
        allDay: false,
        date: '2026-02-30',
        startTime: '14:00',
        endTime: '14:30',
      }),
    ).toEqual({
      ok: false,
      field: 'date',
      message: '존재하지 않는 날짜예요. 일정 날짜를 다시 확인해 주세요.',
    });
  });

  it('날짜 형식이 다르면 필요한 형식을 안내한다', () => {
    expect(
      normalizeScheduleFormInput({
        allDay: false,
        date: '2026/10/26',
        startTime: '14:00',
        endTime: '14:30',
      }),
    ).toEqual({
      ok: false,
      field: 'date',
      message: '일정 날짜를 YYYY-MM-DD 형식으로 입력해 주세요.',
    });
  });
});
