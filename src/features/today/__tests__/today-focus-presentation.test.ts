import type { TaskResponse } from '@/types';

import { getTodayFocusDateLabel, getTodayFocusMetadata } from '../today-focus-presentation';

const task = {
  id: 1,
  title: '회의 자료 정리',
  description: '핵심 결정만 남기기',
  category: '업무',
} as TaskResponse;

describe('today focus presentation', () => {
  test('날짜를 한국어 요일과 함께 표시한다', () => {
    expect(getTodayFocusDateLabel('2026-09-01')).toBe('2026년 9월 1일 화요일');
  });

  test('Task 보조 정보를 짧게 연결한다', () => {
    expect(getTodayFocusMetadata(task)).toBe('업무 · 핵심 결정만 남기기');
    expect(getTodayFocusMetadata({ ...task, category: null, description: null })).toBe('');
  });
});
