import {
  buildTaskNotificationFields,
  getInitialTaskNotificationTiming,
} from '../task-notification-timing';

describe('task notification timing', () => {
  it('시작 15분 전 선택을 절대 시각으로 변환한다', () => {
    expect(buildTaskNotificationFields('15', '2026-08-27T09:00:00', false)).toEqual({
      notificationEnabled: true,
      notifyAt: '2026-08-27T08:45:00',
    });
  });

  it('자정을 넘는 미리 알림을 이전 날짜로 계산한다', () => {
    expect(buildTaskNotificationFields('60', '2026-08-27T00:30:00', false)).toEqual({
      notificationEnabled: true,
      notifyAt: '2026-08-26T23:30:00',
    });
  });

  it('알림 끄기와 종일 일정은 notifyAt을 보내지 않는다', () => {
    expect(buildTaskNotificationFields('OFF', '2026-08-27T09:00:00', false)).toEqual({
      notificationEnabled: false,
      notifyAt: null,
    });
    expect(buildTaskNotificationFields('30', '2026-08-27T00:00:00', true)).toEqual({
      notificationEnabled: true,
      notifyAt: null,
    });
  });

  it('저장된 notifyAt 차이로 편집 초기 선택을 복원한다', () => {
    expect(
      getInitialTaskNotificationTiming({
        notificationEnabled: true,
        startAt: '2026-08-27T09:00:00',
        notifyAt: '2026-08-27T08:50:00',
      }),
    ).toBe('10');
    expect(
      getInitialTaskNotificationTiming({
        notificationEnabled: false,
        startAt: '2026-08-27T09:00:00',
        notifyAt: null,
      }),
    ).toBe('OFF');
  });
});
