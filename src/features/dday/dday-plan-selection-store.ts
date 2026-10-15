import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const STORAGE_KEY = 'dooit.planGoalSelection';
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

async function readSelections(): Promise<Record<string, number>> {
  const serialized =
    Platform.OS === 'web'
      ? getWebStorage()?.getItem(STORAGE_KEY)
      : await SecureStore.getItemAsync(STORAGE_KEY);
  if (!serialized) return {};
  try {
    const value: unknown = JSON.parse(serialized);
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return Object.fromEntries(
      Object.entries(value).filter(
        (entry): entry is [string, number] =>
          typeof entry[1] === 'number' && Number.isSafeInteger(entry[1]) && entry[1] > 0,
      ),
    );
  } catch {
    return {};
  }
}

export async function readDdayPlanSelection(scope: string) {
  return (await readSelections())[scope] ?? null;
}

export function writeDdayPlanSelection(scope: string, goalId: number | null) {
  const write = writeQueue
    .catch(() => undefined)
    .then(async () => {
      const selections = await readSelections();
      if (goalId === null) delete selections[scope];
      else selections[scope] = goalId;
      const serialized = JSON.stringify(selections);
      if (Platform.OS === 'web') getWebStorage()?.setItem(STORAGE_KEY, serialized);
      else await SecureStore.setItemAsync(STORAGE_KEY, serialized);
    });
  writeQueue = write;
  return write;
}
