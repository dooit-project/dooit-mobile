import { createNotificationSyncRunner } from '../notification-sync-provider';

describe('notification sync runner', () => {
  it('겹친 활성화 요청은 진행 중인 동기화를 공유한다', async () => {
    let resolveSync: (() => void) | undefined;
    const sync = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSync = resolve;
        }),
    );
    const runSync = createNotificationSyncRunner(sync);

    const first = runSync();
    const second = runSync();

    expect(first).toBe(second);
    expect(sync).toHaveBeenCalledTimes(1);

    resolveSync?.();
    await first;
  });

  it('실패를 앱 흐름으로 전파하지 않고 다음 동기화를 허용한다', async () => {
    const sync = jest
      .fn<Promise<void>, []>()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(undefined);
    const runSync = createNotificationSyncRunner(sync);

    await expect(runSync()).resolves.toBeUndefined();
    await expect(runSync()).resolves.toBeUndefined();
    expect(sync).toHaveBeenCalledTimes(2);
  });
});
