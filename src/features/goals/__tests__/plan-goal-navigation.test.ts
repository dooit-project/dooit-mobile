import {
  getTaskPlanGoalKey,
  parsePlanGoalKey,
  resolvePlanGoalNavigation,
} from '../plan-goal-navigation';

const loaded = {
  goal: { ids: [1, 2], status: 'success' as const },
  dday: { ids: [1, 6], status: 'success' as const },
};

describe('Task to Plan goal navigation', () => {
  it('keeps coincident Goal and D-Day IDs separate and prefers explicit Goal linkage', () => {
    expect(getTaskPlanGoalKey({ linkedGoalId: 1, ddayGoalId: 1 })).toBe('goal:1');
    expect(getTaskPlanGoalKey({ linkedGoalId: null, ddayGoalId: 1 })).toBe('dday:1');
    expect(getTaskPlanGoalKey({ ddayGoalId: 6 })).toBe('dday:6');
  });
  it('does not substitute a legacy goal for an invalid explicit Goal link', () => {
    expect(getTaskPlanGoalKey({ linkedGoalId: -1, ddayGoalId: 1 })).toBeNull();
    expect(
      getTaskPlanGoalKey({ linkedGoalId: Number.MAX_SAFE_INTEGER + 1, ddayGoalId: 1 }),
    ).toBeNull();
  });
  it('does not create a navigation target for an unlinked or unloaded task', () => {
    expect(getTaskPlanGoalKey({ linkedGoalId: null, ddayGoalId: null })).toBeNull();
    expect(getTaskPlanGoalKey()).toBeNull();
  });
  it.each(['goal:1', 'dday:6'])('accepts an unambiguous canonical key %s', (key) => {
    expect(parsePlanGoalKey(key)).toBe(key);
  });
  it.each([
    undefined,
    '',
    '1',
    'goal:0',
    'goal:01',
    'dday:-1',
    'goal:1.5',
    'goal:1e2',
    'goal:9007199254740992',
    ['goal:1', 'dday:1'],
  ])('rejects invalid or repeated route values %p', (key) => {
    expect(parsePlanGoalKey(key)).toBeNull();
  });
  it('finds only the requested namespace, not a goal with the same numeric ID', () => {
    expect(resolvePlanGoalNavigation('goal:1', loaded)).toBe('found');
    expect(resolvePlanGoalNavigation('dday:1', loaded)).toBe('found');
    expect(resolvePlanGoalNavigation('goal:6', loaded)).toBe('missing');
  });
  it('waits for the requested source even when another source has the same ID', () => {
    expect(
      resolvePlanGoalNavigation('goal:1', { ...loaded, goal: { ids: [], status: 'pending' } }),
    ).toBe('waiting');
    expect(
      resolvePlanGoalNavigation('goal:1', { ...loaded, goal: { ids: [], status: 'error' } }),
    ).toBe('waiting');
  });
  it('can navigate using the exact cached goal during a background refresh error', () => {
    expect(
      resolvePlanGoalNavigation('goal:1', { ...loaded, goal: { ids: [1], status: 'error' } }),
    ).toBe('found');
  });
  it('reports a missing goal only after its source finished loading', () => {
    expect(resolvePlanGoalNavigation('dday:99', loaded)).toBe('missing');
  });
});
