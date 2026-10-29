import { mockApiClient } from '@/services/api/mock-api-client';
import type { TaskResponse, TaskUpsertRequest } from '@/types';
import { buildTaskScheduleUpdate } from '../task-schedule-update';

const original = {
  title: '일정 날짜 변경',
  type: 'SCHEDULE',
  allDay: false,
  startAt: '2026-10-27T14:00:00',
  endAt: '2026-10-27T14:30:00',
  description: '보존할 설명',
  category: '학습',
  notificationEnabled: false,
};
async function createTask(extra = {}) {
  return mockApiClient.post<TaskResponse>('/api/v1/tasks', { ...original, ...extra });
}
function request(task: TaskResponse): TaskUpsertRequest {
  const result = buildTaskScheduleUpdate(task, {
    date: '2026-10-29',
    startTime: '16:00',
    endTime: '16:30',
    allDay: false,
  });
  if (!result.ok) throw new Error(result.message);
  return result.request;
}

test('하나의 PUT으로 일정과 목록 날짜가 함께 이동하고 예전 날짜에서 제거된다', async () => {
  const task = await createTask();
  const updated = await mockApiClient.put<TaskResponse>(`/api/v1/tasks/${task.id}`, request(task));
  expect(updated).toMatchObject({
    plannedDate: '2026-10-29',
    targetDate: '2026-10-29',
    startAt: '2026-10-29T16:00:00',
    description: original.description,
    category: '학습',
    notificationEnabled: false,
  });
  const old = await mockApiClient.get<TaskResponse[]>('/api/v1/tasks/today', {
    query: { date: '2026-10-27' },
  });
  const next = await mockApiClient.get<TaskResponse[]>('/api/v1/tasks/today', {
    query: { date: '2026-10-29' },
  });
  expect(old.some((item) => item.id === task.id)).toBe(false);
  expect(next.some((item) => item.id === task.id)).toBe(true);
});

test('완료 항목의 과거 목록 날짜와 완료 시각을 보존한다', async () => {
  const task = await createTask();
  const done = await mockApiClient.patch<TaskResponse>(`/api/v1/tasks/${task.id}/done`);
  expect(await mockApiClient.put(`/api/v1/tasks/${task.id}`, request(done))).toMatchObject({
    status: 'DONE',
    plannedDate: done.plannedDate,
    completedAt: done.completedAt,
  });
});

test('시각 없는 오늘 할 일의 제목 수정은 기존 목록 날짜와 상태를 보존한다', async () => {
  const task = await createTask({ type: 'TODO', startAt: null, endAt: null });
  await mockApiClient.patch(`/api/v1/tasks/${task.id}/today`, undefined, {
    query: { date: '2026-10-27' },
  });
  expect(
    await mockApiClient.put(`/api/v1/tasks/${task.id}`, {
      title: '제목 수정',
      type: 'TODO',
      allDay: false,
    }),
  ).toMatchObject({ status: 'TODAY', plannedDate: '2026-10-27' });
});

test('이번만 수정은 반복 규칙을 보존하고 수정 예외로 남긴다', async () => {
  const task = await createTask({
    recurrence: {
      frequency: 'WEEKLY',
      interval: 2,
      recurrenceRule: 'FREQ=WEEKLY;INTERVAL=2;BYDAY=TU',
      timeZone: 'Asia/Seoul',
    },
  });
  expect(
    await mockApiClient.put(`/api/v1/tasks/${task.id}`, request(task), {
      query: { recurrenceScope: 'THIS' },
    }),
  ).toMatchObject({
    recurrence: task.recurrence,
    recurrenceSeriesId: task.recurrenceSeriesId,
    recurrenceException: 'MODIFIED',
    occurrenceDate: task.occurrenceDate,
    plannedDate: '2026-10-29',
  });
});

test('반복 범위 수정은 각 회차 날짜를 유지하고 시각을 수정한다', async () => {
  const task = await createTask({ recurrence: { frequency: 'WEEKLY' } });
  expect(
    await mockApiClient.put(`/api/v1/tasks/${task.id}`, request(task), {
      query: { recurrenceScope: 'THIS_AND_FUTURE' },
    }),
  ).toMatchObject({
    recurrence: task.recurrence,
    startAt: '2026-10-27T16:00:00',
    endAt: '2026-10-27T16:30:00',
    plannedDate: '2026-10-27',
  });
});
