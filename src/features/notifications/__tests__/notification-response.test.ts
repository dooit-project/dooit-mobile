import {
  configureTaskNotificationResponses,
  getTaskIdFromNotificationData,
} from '../notification-response';

function response(identifier: string, taskId: unknown) {
  return {
    notification: {
      request: {
        identifier,
        content: { data: { taskId } },
      },
    },
  };
}

describe('notification response', () => {
  it.each([
    [{ taskId: 12 }, 12],
    [{ taskId: '34' }, 34],
    [{ taskId: 0 }, null],
    [{ taskId: 'not-a-number' }, null],
    [{}, null],
    [null, null],
  ])('Task ID를 안전하게 해석한다', (data, expected) => {
    expect(getTaskIdFromNotificationData(data)).toBe(expected);
  });

  it('실행 중 응답과 cold start 마지막 응답을 열고 같은 알림은 중복 처리하지 않는다', async () => {
    const onOpenTask = jest.fn();
    const setHandler = jest.fn();
    const remove = jest.fn();
    const clearLastResponse = jest.fn();
    let listener: ((value: ReturnType<typeof response>) => void) | undefined;
    const lastResponse = response('task:1', 1);

    const cleanup = await configureTaskNotificationResponses(onOpenTask, {
      setHandler,
      addResponseListener: (nextListener) => {
        listener = nextListener;
        listener(lastResponse);
        return { remove };
      },
      getLastResponse: jest.fn().mockResolvedValue(lastResponse),
      clearLastResponse,
    });

    listener?.(response('task:2', '2'));
    listener?.(response('invalid', 'nope'));

    expect(onOpenTask).toHaveBeenNthCalledWith(1, 1);
    expect(onOpenTask).toHaveBeenNthCalledWith(2, 2);
    expect(onOpenTask).toHaveBeenCalledTimes(2);
    expect(clearLastResponse).toHaveBeenCalledTimes(1);

    cleanup();
    expect(remove).toHaveBeenCalledTimes(1);
    expect(setHandler).toHaveBeenLastCalledWith(null);
  });
});
