import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type { AccountType, LocalDateTimeString } from '@/types';

const ACCESS_TOKEN_STORAGE_KEY = 'dooit.accessToken';
const ACCOUNT_TYPE_STORAGE_KEY = 'dooit.authAccountType';
const AUTH_EMAIL_STORAGE_KEY = 'dooit.authEmail';
const ACCESS_TOKEN_EXPIRES_AT_STORAGE_KEY = 'dooit.accessTokenExpiresAt';
const REFRESH_TOKEN_STORAGE_KEY = 'dooit.refreshToken';
const REFRESH_TOKEN_EXPIRES_AT_STORAGE_KEY = 'dooit.refreshTokenExpiresAt';
const SECURE_STORE_OPTIONS = {
  keychainService: 'dooit.accessToken',
} satisfies SecureStore.SecureStoreOptions;

type AccessTokenListener = (token: string | null) => void;

let memoryAccessToken: string | null = null;
let memoryAccountType: AccountType | null = null;
let memoryAuthEmail: string | null = null;
let memoryAccessTokenExpiresAt: LocalDateTimeString | null = null;
let memoryRefreshToken: string | null = null;
let memoryRefreshTokenExpiresAt: LocalDateTimeString | null = null;
let initialized = false;
let accountTypeInitialized = false;
let authEmailInitialized = false;
let refreshCredentialInitialized = false;
const accessTokenListeners = new Set<AccessTokenListener>();

function normalizeToken(token: string | null | undefined) {
  const normalized = token?.trim();
  return normalized ? normalized : null;
}

function normalizeAccountType(value: string | null | undefined): AccountType | null {
  return value === 'GUEST' || value === 'REGISTERED' ? value : null;
}

function normalizeEmail(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
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

function notifyAccessTokenChanged() {
  accessTokenListeners.forEach((listener) => {
    listener(memoryAccessToken);
  });
}

async function readPersistedAccessToken() {
  if (Platform.OS === 'web') {
    return normalizeToken(getWebStorage()?.getItem(ACCESS_TOKEN_STORAGE_KEY));
  }

  return normalizeToken(
    await SecureStore.getItemAsync(ACCESS_TOKEN_STORAGE_KEY, SECURE_STORE_OPTIONS),
  );
}

async function writePersistedAccessToken(token: string | null) {
  if (Platform.OS === 'web') {
    const storage = getWebStorage();

    if (storage && token) {
      storage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
    } else if (storage) {
      storage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    }
    return;
  }

  if (token) {
    await SecureStore.setItemAsync(ACCESS_TOKEN_STORAGE_KEY, token, SECURE_STORE_OPTIONS);
  } else {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_STORAGE_KEY, SECURE_STORE_OPTIONS);
  }
}

export function getAccessToken() {
  if (memoryAccessToken) {
    return memoryAccessToken;
  }

  if (Platform.OS === 'web') {
    const token = normalizeToken(getWebStorage()?.getItem(ACCESS_TOKEN_STORAGE_KEY));
    memoryAccessToken = token;
    return token;
  }

  return null;
}

export function getAccessTokenExpiresAt() {
  return memoryAccessTokenExpiresAt;
}

export function getRefreshToken() {
  return Platform.OS === 'web' ? null : memoryRefreshToken;
}

export function getRefreshTokenExpiresAt() {
  return Platform.OS === 'web' ? null : memoryRefreshTokenExpiresAt;
}

export async function initializeAccessToken() {
  if (initialized) {
    return memoryAccessToken;
  }

  memoryAccessToken = await readPersistedAccessToken();
  initialized = true;
  notifyAccessTokenChanged();

  return memoryAccessToken;
}

export function getAuthAccountType() {
  if (memoryAccountType) {
    return memoryAccountType;
  }

  if (Platform.OS === 'web') {
    memoryAccountType = normalizeAccountType(getWebStorage()?.getItem(ACCOUNT_TYPE_STORAGE_KEY));
  }

  return memoryAccountType;
}

export async function initializeAuthAccountType() {
  if (accountTypeInitialized) {
    return memoryAccountType;
  }

  const persistedValue =
    Platform.OS === 'web'
      ? getWebStorage()?.getItem(ACCOUNT_TYPE_STORAGE_KEY)
      : await SecureStore.getItemAsync(ACCOUNT_TYPE_STORAGE_KEY);
  memoryAccountType = normalizeAccountType(persistedValue);
  accountTypeInitialized = true;
  return memoryAccountType;
}

export function getAuthEmail() {
  if (memoryAuthEmail) return memoryAuthEmail;

  if (Platform.OS === 'web') {
    memoryAuthEmail = normalizeEmail(getWebStorage()?.getItem(AUTH_EMAIL_STORAGE_KEY));
  }

  return memoryAuthEmail;
}

export async function initializeAuthEmail() {
  if (authEmailInitialized) return memoryAuthEmail;

  const persistedValue =
    Platform.OS === 'web'
      ? getWebStorage()?.getItem(AUTH_EMAIL_STORAGE_KEY)
      : await SecureStore.getItemAsync(AUTH_EMAIL_STORAGE_KEY);
  memoryAuthEmail = normalizeEmail(persistedValue);
  authEmailInitialized = true;
  return memoryAuthEmail;
}

