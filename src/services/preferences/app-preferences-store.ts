import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const APP_PREFERENCES_STORAGE_KEY = 'todolab.appPreferences';
const SECURE_STORE_OPTIONS = {
  keychainService: APP_PREFERENCES_STORAGE_KEY,
} satisfies SecureStore.SecureStoreOptions;

export const CURRENT_ONBOARDING_VERSION = 1;

export const FEATURE_TIP_IDS = [
  'today.quickCapture',
  'today.completeTask',
  'calendar.overview',
  'dday.linkedTasks',
  'today.review',
  'search.history',
] as const;

export type FeatureTipId = (typeof FEATURE_TIP_IDS)[number];

export type AppPreferences = {
  onboardingVersion: number;
  completedFeatureTips: FeatureTipId[];
  notificationPermissionPrompted: boolean;
};

const DEFAULT_APP_PREFERENCES: AppPreferences = {
  onboardingVersion: 0,
  completedFeatureTips: [],
  notificationPermissionPrompted: false,
};

const featureTipIds = new Set<string>(FEATURE_TIP_IDS);
let memoryPreferences: AppPreferences | null = null;
let initializePromise: Promise<AppPreferences> | null = null;
let updateQueue: Promise<void> = Promise.resolve();

function clonePreferences(preferences: AppPreferences): AppPreferences {
  return {
    onboardingVersion: preferences.onboardingVersion,
    completedFeatureTips: [...preferences.completedFeatureTips],
    notificationPermissionPrompted: preferences.notificationPermissionPrompted,
  };
}

function normalizePreferences(value: unknown): AppPreferences {
  if (!value || typeof value !== 'object') {
    return clonePreferences(DEFAULT_APP_PREFERENCES);
  }

  const candidate = value as Partial<AppPreferences>;
  const onboardingVersion =
    typeof candidate.onboardingVersion === 'number' &&
    Number.isInteger(candidate.onboardingVersion) &&
    candidate.onboardingVersion >= 0
      ? candidate.onboardingVersion
      : 0;
  const completedFeatureTips = Array.isArray(candidate.completedFeatureTips)
    ? [...new Set(candidate.completedFeatureTips)].filter(
        (tipId): tipId is FeatureTipId => typeof tipId === 'string' && featureTipIds.has(tipId),
      )
    : [];
  const notificationPermissionPrompted = candidate.notificationPermissionPrompted === true;

  return { onboardingVersion, completedFeatureTips, notificationPermissionPrompted };
}

function getWebStorage() {
  try {
    if (
      Platform.OS !== 'web' ||
      typeof globalThis === 'undefined' ||
      !('localStorage' in globalThis)
    ) {
      return null;
    }

    return globalThis.localStorage;
  } catch {
    return null;
  }
}

async function readPersistedPreferences() {
  const serialized =
    Platform.OS === 'web'
      ? getWebStorage()?.getItem(APP_PREFERENCES_STORAGE_KEY)
      : await SecureStore.getItemAsync(APP_PREFERENCES_STORAGE_KEY, SECURE_STORE_OPTIONS);

  if (!serialized) {
    return clonePreferences(DEFAULT_APP_PREFERENCES);
  }

  try {
    return normalizePreferences(JSON.parse(serialized));
  } catch {
    return clonePreferences(DEFAULT_APP_PREFERENCES);
  }
}

async function writePersistedPreferences(preferences: AppPreferences) {
  const serialized = JSON.stringify(preferences);

  if (Platform.OS === 'web') {
    getWebStorage()?.setItem(APP_PREFERENCES_STORAGE_KEY, serialized);
    return;
  }

  await SecureStore.setItemAsync(APP_PREFERENCES_STORAGE_KEY, serialized, SECURE_STORE_OPTIONS);
}

export async function initializeAppPreferences() {
  if (memoryPreferences) {
    return clonePreferences(memoryPreferences);
  }

  initializePromise ??= readPersistedPreferences().then((preferences) => {
    memoryPreferences = preferences;
    return preferences;
  });

  return clonePreferences(await initializePromise);
}

async function updateAppPreferences(
  updater: (current: AppPreferences) => AppPreferences,
): Promise<AppPreferences> {
  let updatedPreferences = clonePreferences(DEFAULT_APP_PREFERENCES);

  updateQueue = updateQueue
    .catch(() => undefined)
    .then(async () => {
      const current = await initializeAppPreferences();
      updatedPreferences = normalizePreferences(updater(current));
      await writePersistedPreferences(updatedPreferences);
      memoryPreferences = updatedPreferences;
    });

  await updateQueue;
  return clonePreferences(updatedPreferences);
}

export async function completeOnboarding(version = CURRENT_ONBOARDING_VERSION) {
  const completedVersion = Number.isInteger(version) && version >= 0 ? version : 0;

  return updateAppPreferences((current) => ({
    ...current,
    onboardingVersion: Math.max(current.onboardingVersion, completedVersion),
  }));
}

export async function markFeatureTipCompleted(tipId: FeatureTipId) {
  return updateAppPreferences((current) => ({
    ...current,
    completedFeatureTips: current.completedFeatureTips.includes(tipId)
      ? current.completedFeatureTips
      : [...current.completedFeatureTips, tipId],
  }));
}

export async function markNotificationPermissionPrompted() {
  return updateAppPreferences((current) => ({
    ...current,
    notificationPermissionPrompted: true,
  }));
}

export async function resetAppGuidance() {
  return updateAppPreferences((current) => ({
    ...DEFAULT_APP_PREFERENCES,
    notificationPermissionPrompted: current.notificationPermissionPrompted,
  }));
}

export async function resetFeatureTips() {
  return updateAppPreferences((current) => ({
    ...current,
    completedFeatureTips: [],
  }));
}

export function resetAppPreferencesStoreForTesting() {
  memoryPreferences = null;
  initializePromise = null;
  updateQueue = Promise.resolve();
}
