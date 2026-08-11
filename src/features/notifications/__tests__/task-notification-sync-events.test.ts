import {
  requestTaskNotificationSync,
  subscribeTaskNotificationSync,
} from '../task-notification-sync-events';

describe('task notification sync events', () => {
  it('구독 중인 provider에 Task 변경 신호를 전달하고 해제 후에는 멈춘다', () => {
    const listener = jest.fn();
    const unsubscribe = subscribeTaskNotificationSync(listener);

    requestTaskNotificationSync();
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    requestTaskNotificationSync();
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
