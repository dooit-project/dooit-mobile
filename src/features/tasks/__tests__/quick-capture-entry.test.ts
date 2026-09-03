import { isQuickCaptureEntry } from '@/features/tasks/quick-capture-entry';

describe('isQuickCaptureEntry', () => {
  it('quickCapture=1일 때만 제목 입력 초점을 요청한다', () => {
    expect(isQuickCaptureEntry('1')).toBe(true);
    expect(isQuickCaptureEntry(['1', '0'])).toBe(true);
    expect(isQuickCaptureEntry('0')).toBe(false);
    expect(isQuickCaptureEntry(undefined)).toBe(false);
  });
});
