import { useEffect } from 'react';
import { Platform } from 'react-native';

/** Native route removal is guarded separately by usePreventRemove. */
export function useTaskUnloadProtection(protect: boolean) {
  useEffect(() => {
    if (Platform.OS !== 'web' || !protect) return;
    const protectDraft = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', protectDraft);
    return () => window.removeEventListener('beforeunload', protectDraft);
  }, [protect]);
}
