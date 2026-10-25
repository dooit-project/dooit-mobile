import React from 'react';
import { Switch, TextInput } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';

import type { TaskResponse } from '@/types';
import { TaskForm } from '../task-form';

jest.mock('@/theme', () => {
  const actual = jest.requireActual('@/theme');
  return { ...actual, useAppTheme: () => actual.lightTheme };
});

const task = {
  id: 4,
  title: '토익 시험 접수',
  description: null,
  category: null,
  estimatedDurationMinutes: null,
  type: 'SCHEDULE',
  allDay: false,
  startAt: '2026-10-25T14:00:00',
  endAt: '2026-10-25T14:30:00',
  recurrence: null,
  notificationEnabled: true,
} as TaskResponse;

let screen: ReactTestRenderer;
afterEach(() => {
  act(() => screen?.unmount());
});

function mount(initialTask = task) {
  const report = jest.fn();
  const render = (value: TaskResponse) => (
    <TaskForm
      initialTask={value}
      onDraftChange={report}
      submitLabel="수정 완료"
      onSubmit={jest.fn()}
    />
  );
  act(() => {
    screen = create(render(initialTask));
  });
  const changeText = (label: string, value: string) => {
    const input = screen.root
      .findAllByType(TextInput)
      .find((node) => node.props.accessibilityLabel === label);
    expect(input).toBeDefined();
    act(() => input!.props.onChangeText(value));
  };
  const press = (label: string) => {
    const control = screen.root
      .findAllByProps({ accessibilityLabel: label })
      .find((node) => node.props.onPress);
    expect(control).toBeDefined();
    act(() => control!.props.onPress());
  };
  return { report, render, changeText, press };
}

test('수정 진입·초점·추가 정보 펼침은 초안이 아니며 제목을 원문으로 복원하면 해제한다', () => {
  const { report, changeText, press } = mount();
  expect(report.mock.calls).toEqual([[false]]);
  press('알림·반복·추가 정보 보기');
  const title = screen.root
    .findAllByType(TextInput)
    .find((node) => node.props.accessibilityLabel === 'Task 제목')!;
  act(() => title.props.onFocus());
  expect(report.mock.calls).toEqual([[false]]);
  changeText('Task 제목', '다른 제목');
  changeText('Task 제목', '한 번 더 수정');
  expect(report.mock.calls).toEqual([[false], [true]]);
  changeText('Task 제목', task.title);
  expect(report.mock.calls).toEqual([[false], [true], [false]]);
});

test.each([
  ['Task 제목', '', task.title],
  ['일정 날짜', '잘못된 날짜', '2026-10-25'],
  ['일정 시작 시간', '', '14:00'],
  ['일정 종료 시간', '15:00', '14:30'],
  ['Task 설명', '접수 준비', ''],
  ['Task 카테고리', '공부', ''],
  ['예상 소요 시간(분)', '아직 미정', ''],
])('유효하지 않은 입력을 포함해 %s의 실제 변경과 복원을 보호한다', (label, value, original) => {
  const { report, changeText, press } = mount();
  press('알림·반복·추가 정보 보기');
  changeText(label, value);
  expect(report).toHaveBeenLastCalledWith(true);
  changeText(label, original);
  expect(report).toHaveBeenLastCalledWith(false);
});

test('유형·알림·반복 설정도 변경과 원상 복원을 감지한다', () => {
  const { report, press } = mount();
  press('할 일 유형 선택');
  expect(report).toHaveBeenLastCalledWith(true);
  press('일정 유형 선택');
  expect(report).toHaveBeenLastCalledWith(false);
  press('알림·반복·추가 정보 보기');
  press('알림 끄기 알림 선택');
  expect(report).toHaveBeenLastCalledWith(true);
  press('시작 시각 알림 선택');
  expect(report).toHaveBeenLastCalledWith(false);
  press('매일 선택');
  expect(report).toHaveBeenLastCalledWith(true);
  press('반복 없음 선택');
  expect(report).toHaveBeenLastCalledWith(false);
});

test('조회 응답 갱신이 입력값이나 편집 시작 당시 비교 기준을 덮지 않는다', () => {
  const { report, render, changeText } = mount();
  changeText('Task 제목', '작성 중인 제목');
  act(() => screen.update(render({ ...task, title: '작성 중인 제목' })));
  expect(report).toHaveBeenLastCalledWith(true);
  changeText('Task 제목', task.title);
  expect(report).toHaveBeenLastCalledWith(false);
});

test('종일 여부와 직접 반복 간격의 유효하지 않은 입력도 비교하고 복원한다', () => {
  const { report, press, changeText } = mount({
    ...task,
    recurrence: { frequency: 'WEEKLY', interval: 2 },
  } as TaskResponse);
  act(() => screen.root.findByType(Switch).props.onValueChange(true));
  expect(report).toHaveBeenLastCalledWith(true);
  act(() => screen.root.findByType(Switch).props.onValueChange(false));
  expect(report).toHaveBeenLastCalledWith(false);
  changeText('반복 간격', '잘못된 간격');
  expect(report).toHaveBeenLastCalledWith(true);
  changeText('반복 간격', '2');
  expect(report).toHaveBeenLastCalledWith(false);
  press('추가 정보 접기');
  expect(report).toHaveBeenLastCalledWith(false);
});

test('폼을 닫으면 부모의 초안 상태를 해제한다', () => {
  const { report, changeText } = mount();
  changeText('Task 제목', '아직 저장하지 않은 제목');
  expect(report).toHaveBeenLastCalledWith(true);
  act(() => screen.unmount());
  expect(report).toHaveBeenLastCalledWith(false);
});
