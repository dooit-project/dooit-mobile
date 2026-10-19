import * as SecureStore from 'expo-secure-store';

import { readPlanGoalPreferences, updatePlanGoalPreferences } from '../plan-goal-preferences';

jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn(), setItemAsync: jest.fn() }));

describe('Mixed Goal and D-Day preferences', () => {
  let storage: Record<string, string>;
  beforeEach(() => {
    storage = {};
    jest.mocked(SecureStore.getItemAsync).mockImplementation(async (key) => storage[key] ?? null);
    jest.mocked(SecureStore.setItemAsync).mockImplementation(async (key, value) => {
      storage[key] = value;
    });
  });
  it('reads old numeric selection/order without rewriting and keeps equal IDs in separate namespaces', async () => {
    const scope = 'mock-user-11';
    storage['dooit.planGoalOrder'] = JSON.stringify({ [scope]: [7, 2] });
    storage['dooit.planGoalSelection'] = JSON.stringify({ [scope]: 7 });
    expect(await readPlanGoalPreferences(scope)).toEqual({
      selected: 'dday:7',
      order: ['dday:7', 'dday:2'],
      colors: {},
    });
    await updatePlanGoalPreferences(scope, { selected: 'goal:7', colors: { 'goal:7': '#78947B' } });
    const result = await updatePlanGoalPreferences(scope, {
      order: ['goal:7', 'dday:7', 'dday:2'],
    });
    expect(result).toEqual({
      selected: 'goal:7',
      order: ['goal:7', 'dday:7', 'dday:2'],
      colors: { 'goal:7': '#78947B' },
    });
    expect(JSON.parse(storage['dooit.planGoalOrder'])[scope]).toEqual([7, 2]);
    expect(JSON.parse(storage['dooit.planGoalSelection'])[scope]).toBe(7);
    expect((await readPlanGoalPreferences('real-other-api-user-11')).selected).toBeNull();
    expect((await readPlanGoalPreferences('mock-user-12')).colors).toEqual({});
  });
  it('serializes independent partial saves and does not report unavailable storage as success', async () => {
    await Promise.all([
      updatePlanGoalPreferences('same', { selected: 'goal:1' }),
      updatePlanGoalPreferences('same', { colors: { 'goal:1': '#78947B' } }),
    ]);
    expect(await readPlanGoalPreferences('same')).toMatchObject({
      selected: 'goal:1',
      colors: { 'goal:1': '#78947B' },
    });
    jest.mocked(SecureStore.setItemAsync).mockRejectedValueOnce(new Error('storage unavailable'));
    await expect(updatePlanGoalPreferences('same', { selected: 'goal:2' })).rejects.toThrow(
      'storage unavailable',
    );
    expect((await readPlanGoalPreferences('same')).selected).toBe('goal:1');
  });
});
