import type { GoalPlanResponse } from '@/types';

import { buildGoalPlanRequest, initialGoalPlanValues } from '../goal-plan-form-values';

const original: GoalPlanResponse = {
  id: 9,
  goalId: 7,
  currentVersion: 3,
  status: 'ACTIVE',
  name: '단어 복습',
  triggerText: '식사 후',
  schedule: {
    startDate: '2026-10-01',
    days: ['MO', 'FR'],
    timeZone: 'America/New_York',
    notifyAtTime: '08:30:15',
  },
  standardAction: { text: '30개 외우기', targetAmount: '30개', estimatedMinutes: 25 },
  minimumAction: { text: '3개 읽기', targetAmount: '3개', estimatedMinutes: 2 },
  nextAction: '어제 단어부터',
  createdAt: '2026-10-01T10:00:00',
  updatedAt: null,
  archivedAt: null,
};
describe('Plan full-content request', () => {
  it('preserves the owned Goal, original start date, timezone, notification precision and quantities on editing', () => {
    const values = initialGoalPlanValues('2026-10-19', original);
    const request = buildGoalPlanRequest({ ...values, name: '아침 단어 복습' }, 7, original);
    expect(request).toMatchObject({
      goalId: 7,
      effectiveFromDate: '2026-10-19',
      schedule: original.schedule,
      standardAction: original.standardAction,
      minimumAction: original.minimumAction,
      nextAction: original.nextAction,
    });
  });
  it('makes optional clears explicit and does not invent a notification or time quantity for creation', () => {
    const values = {
      ...initialGoalPlanValues('2026-10-19'),
      name: '복습',
      standard: '30개',
      minimum: '3개',
    };
    expect(buildGoalPlanRequest(values, 7)).toMatchObject({
      goalId: 7,
      triggerText: null,
      schedule: { notifyAtTime: null, timeZone: 'Asia/Seoul' },
      standardAction: { targetAmount: null, estimatedMinutes: null },
      nextAction: null,
    });
    const edit = initialGoalPlanValues('2026-10-19', original);
    expect(
      buildGoalPlanRequest(
        { ...edit, nextAction: '', minimumAmount: '', minimumMinutes: '' },
        7,
        original,
      ),
    ).toMatchObject({
      nextAction: null,
      minimumAction: { targetAmount: null, estimatedMinutes: null },
    });
  });
  it.each([
    { days: [] },
    { startDate: '2026-02-30' },
    { effectiveFromDate: '2026-02-30' },
    { standardMinutes: '1.5' },
    { minimumMinutes: '0' },
    { standardMinutes: '1441' },
    { minimum: ' ' },
  ])('rejects invalid content before saving: %j', (patch) => {
    expect(() =>
      buildGoalPlanRequest(
        { ...initialGoalPlanValues('2026-10-19', original), ...patch },
        7,
        original,
      ),
    ).toThrow();
  });
});
