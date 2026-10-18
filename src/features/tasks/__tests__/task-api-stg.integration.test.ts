/// <reference types="node" />
import http from 'node:http';

import { taskApi } from '@/features/tasks/task-api';
import { getQuickCaptureResultMessage } from '@/features/tasks/quick-capture-presentation';
import { apiClient } from '@/services/api/api-client';
import type { TaskQuickCaptureResponse, TokenResponse } from '@/types';

let mockToken: string | null = null;
jest.mock('@/config', () => ({
  env: { apiMode: 'real', apiUrl: 'http://127.0.0.1:18080' },
  requireApiUrl: () => 'http://127.0.0.1:18080',
}));
jest.mock('expo-crypto', () => ({
  randomUUID: () => jest.requireActual('node:crypto').randomUUID(),
}));
jest.mock('@/services/api', () => ({
  apiClient: jest.requireActual('@/services/api/api-client').apiClient,
}));
jest.mock('@/services/api/mock-api-client', () => ({ mockApiClient: {} }));
jest.mock('@/services/api/auth-token-store', () => ({
  getAccessToken: () => mockToken,
  getAccessTokenExpiresAt: () => null,
  getRefreshToken: () => null,
  getAuthAccountType: () => 'GUEST',
  clearSessionCredential: jest.fn(),
}));
jest.mock('@/services/api/auth-session', () => ({ notifySessionExpired: jest.fn() }));

const describeStg = process.env.DOOIT_STG_INTEGRATION === '1' ? describe : describe.skip;

describeStg('실제 모바일 API client와 고정 localhost STG 연동', () => {
  const originalFetch = globalThis.fetch;
  const created = new Set<number>();

  beforeAll(() => {
    // Only replace native transport; the app's real apiClient/taskApi still handle
    // headers, envelope, errors and idempotency. No browser or UI automation.
    globalThis.fetch = (input, options = {}) =>
      new Promise((resolve, reject) => {
        const target = String(input);
        if (!target.startsWith('http://127.0.0.1:18080/')) {
          reject(new Error('STG integration refuses non-STG destinations'));
          return;
        }
        const connection = http.request(
          target,
          {
            method: options.method,
            headers: Object.fromEntries(new Headers(options.headers).entries()),
          },
          (response) => {
            const chunks: Buffer[] = [];
            response.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
            response.on('end', () =>
              resolve({
                status: response.statusCode,
                ok: (response.statusCode ?? 500) >= 200 && (response.statusCode ?? 500) < 300,
                headers: new Headers(response.headers as Record<string, string>),
                text: async () => Buffer.concat(chunks).toString(),
              } as Response),
            );
          },
        );
        connection.on('error', reject);
        options.signal?.addEventListener('abort', () => connection.destroy(new Error('aborted')));
        if (typeof options.body === 'string') connection.write(options.body);
        connection.end();
      });
  });

  afterAll(async () => {
    try {
      if (mockToken) {
        for (const id of created) await taskApi.delete(id, 'ALL');
        await apiClient.post('/api/v1/auth/logout');
      }
    } finally {
      mockToken = null;
      globalThis.fetch = originalFetch;
    }
  });

  test('TODO 날짜·미래 목록 분리·IDEA·기존 자동·오류·동일 요청 재시도를 연결한다', async () => {
    const auth = await apiClient.post<TokenResponse>('/api/v1/auth/guest');
    mockToken = auth.accessToken;
    const capture = async (text: string, requestedType?: 'TODO' | 'SCHEDULE' | 'IDEA') => {
      const response = await taskApi.quickCapture({
        text,
        requestedType,
        referenceDate: '2026-10-18',
        timeZone: 'Asia/Seoul',
      });
      created.add(response.task.id);
      return response;
    };
    const today = await capture('오늘 로그인 버튼 연결하기', 'TODO');
    expect(today.task).toMatchObject({
      type: 'TODO',
      plannedDate: '2026-10-18',
      startAt: null,
      allDay: false,
      unscheduled: true,
    });
    expect(getQuickCaptureResultMessage(today, '2026-10-18')).toBe('오늘 할 일에 저장했어요.');
    const tomorrow = await capture('내일 영단어 30개', 'TODO');
    expect(getQuickCaptureResultMessage(tomorrow, '2026-10-18')).toContain(
      '2026년 10월 19일 할 일',
    );
    const list = await taskApi.getToday('2026-10-18');
    expect(list.map((task) => task.id)).not.toContain(tomorrow.task.id);
    const idea = await capture('내일 오후 3시 아이디어', 'IDEA');
    expect(idea.task).toMatchObject({
      type: 'IDEA',
      status: 'INBOX',
      title: '내일 오후 3시 아이디어',
    });
    const legacy = await capture('내일 회의');
    expect(legacy.task).toMatchObject({ type: 'SCHEDULE', allDay: true });
    await expect(capture('내일 오후 3시 공부', 'TODO')).rejects.toMatchObject({
      status: 400,
      code: 10001,
    });
    const key = 'mobile-stg-' + Date.now();
    const body = { text: '내일 재시도 검증', requestedType: 'TODO', referenceDate: '2026-10-18' };
    const first = await apiClient.post<TaskQuickCaptureResponse>(
      '/api/v1/tasks/quick-capture',
      body,
      { idempotencyKey: key },
    );
    created.add(first.task.id);
    const replay = await apiClient.post<TaskQuickCaptureResponse>(
      '/api/v1/tasks/quick-capture',
      body,
      { idempotencyKey: key },
    );
    expect(replay).toEqual(first);
  }, 30_000);
});
