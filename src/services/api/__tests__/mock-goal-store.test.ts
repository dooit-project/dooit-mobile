import type { GoalResponse } from '@/types';

import { createMockGoalStore } from '../mock-goal-store';

describe('Goal CRUD contract', () => {
  const owner = { ownerId: 11, visibleDdayIds: [31] };
  const other = { ownerId: 12, visibleDdayIds: [] };
  let store: ReturnType<typeof createMockGoalStore>;

  beforeEach(() => {
    store = createMockGoalStore();
  });

  function create(body: unknown = { title: '토익 900점' }) {
    return store.request('POST', '/api/v1/goals', body, owner) as GoalResponse;
  }

  it('allows no target date and clears omitted optional content on PATCH', () => {
    const goal = create({
      title: ' 토익 900점 ',
      motivationText: '기회 만들기',
      linkedDdayGoalId: 31,
    });
    expect(goal).toMatchObject({ title: '토익 900점', targetDate: null, currentVersion: 1 });
    expect(
      store.request('PATCH', `/api/v1/goals/${goal.id}`, { title: '영어 공부' }, owner),
    ).toMatchObject({ motivationText: null, linkedDdayGoalId: null, currentVersion: 2 });
  });

  it('hides another owner’s goals and detail, including after a guest merge', () => {
    const goal = create();
    const path = `/api/v1/goals/${goal.id}`;
    expect(store.request('GET', '/api/v1/goals', undefined, other)).toEqual([]);
    expect(() => store.request('GET', path, undefined, other)).toThrow(
      expect.objectContaining({ status: 404, code: 70001 }),
    );
    store.transferOwnership(owner.ownerId, other.ownerId);
    expect(store.request('GET', path, undefined, other)).toMatchObject({ id: goal.id });
    expect(() => store.request('GET', path, undefined, owner)).toThrow(
      expect.objectContaining({ status: 404, code: 70001 }),
    );
  });

  it('rejects invalid dates, missing titles and unowned legacy links without creating records', () => {
    for (const body of [
      { title: '공부', targetDate: '2026-02-30' },
      { title: '공부', linkedDdayGoalId: 32 },
      { motivationText: '기회 만들기' },
    ]) {
      expect(() => create(body)).toThrow(expect.objectContaining({ status: 400, code: 10001 }));
    }
    expect(store.request('GET', '/api/v1/goals', undefined, owner)).toEqual([]);
  });

  it('allows achievement cancellation but keeps archive terminal and content version unchanged', () => {
    const goal = create();
    const path = `/api/v1/goals/${goal.id}`;
    expect(store.request('POST', `${path}/achievement`, undefined, owner)).toMatchObject({
      status: 'ACHIEVED',
      currentVersion: 1,
      achievedAt: expect.any(String),
    });
    expect(store.request('DELETE', `${path}/achievement`, undefined, owner)).toMatchObject({
      status: 'ACTIVE',
      achievedAt: null,
    });
    store.request('PATCH', `${path}/status`, { status: 'ARCHIVED' }, owner);
    expect(store.request('PATCH', `${path}/status`, { status: 'ACTIVE' }, owner)).toMatchObject({
      status: 'ARCHIVED',
      currentVersion: 1,
    });
    expect(() => store.request('PATCH', path, { title: '수정' }, owner)).toThrow(
      expect.objectContaining({ status: 400 }),
    );
  });

  it('does not advertise hard deletion, D-Day routes or unfinished Plan/Journey support', () => {
    expect(store.handles('DELETE', '/api/v1/goals/1')).toBe(false);
    expect(store.handles('GET', '/api/v1/dday-goals')).toBe(false);
    expect(store.handles('GET', '/api/v1/goals/1/plans')).toBe(false);
    expect(store.handles('GET', '/api/v1/goals/1/journey')).toBe(false);
  });
});
