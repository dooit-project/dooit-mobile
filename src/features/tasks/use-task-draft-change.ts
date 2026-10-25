import { useEffect } from 'react';

/** Report real input changes; mode/focus changes are not unsaved input. */
export function useTaskDraftChange(dirty: boolean, onDraftChange?: (dirty: boolean) => void) {
  useEffect(() => {
    onDraftChange?.(dirty);
  }, [dirty, onDraftChange]);
  useEffect(() => () => onDraftChange?.(false), [onDraftChange]);
}
