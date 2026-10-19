import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { ddayGoalColors, type DdayGoalColor } from '@/features/dday/dday-goal-colors';
import { readDdayGoalOrder } from '@/features/dday/dday-goal-order-store';
import { readDdayPlanSelection } from '@/features/dday/dday-plan-selection-store';

export type PlanGoalKey = `goal:${number}` | `dday:${number}`;
export type PlanGoalPreferences = {
  selected: PlanGoalKey | null;
  order: PlanGoalKey[];
  colors: Record<string, DdayGoalColor>;
};
const STORAGE_KEY = 'dooit.goalPlanPreferences.v1';
let queue: Promise<unknown> = Promise.resolve();

function webStorage() {
  try {
    return Platform.OS === 'web' && typeof globalThis.localStorage !== 'undefined'
      ? globalThis.localStorage
      : null;
  } catch {
    return null;
  }
}
function validKey(value: unknown): value is PlanGoalKey {
  return typeof value === 'string' && /^(goal|dday):[1-9]\d*$/.test(value);
}
function normalize(value: unknown): PlanGoalPreferences | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const object = value as Record<string, unknown>;
  const colors: Record<string, DdayGoalColor> = {};
  if (object.colors && typeof object.colors === 'object' && !Array.isArray(object.colors)) {
    for (const [key, color] of Object.entries(object.colors)) {
      if (validKey(key) && ddayGoalColors.some((item) => item.value === color))
        colors[key] = color as DdayGoalColor;
    }
  }
  return {
    selected: validKey(object.selected) ? object.selected : null,
    order: Array.isArray(object.order) ? [...new Set(object.order.filter(validKey))] : [],
    colors,
  };
}
async function readAll(): Promise<Record<string, unknown>> {
  const raw =
    Platform.OS === 'web'
      ? webStorage()?.getItem(STORAGE_KEY)
      : await SecureStore.getItemAsync(STORAGE_KEY);
  if (!raw) return {};
  try {
    const value: unknown = JSON.parse(raw);
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}
export async function readPlanGoalPreferences(scope: string): Promise<PlanGoalPreferences> {
  const stored = normalize((await readAll())[scope]);
  if (stored) return stored;
  const [order, selected] = await Promise.all([
    readDdayGoalOrder(scope),
    readDdayPlanSelection(scope),
  ]);
  return {
    order: order.map((id): PlanGoalKey => `dday:${id}`),
    selected: selected === null ? null : `dday:${selected}`,
    colors: {},
  };
}
/** Separate store: reading a legacy order never overwrites its numeric IDs or selection. */
export function updatePlanGoalPreferences(scope: string, patch: Partial<PlanGoalPreferences>) {
  const operation = queue
    .catch(() => undefined)
    .then(async () => {
      const all = await readAll();
      const current = normalize(all[scope]) ?? (await readPlanGoalPreferences(scope));
      const next = { ...current, ...patch, colors: { ...current.colors, ...patch.colors } };
      all[scope] = next;
      const raw = JSON.stringify(all);
      if (Platform.OS === 'web') {
        const storage = webStorage();
        if (!storage) throw new Error('이 기기에 설정을 저장할 수 없어요.');
        storage.setItem(STORAGE_KEY, raw);
      } else await SecureStore.setItemAsync(STORAGE_KEY, raw);
      return next;
    });
  queue = operation;
  return operation;
}
