import type {
  GoalDirectLogResponse,
  GoalJourneyItem,
  GoalJourneyResponse,
  GoalJourneySummary,
  GoalPlanOccurrenceResponse,
  GoalPlanResponse,
  GoalResponse,
  TaskResponse,
} from '@/types';
import { parseApiLocalDate } from '@/utils';

import { ApiClientError } from './api-error';
import { mockGoalInstant, mockGoalToday, mockGoalWallTime } from './mock-goal-clock';
import type { MockGoalPlanVersion } from './mock-goal-plan-store';

type Query = Record<string, string | number | boolean | null | undefined>;
type Dependencies = {
  goal: (goalId: number, ownerId: number) => GoalResponse;
  goalVersion: (goalId: number, ownerId: number, version: number) => GoalResponse;
  logs: (ownerId: number, goalId: number) => GoalDirectLogResponse[];
  occurrences: (ownerId: number, goalId: number) => GoalPlanOccurrenceResponse[];
  plans: (ownerId: number) => { plan: GoalPlanResponse; versions: MockGoalPlanVersion[] }[];
  tasks: (ownerId: number) => TaskResponse[];
  isOccurrenceTask: (taskId: number, ownerId: number) => boolean;
};
type Cursor = { scope: string; fingerprint: string; last: string };
function invalid(): never {
  throw new ApiClientError('여정 조회 범위와 cursor를 확인해 주세요.', {
    kind: 'http',
    status: 400,
    code: 10001,
  });
}
const identity = (item: GoalJourneyItem) =>
  `${item.practicedDate}:${item.sourceType}:${item.sourceId}`;

