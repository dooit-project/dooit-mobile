import { bootstrapAuthSession, createGuestSession } from '../auth-token-bootstrap';

const guestUser = {
  id: 10,
  accountType: 'GUEST' as const,
  email: null,
  displayName: null,
  role: 'USER' as const,
  timeZone: 'Asia/Seoul',
  createdAt: '2026-08-09T00:00:00' as const,
  updatedAt: null,
};

describe('bootstrapAuthSession', () => {
  it('저장 token이 없으면 게스트를 자동 생성하지 않고 최초 사용 선택을 반환한다', async () => {
    const cacheUser = jest.fn();
    const getCurrentUser = jest.fn();

    await expect(
      bootstrapAuthSession({
        initializeToken: jest.fn().mockResolvedValue(null),
        getCurrentUser,
        cacheUser,
      }),
    ).resolves.toBe('first-use');

    expect(getCurrentUser).not.toHaveBeenCalled();
    expect(cacheUser).not.toHaveBeenCalled();
  });

  it('저장 token이 있으면 현재 사용자를 확인하고 게스트를 만들지 않는다', async () => {
    const cacheUser = jest.fn();
    const registeredUser = {
      ...guestUser,
      accountType: 'REGISTERED' as const,
      email: 'user@example.com',
      displayName: 'User',
    };
    const getCurrentUser = jest.fn().mockResolvedValue(registeredUser);

    await bootstrapAuthSession({
      initializeToken: jest.fn().mockResolvedValue('stored-token'),
      getCurrentUser,
      cacheUser,
    });

    expect(getCurrentUser).toHaveBeenCalledTimes(1);
    expect(cacheUser).toHaveBeenCalledWith(registeredUser);
  });

  it('저장된 게스트 token으로 같은 게스트 사용자 정보를 복원한다', async () => {
    const cacheUser = jest.fn();
    const getCurrentUser = jest.fn().mockResolvedValue(guestUser);

    await bootstrapAuthSession({
      initializeToken: jest.fn().mockResolvedValue('stored-guest-token'),
      getCurrentUser,
      cacheUser,
    });

    expect(cacheUser).toHaveBeenCalledWith(guestUser);
  });

  it('저장 token 확인 실패 시 새 게스트를 만들지 않고 오류를 전달한다', async () => {
    const error = new Error('stored session check failed');
    const cacheUser = jest.fn();

    await expect(
      bootstrapAuthSession({
        initializeToken: jest.fn().mockResolvedValue('stored-guest-token'),
        getCurrentUser: jest.fn().mockRejectedValue(error),
        cacheUser,
      }),
    ).rejects.toBe(error);

    expect(cacheUser).not.toHaveBeenCalled();
  });
});

describe('createGuestSession', () => {
  it('사용자가 선택하면 게스트를 생성하고 사용자와 온보딩 완료 상태를 저장한다', async () => {
    const cacheUser = jest.fn();
    const completeFirstUse = jest.fn().mockResolvedValue(undefined);

    await expect(
      createGuestSession({
        createGuest: jest.fn().mockResolvedValue({ user: guestUser }),
        cacheUser,
        completeFirstUse,
      }),
    ).resolves.toBe(guestUser);

    expect(cacheUser).toHaveBeenCalledWith(guestUser);
    expect(completeFirstUse).toHaveBeenCalledTimes(1);
  });

  it('게스트 생성 실패를 호출자에게 전달하고 cache와 완료 상태를 변경하지 않는다', async () => {
    const error = new Error('network error');
    const cacheUser = jest.fn();
    const completeFirstUse = jest.fn();

    await expect(
      createGuestSession({
        createGuest: jest.fn().mockRejectedValue(error),
        cacheUser,
        completeFirstUse,
      }),
    ).rejects.toBe(error);
    expect(cacheUser).not.toHaveBeenCalled();
    expect(completeFirstUse).not.toHaveBeenCalled();
  });
});
