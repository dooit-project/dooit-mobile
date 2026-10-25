import React from 'react';
import { TextInput } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';

import { Button } from '@/components/ui/button';
import type { TaskChecklistItemResponse } from '@/types';
import { TaskChecklistSection } from '../task-checklist-section';
import { useTaskChecklist } from '../use-task-checklist';

jest.mock('@/theme', () => {
  const actual = jest.requireActual('@/theme');
  return { ...actual, useAppTheme: () => actual.lightTheme };
});
jest.mock('expo-symbols', () => ({ SymbolView: () => null }));
jest.mock('../use-task-checklist', () => {
  const mutation = () => ({ isPending: false, error: null, mutate: jest.fn() });
  return {
    useTaskChecklist: jest.fn(),
    useCreateTaskChecklistItem: mutation,
    useUpdateTaskChecklistItem: mutation,
    useCompleteTaskChecklistItem: mutation,
    useReopenTaskChecklistItem: mutation,
    useDeleteTaskChecklistItem: mutation,
    useReorderTaskChecklistItems: mutation,
  };
});

const item: TaskChecklistItemResponse = {
  id: 1,
  taskId: 4,
  title: '시험 일정 확인',
  done: false,
  sortOrder: 0,
  completedAt: null,
  createdAt: '2026-10-25T09:00:00',
  updatedAt: null,
};
let screen: ReactTestRenderer;
const query = (data: TaskChecklistItemResponse[]) => {
  jest
    .mocked(useTaskChecklist)
    .mockReturnValue({ data, isPending: false, error: null } as ReturnType<
      typeof useTaskChecklist
    >);
};
afterEach(() => act(() => screen?.unmount()));

test('기존 제목 편집은 조회 갱신에 비교 기준을 잃지 않으며 원문 복원 시 해제한다', async () => {
  query([item]);
  const report = jest.fn();
  const render = () => <TaskChecklistSection taskId={4} grouped compact onDraftChange={report} />;
  await act(async () => {
    screen = create(render());
  });
  const press = (label: string) =>
    act(() =>
      screen.root
        .findAllByProps({ accessibilityLabel: label })
        .find((node) => node.props.onPress)!
        .props.onPress(),
    );
  press('시험 일정 확인 항목 행동 열기');
  const edit = screen.root.findAllByType(Button).find((node) => node.props.children === '수정');
  act(() => edit!.props.onPress());
  expect(report).toHaveBeenLastCalledWith(false);
  act(() => screen.root.findByType(TextInput).props.onChangeText('변경한 제목'));
  expect(report).toHaveBeenLastCalledWith(true);
  query([{ ...item, title: '변경한 제목' }]);
  act(() => screen.update(render()));
  expect(report).toHaveBeenLastCalledWith(true);
  act(() => screen.root.findByType(TextInput).props.onChangeText(item.title));
  expect(report).toHaveBeenLastCalledWith(false);
});

test('빈 추가 화면은 보호하지 않고 실제 입력/지우기/닫기를 구분한다', async () => {
  query([]);
  const report = jest.fn();
  await act(async () => {
    screen = create(<TaskChecklistSection taskId={4} grouped compact onDraftChange={report} />);
  });
  const add = screen.root
    .findAllByProps({ accessibilityLabel: '체크리스트 추가' })
    .find((node) => node.props.onPress);
  act(() => add!.props.onPress());
  expect(report).toHaveBeenLastCalledWith(false);
  act(() => screen.root.findByType(TextInput).props.onChangeText('접수 준비'));
  expect(report).toHaveBeenLastCalledWith(true);
  act(() => screen.root.findByType(TextInput).props.onChangeText(''));
  expect(report).toHaveBeenLastCalledWith(false);
  act(() => screen.root.findByType(TextInput).props.onChangeText('남아 있는 입력'));
  act(() => screen.unmount());
  expect(report).toHaveBeenLastCalledWith(false);
});
