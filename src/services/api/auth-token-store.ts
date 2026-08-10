import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type { AccountType } from '@/types';

const ACCESS_TOKEN_STORAGE_KEY = 'todolab.accessToken';
const ACCOUNT_TYPE_STORAGE_KEY = 'todolab.authAccountType';
const SECURE_STORE_OPTIONS = {
  keychainService: 'todolab.accessToken',
} satisfies SecureStore.SecureStoreOptions;

type AccessTokenListener = (token: string | null) => void;

let memoryAccessToken: string | null = null;
let memoryAccountType: AccountType | null = null;
let initialized = false;
let accountTypeInitialized = false;
const accessTokenListeners = new Set<AccessTokenListener>();

function normalizeToken(token: string | null | undefined) {
  const normalized = token?.trim();
  return normalized ? normalized : null;
}

function normalizeAccountType(value: string | null | undefined): AccountType | null {
  return value === 'GUEST' || value === 'REGISTERED' ? value : null;
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

export async function setAuthAccountType(accountType: AccountType) {
  memoryAccountType = accountType;
  accountTypeInitialized = true;

  if (Platform.OS === 'web') {
    getWebStorage()?.setItem(ACCOUNT_TYPE_STORAGE_KEY, accountType);
  } else {
    await SecureStore.setItemAsync(ACCOUNT_TYPE_STORAGE_KEY, accountType);
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
  initialized = false;
  accountTypeInitialized = false;
  accessTokenListeners.clear();
}
