import { bootstrapAuthSession } from '../auth-token-bootstrap';

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
  it('저장 token이 없으면 게스트를 생성하고 사용자 정보를 cache한다', async () => {
    const cacheUser = jest.fn();
    const createGuest = jest.fn().mockResolvedValue({ user: guestUser });
    const getCurrentUser = jest.fn();

    await bootstrapAuthSession({
      initializeToken: jest.fn().mockResolvedValue(null),
      createGuest,
      getCurrentUser,
      cacheUser,
    });

    expect(createGuest).toHaveBeenCalledTimes(1);
    expect(getCurrentUser).not.toHaveBeenCalled();
    expect(cacheUser).toHaveBeenCalledWith(guestUser);
  });

  it('저장 token이 있으면 현재 사용자를 확인하고 게스트를 만들지 않는다', async () => {
    const cacheUser = jest.fn();
    const registeredUser = {
      ...guestUser,
      accountType: 'REGISTERED' as const,
      email: 'user@example.com',
      displayName: 'User',
    };
    const createGuest = jest.fn();
    const getCurrentUser = jest.fn().mockResolvedValue(registeredUser);

    await bootstrapAuthSession({
      initializeToken: jest.fn().mockResolvedValue('stored-token'),
      createGuest,
      getCurrentUser,
      cacheUser,
    });

    expect(createGuest).not.toHaveBeenCalled();
    expect(getCurrentUser).toHaveBeenCalledTimes(1);
    expect(cacheUser).toHaveBeenCalledWith(registeredUser);
  });

  it('게스트 생성 실패를 호출자에게 전달하고 cache를 변경하지 않는다', async () => {
    const error = new Error('network error');
    const cacheUser = jest.fn();

    await expect(
      bootstrapAuthSession({
        initializeToken: jest.fn().mockResolvedValue(null),
        createGuest: jest.fn().mockRejectedValue(error),
        getCurrentUser: jest.fn(),
        cacheUser,
      }),
    ).rejects.toBe(error);
    expect(cacheUser).not.toHaveBeenCalled();
  });
});