export async function initializeRefreshCredential() {
  if (Platform.OS === 'web' || refreshCredentialInitialized) {
    return memoryRefreshToken;
  }

  const [accessExpiresAt, refreshToken, refreshExpiresAt] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_TOKEN_EXPIRES_AT_STORAGE_KEY),
    SecureStore.getItemAsync(REFRESH_TOKEN_STORAGE_KEY),
    SecureStore.getItemAsync(REFRESH_TOKEN_EXPIRES_AT_STORAGE_KEY),
  ]);
  memoryAccessTokenExpiresAt = accessExpiresAt as LocalDateTimeString | null;
  memoryRefreshToken = normalizeToken(refreshToken);
  memoryRefreshTokenExpiresAt = refreshExpiresAt as LocalDateTimeString | null;
  refreshCredentialInitialized = true;
  return memoryRefreshToken;
}

export async function setSessionCredential(credential: {
  accessToken: string;
  accessTokenExpiresAt: LocalDateTimeString;
  refreshToken: string | null;
  refreshTokenExpiresAt: LocalDateTimeString | null;
}) {
  await setAccessToken(credential.accessToken);
  memoryAccessTokenExpiresAt = credential.accessTokenExpiresAt;

  if (Platform.OS === 'web') {
    return;
  }

  memoryRefreshToken = normalizeToken(credential.refreshToken);
  memoryRefreshTokenExpiresAt = credential.refreshTokenExpiresAt;
  refreshCredentialInitialized = true;
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_EXPIRES_AT_STORAGE_KEY, credential.accessTokenExpiresAt),
    memoryRefreshToken
      ? SecureStore.setItemAsync(REFRESH_TOKEN_STORAGE_KEY, memoryRefreshToken)
      : SecureStore.deleteItemAsync(REFRESH_TOKEN_STORAGE_KEY),
    memoryRefreshTokenExpiresAt
      ? SecureStore.setItemAsync(REFRESH_TOKEN_EXPIRES_AT_STORAGE_KEY, memoryRefreshTokenExpiresAt)
      : SecureStore.deleteItemAsync(REFRESH_TOKEN_EXPIRES_AT_STORAGE_KEY),
  ]);
}

export async function clearSessionCredential() {
  memoryAccessTokenExpiresAt = null;
  memoryRefreshToken = null;
  memoryRefreshTokenExpiresAt = null;
  refreshCredentialInitialized = true;
  await clearAccessToken();

  if (Platform.OS !== 'web') {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_EXPIRES_AT_STORAGE_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_STORAGE_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_EXPIRES_AT_STORAGE_KEY),
    ]);
  }
}

export async function setAuthAccountType(accountType: AccountType) {
  memoryAccountType = accountType;
  accountTypeInitialized = true;

  if (Platform.OS === 'web') {
    getWebStorage()?.setItem(ACCOUNT_TYPE_STORAGE_KEY, accountType);
  } else {
    await SecureStore.setItemAsync(ACCOUNT_TYPE_STORAGE_KEY, accountType);
  }
}

export async function setAuthEmail(email: string | null | undefined) {
  memoryAuthEmail = normalizeEmail(email);
  authEmailInitialized = true;

  if (Platform.OS === 'web') {
    const storage = getWebStorage();
    if (memoryAuthEmail) storage?.setItem(AUTH_EMAIL_STORAGE_KEY, memoryAuthEmail);
    else storage?.removeItem(AUTH_EMAIL_STORAGE_KEY);
  } else if (memoryAuthEmail) {
    await SecureStore.setItemAsync(AUTH_EMAIL_STORAGE_KEY, memoryAuthEmail);
  } else {
    await SecureStore.deleteItemAsync(AUTH_EMAIL_STORAGE_KEY);
  }
}

export async function setAccessToken(token: string | null | undefined) {
  const previousToken = memoryAccessToken;
  memoryAccessToken = normalizeToken(token);
  initialized = true;
  notifyAccessTokenChanged();

  try {
    await writePersistedAccessToken(memoryAccessToken);
  } catch (error) {
    memoryAccessToken = null;
    notifyAccessTokenChanged();
    throw error;
  }

  return { previousToken, token: memoryAccessToken };
}

export async function clearAccessToken() {
  return setAccessToken(null);
}

export function subscribeAccessToken(listener: AccessTokenListener) {
  accessTokenListeners.add(listener);

  return () => {
    accessTokenListeners.delete(listener);
  };
}

export function resetAuthTokenStoreForTesting() {
  memoryAccessToken = null;
  memoryAccountType = null;
  memoryAuthEmail = null;
  memoryAccessTokenExpiresAt = null;
  memoryRefreshToken = null;
  memoryRefreshTokenExpiresAt = null;
  initialized = false;
  accountTypeInitialized = false;
  authEmailInitialized = false;
  refreshCredentialInitialized = false;
  accessTokenListeners.clear();
}
