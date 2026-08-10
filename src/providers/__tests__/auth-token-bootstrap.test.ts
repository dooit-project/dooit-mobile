import {
  bootstrapAuthSession,
  createGuestSession,
  refreshActiveGuestSession,
  shouldRefreshGuestOnAppActive,
  shouldRenderAppRoutes,
} from '../auth-token-bootstrap';

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

  it('저장된 게스트 세션이 유효하면 앱 시작 시 token을 갱신한다', async () => {
    const cacheUser = jest.fn();
    const refreshedUser = { ...guestUser, updatedAt: '2026-08-11T09:00:00' as const };
    const refreshGuest = jest.fn().mockResolvedValue({ user: refreshedUser });

    await expect(
      bootstrapAuthSession({
        initializeToken: jest.fn().mockResolvedValue('stored-guest-token'),
        getCurrentUser: jest.fn().mockResolvedValue(guestUser),
        refreshGuest,
        cacheUser,
      }),
    ).resolves.toBe('ready');

    expect(refreshGuest).toHaveBeenCalledTimes(1);
    expect(cacheUser).toHaveBeenCalledWith(refreshedUser);
  });

  it('게스트 token 갱신 실패 시 확인된 기존 세션으로 앱을 연다', async () => {
    const cacheUser = jest.fn();

    await expect(
      bootstrapAuthSession({
        initializeToken: jest.fn().mockResolvedValue('stored-guest-token'),
        getCurrentUser: jest.fn().mockResolvedValue(guestUser),
        refreshGuest: jest.fn().mockRejectedValue(new Error('refresh failed')),
        cacheUser,
      }),
    ).resolves.toBe('ready');

    expect(cacheUser).toHaveBeenCalledWith(guestUser);
  });

  it('정식 회원 세션은 게스트 token 갱신을 호출하지 않는다', async () => {
    const refreshGuest = jest.fn();
    const registeredUser = {
      ...guestUser,
      accountType: 'REGISTERED' as const,
      email: 'user@example.com',
    };

    await bootstrapAuthSession({
      initializeToken: jest.fn().mockResolvedValue('registered-token'),
      getCurrentUser: jest.fn().mockResolvedValue(registeredUser),
      refreshGuest,
      cacheUser: jest.fn(),
    });

    expect(refreshGuest).not.toHaveBeenCalled();
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

describe('shouldRenderAppRoutes', () => {
  it.each(['first-use', 'starting-guest', 'session-error'] as const)(
    '%s 상태에서는 Today route를 렌더링하지 않는다',
    (status) => {
      expect(shouldRenderAppRoutes(status, '/')).toBe(false);
    },
  );

  it.each(['/login', '/register', '/password-reset'])(
    '게스트 시작 실패 중에도 %s 인증 route는 렌더링한다',
    (pathname) => {
      expect(shouldRenderAppRoutes('first-use', pathname)).toBe(true);
    },
  );

  it('최초 사용자는 공개 start route에서 시작 안내를 다시 열 수 있다', () => {
    expect(shouldRenderAppRoutes('first-use', '/start')).toBe(true);
  });

  it('세션 준비가 끝나면 Today route를 렌더링한다', () => {
    expect(shouldRenderAppRoutes('ready', '/')).toBe(true);
  });
});

describe('foreground guest refresh', () => {
  it('마지막 시도 후 24시간이 지난 게스트만 갱신 대상으로 판단한다', () => {
    const lastAttemptAt = Date.UTC(2026, 7, 10, 0, 0, 0);

    expect(
      shouldRefreshGuestOnAppActive(guestUser, lastAttemptAt, lastAttemptAt + 24 * 60 * 60 * 1_000),
    ).toBe(true);
    expect(
      shouldRefreshGuestOnAppActive(guestUser, lastAttemptAt, lastAttemptAt + 60 * 60 * 1_000),
    ).toBe(false);
    expect(
      shouldRefreshGuestOnAppActive(
        { ...guestUser, accountType: 'REGISTERED' },
        lastAttemptAt,
        lastAttemptAt + 48 * 60 * 60 * 1_000,
      ),
    ).toBe(false);
  });

  it('활성화된 게스트 token을 갱신하고 사용자 cache를 교체한다', async () => {
    const cacheUser = jest.fn();
    const refreshedUser = { ...guestUser, updatedAt: '2026-08-11T10:00:00' as const };

    await expect(
      refreshActiveGuestSession({
        getCachedUser: () => guestUser,
        refreshGuest: jest.fn().mockResolvedValue({ user: refreshedUser }),
        cacheUser,
      }),
    ).resolves.toBe(true);

    expect(cacheUser).toHaveBeenCalledWith(refreshedUser);
  });

  it('활성화 갱신 실패 시 기존 사용자 cache를 유지한다', async () => {
    const cacheUser = jest.fn();

    await expect(
      refreshActiveGuestSession({
        getCachedUser: () => guestUser,
        refreshGuest: jest.fn().mockRejectedValue(new Error('refresh failed')),
        cacheUser,
      }),
    ).resolves.toBe(false);

    expect(cacheUser).not.toHaveBeenCalled();
  });
});
