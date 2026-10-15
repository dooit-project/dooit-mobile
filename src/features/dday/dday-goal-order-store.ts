import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const STORAGE_KEY = 'dooit.planGoalOrder';
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

async function readOrders(): Promise<Record<string, number[]>> {
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
          (entry): entry is [string, number[]] =>
            Array.isArray(entry[1]) &&
            entry[1].every(
              (id: unknown) => typeof id === 'number' && Number.isSafeInteger(id) && id > 0,
            ),
        )
        .map(([scope, ids]) => [scope, [...new Set(ids)]]),
    );
  } catch {
    return {};
  }
}

export async function readDdayGoalOrder(scope: string) {
  return (await readOrders())[scope] ?? [];
}

export function writeDdayGoalOrder(scope: string, ids: number[]) {
  const snapshot = [...ids];
  const write = writeQueue
    .catch(() => undefined)
    .then(async () => {
      const orders = await readOrders();
      orders[scope] = snapshot;
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
