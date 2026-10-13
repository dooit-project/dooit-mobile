import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

const STORAGE_KEY = 'dooit.ddayGoalColors';

export const ddayGoalColors = [
  { id: 'sage', label: '세이지', value: '#78947B' },
  { id: 'blue', label: '블루', value: '#738DA3' },
  { id: 'amber', label: '앰버', value: '#B38A45' },
  { id: 'coral', label: '코랄', value: '#B8796F' },
  { id: 'violet', label: '바이올렛', value: '#887DA1' },
  { id: 'teal', label: '틸', value: '#648F8A' },
] as const;

export type DdayGoalColor = (typeof ddayGoalColors)[number]['value'];
type GoalColorMap = Record<string, DdayGoalColor>;

let memoryColors: GoalColorMap | null = null;

function getWebStorage() {
  try {
    return Platform.OS === 'web' && typeof globalThis !== 'undefined' && 'localStorage' in globalThis
      ? globalThis.localStorage
      : null;
  } catch {
    return null;
  }
}

function isGoalColor(value: unknown): value is DdayGoalColor {
  return ddayGoalColors.some((color) => color.value === value);
}

async function readGoalColors(): Promise<GoalColorMap> {
  if (memoryColors) return memoryColors;

  const serialized =
    Platform.OS === 'web'
      ? getWebStorage()?.getItem(STORAGE_KEY)
      : await SecureStore.getItemAsync(STORAGE_KEY);

  if (!serialized) return (memoryColors = {});

  try {
    const parsed = JSON.parse(serialized) as Record<string, unknown>;
    memoryColors = Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, DdayGoalColor] =>
        isGoalColor(entry[1]),
      ),
    );
  } catch {
    memoryColors = {};
  }

  return memoryColors;
}

export async function setDdayGoalColor(goalId: number, color: DdayGoalColor) {
  const current = await readGoalColors();
  const next = { ...current, [String(goalId)]: color };
  memoryColors = next;
  const serialized = JSON.stringify(next);

  if (Platform.OS === 'web') {
    getWebStorage()?.setItem(STORAGE_KEY, serialized);
  } else {
    await SecureStore.setItemAsync(STORAGE_KEY, serialized);
  }
}

export function getDdayGoalFallbackColor(goalId: number) {
  return ddayGoalColors[Math.abs(goalId) % ddayGoalColors.length].value;
}

export function useDdayGoalColors(goalIds: number[]) {
  const [colors, setColors] = useState<GoalColorMap>({});
  const goalIdKey = goalIds.join(',');

  useEffect(() => {
    let active = true;
    void readGoalColors().then((storedColors) => {
      if (active) setColors({ ...storedColors });
    });
    return () => {
      active = false;
    };
  }, [goalIdKey]);

  return colors;
}
