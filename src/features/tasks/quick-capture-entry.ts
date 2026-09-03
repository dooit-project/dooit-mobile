export function isQuickCaptureEntry(value: unknown): boolean {
  return value === '1' || (Array.isArray(value) && value[0] === '1');
}
