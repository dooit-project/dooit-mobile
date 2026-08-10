import { Platform } from 'react-native';

import {
  CURRENT_ONBOARDING_VERSION,
  completeOnboarding,
  initializeAppPreferences,
  markFeatureTipCompleted,
  markNotificationPermissionPrompted,
  resetAppGuidance,
  resetAppPreferencesStoreForTesting,
  resetFeatureTips,
} from '../app-preferences-store';

const mockSecureStore = new Map<string, string>();

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockSecureStore.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockSecureStore.set(key, value);
  }),
}));

describe('app preferences store', () => {
  beforeEach(() => {
    mockSecureStore.clear();
    resetAppPreferencesStoreForTesting();
  });

  it('저장값이 없으면 아직 완료하지 않은 기본 상태를 반환한다', async () => {
    await expect(initializeAppPreferences()).resolves.toEqual({
      onboardingVersion: 0,
      completedFeatureTips: [],
      notificationPermissionPrompted: false,
    });
  });

  it('온보딩 버전과 기능별 안내 완료 상태를 함께 보존한다', async () => {
    await completeOnboarding();
    await markFeatureTipCompleted('today.quickCapture');
    await markFeatureTipCompleted('today.quickCapture');
    resetAppPreferencesStoreForTesting();

    await expect(initializeAppPreferences()).resolves.toEqual({
      onboardingVersion: CURRENT_ONBOARDING_VERSION,
      completedFeatureTips: ['today.quickCapture'],
      notificationPermissionPrompted: false,
    });
  });

  it('낮은 온보딩 버전으로 완료 상태를 되돌리지 않는다', async () => {
    await completeOnboarding(CURRENT_ONBOARDING_VERSION + 1);
    await completeOnboarding(CURRENT_ONBOARDING_VERSION);

    await expect(initializeAppPreferences()).resolves.toMatchObject({
      onboardingVersion: CURRENT_ONBOARDING_VERSION + 1,
    });
  });

  it('손상되거나 알 수 없는 저장값은 안전하게 정규화한다', async () => {
    mockSecureStore.set(
      'todolab.appPreferences',
      JSON.stringify({
        onboardingVersion: -1,
        completedFeatureTips: ['calendar.overview', 'unknown.tip'],
      }),
    );

    await expect(initializeAppPreferences()).resolves.toEqual({
      onboardingVersion: 0,
      completedFeatureTips: ['calendar.overview'],
      notificationPermissionPrompted: false,
    });
  });

  it('가이드 다시 보기를 위해 온보딩과 tip 상태를 초기화한다', async () => {
    await completeOnboarding();
    await markFeatureTipCompleted('dday.linkedTasks');

    await expect(resetAppGuidance()).resolves.toEqual({
      onboardingVersion: 0,
      completedFeatureTips: [],
      notificationPermissionPrompted: false,
    });
  });

  it('화면 가이드만 다시 볼 때 필수 온보딩 완료 버전은 유지한다', async () => {
    await completeOnboarding();
    await markFeatureTipCompleted('calendar.overview');

    await expect(resetFeatureTips()).resolves.toEqual({
      onboardingVersion: CURRENT_ONBOARDING_VERSION,
      completedFeatureTips: [],
      notificationPermissionPrompted: false,
    });
  });

  it('알림 권한 안내 여부는 온보딩과 화면 가이드 초기화와 별도로 유지한다', async () => {
    await markNotificationPermissionPrompted();
    await completeOnboarding();

    await expect(resetFeatureTips()).resolves.toMatchObject({
      notificationPermissionPrompted: true,
    });
    await expect(resetAppGuidance()).resolves.toMatchObject({
      notificationPermissionPrompted: true,
    });
  });

  it('Web에서는 localStorage에 같은 형식으로 저장한다', async () => {
    const originalPlatform = Platform.OS;
    const originalLocalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
    const storage: Record<string, string> = {};

    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => storage[key] ?? null,
        setItem: (key: string, value: string) => {
          storage[key] = value;
        },
      },
    });

    try {
      await completeOnboarding();
      await markFeatureTipCompleted('search.history');
      resetAppPreferencesStoreForTesting();

      await expect(initializeAppPreferences()).resolves.toEqual({
        onboardingVersion: CURRENT_ONBOARDING_VERSION,
        completedFeatureTips: ['search.history'],
        notificationPermissionPrompted: false,
      });
    } finally {
      Object.defineProperty(Platform, 'OS', { configurable: true, value: originalPlatform });
      if (originalLocalStorage) {
        Object.defineProperty(globalThis, 'localStorage', originalLocalStorage);
      } else {
        Reflect.deleteProperty(globalThis, 'localStorage');
      }
    }
  });
});
