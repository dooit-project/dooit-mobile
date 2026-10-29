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

jest.mock('@/components/ui/app-icon', () => ({ AppIcon: () => null }));

beforeEach(() => jest.useFakeTimers());

let screen: ReactTestRenderer;
afterEach(() => {
  act(() => {
    screen?.unmount();
    jest.runOnlyPendingTimers();
  });
  jest.useRealTimers();
});

function mount(initialTask = task) {
  const report = jest.fn();
  const submit = jest.fn();
  const render = (value: TaskResponse) => (
    <TaskForm
      initialTask={value}
      onDraftChange={report}
      submitLabel="수정 완료"
      onSubmit={submit}
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
  return { report, submit, render, changeText, press };
}

function input(label: string) {
  return screen.root
    .findAllByType(TextInput)
    .find((node) => node.props.accessibilityLabel === label)!;
}

test('여러 오류는 화면 순서대로 안내하고 다른 입력을 수정해도 해당 오류는 유지한다', () => {
  const { press, changeText, submit } = mount();
  press('설명·추가 정보 보기');
  changeText('예상 소요 시간(분)', '1');
  changeText('일정 날짜', '2026-02-30');
  changeText('일정 시작 시간', '25:00');
  press('수정 완료');
  expect(input('일정 날짜').props['aria-invalid']).toBe(true);
  expect(input('일정 날짜').props.accessibilityHint).toContain('존재하지 않는 날짜');
  expect(input('예상 소요 시간(분)').props['aria-invalid']).toBeUndefined();
  changeText('Task 설명', '접수 준비');
  expect(input('일정 날짜').props['aria-invalid']).toBe(true);
  changeText('일정 날짜', '2026-10-25');
  expect(input('일정 날짜').props['aria-invalid']).toBeUndefined();
  press('수정 완료');
  expect(input('일정 시작 시간').props['aria-invalid']).toBe(true);
  changeText('일정 시작 시간', '14:00');
  press('수정 완료');
  expect(input('예상 소요 시간(분)').props['aria-invalid']).toBe(true);
  expect(submit).not.toHaveBeenCalled();
});

test('접힌 예상 시간 오류를 펼쳐 안내하고 원문과 다른 입력을 보존한다', () => {
  const { press, changeText, submit } = mount();
  press('설명·추가 정보 보기');
  changeText('Task 설명', '준비물 확인');
  changeText('예상 소요 시간(분)', '1');
  press('추가 정보 접기');
  expect(input('예상 소요 시간(분)')).toBeUndefined();
  press('수정 완료');
  expect(input('예상 소요 시간(분)').props['aria-invalid']).toBe(true);
  expect(input('예상 소요 시간(분)').props.accessibilityHint).toContain('5분 이상 1440분 이하');
  expect(input('Task 설명').props.value).toBe('준비물 확인');
  changeText('예상 소요 시간(분)', '25');
  press('수정 완료');
  expect(submit).toHaveBeenLastCalledWith(
    expect.objectContaining({
      description: '준비물 확인',
      estimatedDurationMinutes: 25,
      startAt: task.startAt,
    }),
  );
});

test('기존 반복 일정의 제목만 수정하면 원래 복합 규칙을 PUT에 재전송하지 않는다', () => {
  const { press, changeText, submit } = mount({
    ...task,
    recurrence: {
      id: 9,
      frequency: 'WEEKLY',
      interval: 2,
      recurrenceRule: 'FREQ=WEEKLY;INTERVAL=2;BYDAY=TU,TH',
      timeZone: 'Asia/Seoul',
      recurrenceStartAt: task.startAt!,
      recurrenceUntil: null,
      recurrenceCount: null,
    },
  });
  changeText('Task 제목', '접수 준비');
  press('수정 완료');
  expect(submit).toHaveBeenLastCalledWith(
    expect.objectContaining({ title: '접수 준비', recurrence: undefined }),
  );
});

test('종료 시각 오류는 관련 시작 시각 수정으로 해제하고 종일 전환 시 숨겨진 시간 오류를 남기지 않는다', () => {
  const { press, changeText, submit } = mount();
  changeText('일정 종료 시간', '13:00');
  press('수정 완료');
  expect(input('일정 종료 시간').props['aria-invalid']).toBe(true);
  changeText('일정 시작 시간', '12:00');
  expect(input('일정 종료 시간').props['aria-invalid']).toBeUndefined();
  changeText('일정 시작 시간', '25:00');
  press('수정 완료');
  expect(input('일정 시작 시간').props['aria-invalid']).toBe(true);
  act(() => screen.root.findByType(Switch).props.onValueChange(true));
  press('수정 완료');
  expect(submit).toHaveBeenLastCalledWith(
    expect.objectContaining({ allDay: true, startAt: '2026-10-25T00:00:00' }),
  );
});

test('수정 진입·초점·추가 정보 펼침은 초안이 아니며 제목을 원문으로 복원하면 해제한다', () => {
  const { report, changeText, press } = mount();
  expect(report.mock.calls).toEqual([[false]]);
  press('설명·추가 정보 보기');
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
  press('설명·추가 정보 보기');
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
  press('알림, 시작 시각, 변경');
  press('알림 끄기 알림 선택');
  expect(report).toHaveBeenLastCalledWith(true);
  press('알림, 알림 끄기, 변경');
  press('시작 시각 알림 선택');
  expect(report).toHaveBeenLastCalledWith(false);
  press('반복, 반복 없음, 변경');
  press('매일 선택');
  expect(report).toHaveBeenLastCalledWith(true);
  press('반복, 매일, 변경');
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
  press('반복, 2주마다, 변경');
  press('직접 설정 선택');
  changeText('반복 간격', '잘못된 간격');
  expect(report).toHaveBeenLastCalledWith(true);
  changeText('반복 간격', '2');
  expect(report).toHaveBeenLastCalledWith(false);
  press('반복으로 돌아가기');
  press('작성 화면으로 돌아가기');
  expect(report).toHaveBeenLastCalledWith(false);
});

test('폼을 닫으면 부모의 초안 상태를 해제한다', () => {
  const { report, changeText } = mount();
  changeText('Task 제목', '아직 저장하지 않은 제목');
  expect(report).toHaveBeenLastCalledWith(true);
  act(() => screen.unmount());
  expect(report).toHaveBeenLastCalledWith(false);
});

test('유형 선택 후 저장 계약과 일정으로 되돌렸을 때의 날짜·시간을 유지한다', () => {
  const submit = jest.fn();
  act(() => {
    screen = create(<TaskForm initialTask={task} submitLabel="수정 완료" onSubmit={submit} />);
  });
  const press = (label: string) => {
    const control = screen.root
      .findAllByProps({ accessibilityLabel: label })
      .find((node) => node.props.onPress)!;
    act(() => control.props.onPress());
  };
  press('아이디어 유형 선택');
  press('수정 완료');
  expect(submit).toHaveBeenLastCalledWith(
    expect.objectContaining({
      title: task.title,
      type: 'IDEA',
      startAt: null,
      endAt: null,
    }),
  );
  press('일정 유형 선택');
  press('수정 완료');
  expect(submit).toHaveBeenLastCalledWith(
    expect.objectContaining({
      title: task.title,
      type: 'SCHEDULE',
      startAt: task.startAt,
      endAt: task.endAt,
    }),
  );
});

test('알림 선택의 저장 값과 종일 전환의 허용 선택·시간 복원을 유지한다', () => {
  const { submit, press } = mount();
  press('알림, 시작 시각, 변경');
  press('15분 전 알림 선택');
  press('수정 완료');
  expect(submit).toHaveBeenLastCalledWith(
    expect.objectContaining({
      notificationEnabled: true,
      notifyAt: '2026-10-25T13:45:00',
    }),
  );
  act(() => screen.root.findByType(Switch).props.onValueChange(true));
  press('알림, 당일 오전 9시, 변경');
  expect(screen.root.findAllByProps({ accessibilityLabel: '15분 전 알림 선택' })).toHaveLength(0);
  const allDayTiming = screen.root
    .findAllByProps({ accessibilityLabel: '당일 오전 9시 알림 선택' })
    .find((node) => node.props.accessibilityRole === 'button')!;
  expect(allDayTiming.props.accessibilityHint).toBe('현재 선택된 값이에요.');
  press('작성 화면으로 돌아가기');
  press('수정 완료');
  expect(submit).toHaveBeenLastCalledWith(
    expect.objectContaining({
      allDay: true,
      notificationEnabled: true,
      notifyAt: null,
    }),
  );
  act(() => screen.root.findByType(Switch).props.onValueChange(false));
  press('알림, 시작 시각, 변경');
  press('알림 끄기 알림 선택');
  press('수정 완료');
  expect(submit).toHaveBeenLastCalledWith(
    expect.objectContaining({
      allDay: false,
      startAt: task.startAt,
      endAt: task.endAt,
      notificationEnabled: false,
      notifyAt: null,
    }),
  );
});

test('직접 반복의 단위·간격 선택을 저장하고 잘못된 간격은 저장하지 않는다', () => {
  const { submit, press, changeText } = mount();
  press('반복, 반복 없음, 변경');
  press('직접 설정 선택');
  press('단위, 주, 변경');
  press('개월 단위 반복 선택');
  changeText('반복 간격', '3');
  press('적용');
  expect(submit).not.toHaveBeenCalled();
  press('수정 완료');
  expect(submit).toHaveBeenLastCalledWith(
    expect.objectContaining({
      recurrence: expect.objectContaining({ frequency: 'MONTHLY', interval: 3 }),
    }),
  );
  submit.mockClear();
  press('반복, 3개월마다, 변경');
  press('직접 설정 선택');
  changeText('반복 간격', '0');
  press('적용');
  expect(submit).not.toHaveBeenCalled();
  press('반복으로 돌아가기');
  press('작성 화면으로 돌아가기');
  press('수정 완료');
  expect(submit).toHaveBeenLastCalledWith(
    expect.objectContaining({
      recurrence: expect.objectContaining({ frequency: 'MONTHLY', interval: 3 }),
    }),
  );
});

test('기본 화면에는 현재 값만 보이고 설정 이동·취소가 다른 입력을 보존한다', () => {
  const { press, report, changeText, submit } = mount();
  expect(screen.root.findAllByProps({ accessibilityLabel: '15분 전 알림 선택' })).toHaveLength(0);
  expect(screen.root.findAllByProps({ accessibilityLabel: '매일 선택' })).toHaveLength(0);
  press('알림, 시작 시각, 변경');
  expect(report).toHaveBeenLastCalledWith(false);
  expect(screen.root.findAllByProps({ accessibilityLabel: '매일 선택' })).toHaveLength(0);
  press('작성 화면으로 돌아가기');
  expect(report).toHaveBeenLastCalledWith(false);
  changeText('Task 제목', '접수 준비');
  changeText('일정 시작 시간', '15:00');
  changeText('일정 종료 시간', '15:30');
  press('반복, 반복 없음, 변경');
  press('직접 설정 선택');
  changeText('반복 간격', '7');
  press('반복으로 돌아가기');
  press('작성 화면으로 돌아가기');
  press('수정 완료');
  expect(submit).toHaveBeenLastCalledWith(
    expect.objectContaining({
      title: '접수 준비',
      startAt: '2026-10-25T15:00:00',
      endAt: '2026-10-25T15:30:00',
      recurrence: undefined,
    }),
  );
});
