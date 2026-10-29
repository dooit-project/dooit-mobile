import React from 'react';
import { Switch, TextInput } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { Button } from '@/components/ui';
import type { RecurrenceEditScope, TaskResponse } from '@/types';
import { TaskScheduleForm } from '../task-schedule-form';

jest.mock('@/theme', () => {
  const actual = jest.requireActual('@/theme');
  return { ...actual, useAppTheme: () => actual.lightTheme };
});
const task = {
  id: 4,
  title: '토익 접수',
  description: '보존할 내용',
  type: 'SCHEDULE',
  allDay: false,
  startAt: '2026-10-27T14:00:00',
  endAt: '2026-10-27T14:30:00',
  notificationEnabled: false,
} as TaskResponse;
let screen: ReactTestRenderer;
beforeEach(() => jest.useFakeTimers());
afterEach(() => {
  act(() => {
    screen?.unmount();
    jest.runOnlyPendingTimers();
  });
  jest.useRealTimers();
});
function mount() {
  const cancel = jest.fn(),
    submit = jest.fn(),
    report = jest.fn();
  const render = (scope: RecurrenceEditScope = 'THIS') => (
    <TaskScheduleForm
      task={task}
      scope={scope}
      onCancel={cancel}
      onSubmit={submit}
      onDraftChange={report}
    />
  );
  act(() => {
    screen = create(render());
  });
  return {
    cancel,
    submit,
    report,
    scope: (scope: RecurrenceEditScope) => act(() => screen.update(render(scope))),
  };
}
const input = (name: string) =>
  screen.root.findAllByType(TextInput).find((item) => item.props.accessibilityLabel === name)!;
const change = (name: string, value: string) => act(() => input(name).props.onChangeText(value));
const save = () =>
  act(() =>
    screen.root
      .findAllByType(Button)
      .find((item) => item.props.children === '변경 완료')!
      .props.onPress(),
  );

test('변경하지 않은 저장은 API 요청 없이 상세로 복귀하고 원문 복원도 dirty를 해제한다', () => {
  const { submit, cancel, report } = mount();
  change('일정 시작 시간', '15:00');
  expect(report).toHaveBeenLastCalledWith(true);
  change('일정 시작 시간', '14:00');
  expect(report).toHaveBeenLastCalledWith(false);
  save();
  expect(cancel).toHaveBeenCalledTimes(1);
  expect(submit).not.toHaveBeenCalled();
});

test('잘못된 날짜를 고친 후 원문과 알림 off를 보존해 제출한다', () => {
  const { submit } = mount();
  change('일정 날짜', '2026-02-30');
  save();
  expect(input('일정 날짜').props['aria-invalid']).toBe(true);
  expect(submit).not.toHaveBeenCalled();
  change('일정 날짜', '2026-10-29');
  save();
  expect(submit).toHaveBeenLastCalledWith(
    expect.objectContaining({
      description: '보존할 내용',
      notificationEnabled: false,
      startAt: '2026-10-29T14:00:00',
    }),
  );
});

test('반복 묶음 범위에서는 회차 날짜를 사용하고 이번만으로 돌아오면 날짜 초안을 복원한다', () => {
  const { scope, submit } = mount();
  change('일정 날짜', '2026-10-29');
  scope('THIS_AND_FUTURE');
  expect(input('일정 날짜').props.editable).toBe(false);
  expect(input('일정 날짜').props.value).toBe('2026-10-27');
  change('일정 시작 시간', '13:00');
  save();
  expect(submit).toHaveBeenLastCalledWith(
    expect.objectContaining({ startAt: '2026-10-27T13:00:00' }),
  );
  scope('THIS');
  expect(input('일정 날짜').props.value).toBe('2026-10-29');
});

test('종일 전환은 시각 초안을 보존하고 다시 시간 일정으로 돌아오면 복원한다', () => {
  const { submit } = mount();
  act(() => screen.root.findByType(Switch).props.onValueChange(true));
  save();
  expect(submit).toHaveBeenLastCalledWith(
    expect.objectContaining({ allDay: true, endAt: '2026-10-28T00:00:00' }),
  );
  act(() => screen.root.findByType(Switch).props.onValueChange(false));
  expect(input('일정 시작 시간').props.value).toBe('14:00');
  expect(input('일정 종료 시간').props.value).toBe('14:30');
});
