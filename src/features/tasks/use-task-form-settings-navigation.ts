import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  Platform,
  ScrollView,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import type { TaskFormHandle } from './task-form';

/** Child settings share the editor route, while retaining its scroll position and draft. */
export function useTaskFormSettingsNavigation() {
  const formRef = useRef<TaskFormHandle>(null);
  const scrollRef = useRef<ScrollView>(null);
  const offset = useRef(0);
  const savedOffset = useRef(0);
  const openRef = useRef(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!openRef.current) offset.current = event.nativeEvent.contentOffset.y;
  }, []);
  const onSettingsChange = useCallback((open: boolean) => {
    if (open) savedOffset.current = offset.current;
    openRef.current = open;
    setSettingsOpen(open);
  }, []);
  // Navigation API events can commit later than DOM click events. Restore only after
  // the parent form is laid out again, rather than scheduling from the event itself.
  useLayoutEffect(() => {
    const frame = requestAnimationFrame(() =>
      scrollRef.current?.scrollTo({ y: settingsOpen ? 0 : savedOffset.current, animated: false }),
    );
    return () => cancelAnimationFrame(frame);
  }, [settingsOpen]);
  const closeSettings = useCallback(() => formRef.current?.closeSettings() ?? false, []);

  useEffect(() => {
    if (Platform.OS !== 'web' || !settingsOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      event.preventDefault();
      closeSettings();
    };
    const browserNavigation = (window as unknown as { navigation?: EventTarget }).navigation;
    const onNavigate = (event: Event) => {
      const traversal = event as Event & { navigationType: string };
      if (event.defaultPrevented || !event.cancelable || traversal.navigationType !== 'traverse')
        return;
      event.preventDefault();
      closeSettings();
    };
    document.addEventListener('keydown', onKeyDown, true);
    browserNavigation?.addEventListener('navigate', onNavigate);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      browserNavigation?.removeEventListener('navigate', onNavigate);
    };
  }, [closeSettings, settingsOpen]);

  return { formRef, scrollRef, settingsOpen, onScroll, onSettingsChange, closeSettings };
}