/** Opaque in-memory cursors emulate scope/version semantics, not the server's encoding. */
export function createMockGoalJourneyStore(deps: Dependencies) {
  let sequence = 1;
  const cursors = new Map<string, Cursor>();
  const versions = new Map<string, { fingerprint: string; version: string }>();
  return {
    get(goalId: number, ownerId: number, query: Query): GoalJourneyResponse {
      const from = String(query.from ?? ''),
        to = String(query.to ?? '');
      const timeZone = String(query.timeZone ?? '').trim() || 'Asia/Seoul';
      const limit = query.limit == null ? 50 : Number(query.limit);
      if (
        !parseApiLocalDate(from) ||
        !parseApiLocalDate(to) ||
        from > to ||
        !Number.isInteger(limit) ||
        limit < 1 ||
        limit > 100
      )
        invalid();
      try {
        new Intl.DateTimeFormat('en', { timeZone });
      } catch {
        invalid();
      }
      const goal = deps.goal(goalId, ownerId);
      const range = { from, to, timeZone };
      const scope = JSON.stringify([ownerId, goalId, range]);
      const token = String(query.cursor ?? '').trim();
      const cursor = token ? cursors.get(token) : undefined;
      if (token && (!cursor || token.length > 2048 || cursor.scope !== scope)) invalid();
      const within = (date: string) => from <= date && date <= to;
      const occurrences = deps.occurrences(ownerId, goalId);
      const items: GoalJourneyItem[] = [];
      for (const o of occurrences) {
        const r = o.result;
        if (!r) continue;
        const practicedDate = mockGoalWallTime(
          mockGoalInstant(r.practicedAt, r.practicedTimeZone),
          timeZone,
        ).slice(0, 10);
        if (!within(practicedDate)) continue;
        items.push({
          sourceType: 'PLAN_OCCURRENCE',
          sourceId: o.id,
          practicedDate,
          goalId,
          goalVersion: o.goalVersion,
          planId: o.planId,
          planVersion: o.planVersion,
          title: o.snapshotPlanName,
          actionText:
            r.actionVariant === 'STANDARD'
              ? o.snapshotStandardActionText
              : r.actionVariant === 'MINIMUM'
                ? o.snapshotMinimumActionText
                : null,
          actionVariant: r.actionVariant,
          note: r.accomplishedNote,
          taskId: o.linkedTaskId,
          serviceDate: o.serviceDate,
          practicedAt: r.practicedAt,
          practicedTimeZone: r.practicedTimeZone,
          snapshotGoalTitle: o.snapshotGoalTitle,
          nextAction:
            r.nextActionPatchKind === 'KEEP'
              ? o.snapshotNextAction
              : r.nextActionPatchKind === 'CLEAR'
                ? null
                : r.nextAction,
          difficulties: [...r.difficulties],
        });
      }
      const completedTasks = deps
        .tasks(ownerId)
        .filter(
          (task) =>
            task.linkedGoalId === goalId &&
            task.status === 'DONE' &&
            task.completedAt &&
            !task.recurrenceSeriesId &&
            !deps.isOccurrenceTask(task.id, ownerId),
        );
      for (const task of completedTasks) {
        const practicedDate = mockGoalWallTime(
          mockGoalInstant(task.completedAt!, 'Asia/Seoul'),
          timeZone,
        ).slice(0, 10);
        if (!within(practicedDate)) continue;
        items.push({
          sourceType: 'TASK_COMPLETION',
          sourceId: task.id,
          practicedDate,
          goalId,
          goalVersion: null,
          planId: null,
          planVersion: null,
          title: task.title,
          actionText: null,
          actionVariant: 'UNKNOWN',
          note: task.description,
          taskId: task.id,
          serviceDate: null,
          practicedAt: task.completedAt,
          practicedTimeZone: 'Asia/Seoul',
          snapshotGoalTitle: null,
          nextAction: null,
          difficulties: [],
        });
      }
      const logs = deps.logs(ownerId, goalId);
      for (const log of logs) {
        if (log.canceledAt || !within(log.practicedDate)) continue;
        items.push({
          sourceType: 'DIRECT_LOG',
          sourceId: log.id,
          practicedDate: log.practicedDate,
          goalId,
          goalVersion: log.goalVersion,
          planId: null,
          planVersion: null,
          title: log.title,
          actionText: null,
          actionVariant: 'UNKNOWN',
          note: log.note,
          taskId: null,
          serviceDate: null,
          practicedAt: null,
          practicedTimeZone: log.practicedTimeZone,
          snapshotGoalTitle: deps.goalVersion(goalId, ownerId, log.goalVersion).title,
          nextAction: null,
          difficulties: [],
        });
      }
      items.sort(
        (a, b) =>
          b.practicedDate.localeCompare(a.practicedDate) ||
          (a.sourceType < b.sourceType ? -1 : a.sourceType > b.sourceType ? 1 : 0) ||
          b.sourceId - a.sourceId,
      );
      const plans = deps.plans(ownerId);
      const rangedOccurrences = occurrences.filter((o) => within(o.serviceDate));
      const visiblePending = (o: GoalPlanOccurrenceResponse) => {
        if (o.status !== 'PENDING') return false;
        if (o.serviceDate < mockGoalToday(o.timeZone)) return true;
        const current = plans.find(({ plan }) => plan.id === o.planId);
        const version = current?.versions
          .filter((entry) => entry.effectiveFromDate <= o.serviceDate)
          .at(-1)?.plan;
        const weekdays = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
        return (
          current?.plan.status === 'ACTIVE' &&
          version &&
          version.goalId === o.goalId &&
          o.serviceDate >= version.schedule.startDate &&
          version.schedule.days.some(
            (day) => day === weekdays[new Date(`${o.serviceDate}T12:00:00Z`).getUTCDay()],
          )
        );
      };
      const count = (source: GoalJourneyItem['sourceType']) =>
        items.filter((i) => i.sourceType === source).length;
      const variant = (value: GoalJourneyItem['actionVariant']) =>
        items.filter((i) => i.actionVariant === value).length;
      const summary: GoalJourneySummary = {
        practiceOccurrenceCount: count('PLAN_OCCURRENCE'),
        oneOffCompletionCount: count('TASK_COMPLETION'),
        directLogCount: count('DIRECT_LOG'),
        practiceDateCount: new Set(items.map((i) => i.practicedDate)).size,
        standardCount: variant('STANDARD'),
        minimumCount: variant('MINIMUM'),
        unknownCount: variant('UNKNOWN'),
        restCount: rangedOccurrences.filter((o) => o.status === 'RESTED').length,
        noRecordOccurrenceCount: rangedOccurrences.filter(visiblePending).length,
      };
      const stamps = rangedOccurrences.map((o) => {
        const plan = plans.find((p) => p.plan.id === o.planId)?.plan;
        return [o.id, o.occurrenceVersion, plan?.currentVersion, plan?.status];
      });
      const resultIds = new Set(
        items.filter((i) => i.sourceType === 'PLAN_OCCURRENCE').map((i) => i.sourceId),
      );
      const taskIds = new Set(
        items.filter((i) => i.sourceType === 'TASK_COMPLETION').map((i) => i.sourceId),
      );
      const sourceStamps = [
        occurrences.filter((o) => resultIds.has(o.id)).map((o) => [o.id, o.occurrenceVersion]),
        completedTasks.filter((t) => taskIds.has(t.id)).map((t) => [t.id, t.updatedAt]),
        logs
          .filter((log) => !log.canceledAt && within(log.practicedDate))
          .map((log) => [log.id, log.updatedAt]),
      ];
      const fingerprint = JSON.stringify([goal, range, summary, items, stamps, sourceStamps]);
      if (cursor && cursor.fingerprint !== fingerprint) {
        throw new ApiClientError('목표 여정이 변경되었어요. 처음부터 다시 조회해 주세요.', {
          kind: 'http',
          status: 409,
          code: 70008,
        });
      }
      let version = versions.get(scope);
      if (!version || version.fingerprint !== fingerprint) {
        version = { fingerprint, version: `mock-goal:${goalId}:${sequence++}` };
        versions.set(scope, version);
      }
      let start = 0;
      if (cursor) {
        const index = items.findIndex((item) => identity(item) === cursor.last);
        if (index < 0) invalid();
        start = index + 1;
      }
      const page = items.slice(start, start + limit);
      let nextCursor: string | null = null;
      if (start + page.length < items.length) {
        nextCursor = `mock-journey:${sequence++}`;
        cursors.set(nextCursor, { scope, fingerprint, last: identity(page[page.length - 1]) });
      }
      return { goalId, range, summary, items: page, nextCursor, journeyVersion: version.version };
    },
  };
}
