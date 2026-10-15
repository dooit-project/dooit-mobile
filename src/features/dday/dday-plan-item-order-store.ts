import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const STORAGE_KEY = 'dooit.planItemOrder';
let writeQueue: Promise<void> = Promise.resolve();

function getWebStorage() {
  try {
    return Platform.OS === 'web' &&
      typeof globalThis !== 'undefined' &&
      'localStorage' in globalThis
      ? globalThis.localStorage
      : null;
  } catch {
    return null;
  }
}

async function readOrders(): Promise<Record<string, string[]>> {
  const serialized =
    Platform.OS === 'web'
      ? getWebStorage()?.getItem(STORAGE_KEY)
      : await SecureStore.getItemAsync(STORAGE_KEY);
  if (!serialized) return {};
  try {
    const value: unknown = JSON.parse(serialized);
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return Object.fromEntries(
      Object.entries(value)
        .filter(
          (entry): entry is [string, string[]] =>
            Array.isArray(entry[1]) &&
            entry[1].every((id: unknown) => typeof id === 'string' && id.length > 0),
        )
        .map(([scope, ids]) => [scope, [...new Set(ids)]]),
    );
  } catch {
    return {};
  }
}

export async function readDdayPlanItemOrder(scope: string, goalId: number) {
  return (await readOrders())[JSON.stringify([scope, goalId])] ?? [];
}

export function writeDdayPlanItemOrder(scope: string, goalId: number, ids: string[]) {
  const snapshot = [...ids];
  const write = writeQueue
    .catch(() => undefined)
    .then(async () => {
      const orders = await readOrders();
      orders[JSON.stringify([scope, goalId])] = snapshot;
      const serialized = JSON.stringify(orders);
      if (Platform.OS === 'web') {
        const storage = getWebStorage();
        if (!storage) throw new Error('이 기기에 순서를 저장할 수 없어요.');
        storage.setItem(STORAGE_KEY, serialized);
      } else await SecureStore.setItemAsync(STORAGE_KEY, serialized);
    });
  writeQueue = write;
  return write;
}
