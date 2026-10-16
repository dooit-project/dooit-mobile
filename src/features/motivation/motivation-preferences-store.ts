import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import {
  normalizeMotivationPreferences,
  refreshMotivationPreferences,
  type MotivationMode,
  type MotivationPreferences,
} from './motivation-preferences';

const STORAGE_KEY = 'dooit.motivationPreferences';
export type MotivationSnapshot = {
  ready: boolean;
  value: MotivationPreferences;
  loadError: boolean;
  historySaveFailed: boolean;
};
export const pendingMotivationSnapshot: MotivationSnapshot = {
  ready: false,
  value: { mode: 'standard', rotation: null },
  loadError: false,
  historySaveFailed: false,
};
const snapshots = new Map<string, MotivationSnapshot>();
const listeners = new Map<string, Set<() => void>>();
const initialization = new Map<string, Promise<void>>();
let writeQueue: Promise<void> = Promise.resolve();

function webStorage() {
  if (typeof globalThis === 'undefined' || !('localStorage' in globalThis))
    throw new Error('저장소를 사용할 수 없어요.');
  return globalThis.localStorage;
}

async function readAll(): Promise<Record<string, unknown>> {
  const serialized =
    Platform.OS === 'web'
      ? webStorage().getItem(STORAGE_KEY)
      : await SecureStore.getItemAsync(STORAGE_KEY);
  if (!serialized) return {};
  try {
    const value: unknown = JSON.parse(serialized);
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function publish(scope: string, snapshot: MotivationSnapshot) {
  snapshots.set(scope, snapshot);
  listeners.get(scope)?.forEach((listener) => listener());
}

export function getMotivationSnapshot(scope: string) {
  return snapshots.get(scope) ?? pendingMotivationSnapshot;
}

export function subscribeMotivation(scope: string, listener: () => void) {
  const scoped = listeners.get(scope) ?? new Set<() => void>();
  scoped.add(listener);
  listeners.set(scope, scoped);
  return () => {
    scoped.delete(listener);
    if (scoped.size === 0) listeners.delete(scope);
  };
}

export function initializeMotivation(scope: string, force = false) {
  if (getMotivationSnapshot(scope).ready && !force) return Promise.resolve();
  const inFlight = initialization.get(scope);
  if (inFlight) return inFlight;
  const task = readAll()
    .then((all) => {
      publish(scope, {
        ready: true,
        value: normalizeMotivationPreferences(all[scope]),
        loadError: false,
        historySaveFailed: false,
      });
    })
    .catch(() => {
      publish(scope, { ...pendingMotivationSnapshot, ready: true, loadError: true });
    })
    .finally(() => {
      initialization.delete(scope);
    });
  initialization.set(scope, task);
  return task;
}

function update(
  scope: string,
  updater: (current: MotivationPreferences) => MotivationPreferences,
  bestEffort: boolean,
) {
  const task = writeQueue
    .catch(() => undefined)
    .then(async () => {
      const current = getMotivationSnapshot(scope);
      if (!current.ready || current.loadError) {
        if (!bestEffort) throw new Error('문구 설정을 먼저 불러와 주세요.');
        return;
      }
      const next = updater(current.value);
      if (next === current.value) return;
      try {
        const all = await readAll();
        all[scope] = next;
        const serialized = JSON.stringify(all);
        if (Platform.OS === 'web') webStorage().setItem(STORAGE_KEY, serialized);
        else await SecureStore.setItemAsync(STORAGE_KEY, serialized);
        publish(scope, { ready: true, value: next, loadError: false, historySaveFailed: false });
      } catch (error) {
        if (!bestEffort) throw error;
        publish(scope, { ...current, value: next, historySaveFailed: true });
      }
    });
  writeQueue = task;
  return task;
}

export function setMotivationMode(scope: string, mode: MotivationMode) {
  return update(scope, (current) => ({ ...current, mode }), false);
}

export function refreshStoredMotivation(scope: string, manual: boolean) {
  return update(scope, (current) => refreshMotivationPreferences(current, manual), true);
}
