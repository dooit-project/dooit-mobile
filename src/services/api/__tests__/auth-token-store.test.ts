import {
  clearAccessToken,
  getAuthAccountType,
  getAccessToken,
  initializeAccessToken,
  initializeAuthAccountType,
  resetAuthTokenStoreForTesting,
  setAccessToken,
  setAuthAccountType,
  subscribeAccessToken,
} from '../auth-token-store';

const mockSecureStore = new Map<string, string>();

jest.mock('expo-secure-store', () => ({
  deleteItemAsync: jest.fn(async (key: string) => {
    mockSecureStore.delete(key);
  }),
  getItemAsync: jest.fn(async (key: string) => mockSecureStore.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockSecureStore.set(key, value);
  }),
}));

describe('auth token store', () => {
  beforeEach(() => {
    mockSecureStore.clear();
    resetAuthTokenStoreForTesting();
  });

  it('access token을 메모리와 SecureStore에 저장한다', async () => {
    await setAccessToken(' token-value ');

    expect(getAccessToken()).toBe('token-value');
    expect(mockSecureStore.get('todolab.accessToken')).toBe('token-value');
  });

  it('access token을 삭제한다', async () => {
    await setAccessToken('token-value');

    await clearAccessToken();

    expect(getAccessToken()).toBeNull();
    expect(mockSecureStore.get('todolab.accessToken')).toBeUndefined();
  });

  it('SecureStore의 access token을 메모리로 복원한다', async () => {
    mockSecureStore.set('todolab.accessToken', 'persisted-token');

    await initializeAccessToken();

    expect(getAccessToken()).toBe('persisted-token');
  });

  it('access token 변경을 구독자에게 알린다', async () => {
    const listener = jest.fn();
    const unsubscribe = subscribeAccessToken(listener);

    await setAccessToken('token-value');
    await clearAccessToken();
    unsubscribe();
    await setAccessToken('ignored-token');

    expect(listener).toHaveBeenNthCalledWith(1, 'token-value');
    expect(listener).toHaveBeenNthCalledWith(2, null);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('계정 유형을 SecureStore에 저장하고 cold start 메모리로 복원한다', async () => {
    await setAuthAccountType('GUEST');

    expect(getAuthAccountType()).toBe('GUEST');
    expect(mockSecureStore.get('todolab.authAccountType')).toBe('GUEST');

    resetAuthTokenStoreForTesting();
    await initializeAuthAccountType();

    expect(getAuthAccountType()).toBe('GUEST');
  });

  it('token을 삭제해도 만료 복구용 계정 유형은 유지한다', async () => {
    await setAccessToken('expired-token');
    await setAuthAccountType('GUEST');

    await clearAccessToken();

    expect(getAccessToken()).toBeNull();
    expect(getAuthAccountType()).toBe('GUEST');
  });
});
