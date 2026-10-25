import { useEffect, useLayoutEffect, useRef, type ComponentRef, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { sizes, spacing, useAppTheme, useMobileLayout } from '@/theme';

let openingControl: HTMLElement | null = null;

/** Capture the initiating control before the navigator hides its screen and blurs it. */
export function useDetailSheetTriggerTracking() {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const remember = (event: Event) => {
      if (!(event.target instanceof Element) || event.target.closest('[role="dialog"]')) return;
      if (event instanceof KeyboardEvent && !['Enter', ' '].includes(event.key)) return;
      openingControl = event.target.closest<HTMLElement>('button, [role="button"]');
    };
    document.addEventListener('pointerdown', remember, true);
    document.addEventListener('keydown', remember, true);
    return () => {
      document.removeEventListener('pointerdown', remember, true);
      document.removeEventListener('keydown', remember, true);
      openingControl = null;
    };
  }, []);
}

/** A route overlay. Navigation keeps the previous screen mounted behind this view. */
export function DetailSheet({
  children,
  header,
  notice,
  overlay,
  label,
  onClose,
  expanded = false,
  returnFocusLabel,
  modalActive = false,
}: {
  children: ReactNode;
  header: ReactNode;
  notice?: ReactNode;
  overlay?: ReactNode;
  label: string;
  onClose: () => void;
  expanded?: boolean;
  returnFocusLabel?: string;
  modalActive?: boolean;
}) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { screenPadding } = useMobileLayout();
  const dialogRef = useRef<ComponentRef<typeof View>>(null);
  const closeRef = useRef(onClose);
  const modalActiveRef = useRef(modalActive);
  const returnLabelRef = useRef(returnFocusLabel);
  useLayoutEffect(() => {
    closeRef.current = onClose;
    modalActiveRef.current = modalActive;
    returnLabelRef.current = returnFocusLabel;
  }, [onClose, returnFocusLabel, modalActive]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const dialog = dialogRef.current as unknown as HTMLElement | null;
    if (!dialog) return;
    const previous = openingControl ?? (document.activeElement as HTMLElement | null);
    openingControl = null;
    const siblings: { element: HTMLElement; inert: boolean }[] = [];
    // Keep the route background visible, but remove it from keyboard/assistive navigation.
    for (let node: HTMLElement | null = dialog; node?.parentElement; node = node.parentElement) {
      for (const child of node.parentElement.children) {
        if (child !== node && child instanceof HTMLElement) {
          siblings.push({ element: child, inert: child.inert });
          child.inert = true;
        }
      }
    }
    const focusable = () =>
      [
        ...dialog.querySelectorAll<HTMLElement>(
          'button, input, textarea, [tabindex="0"], [role="button"], [role="checkbox"]',
        ),
      ].filter(
        (element) =>
          !element.closest('[inert], [aria-hidden="true"]') &&
          element.getAttribute('aria-disabled') !== 'true' &&
          !element.hasAttribute('disabled') &&
          element.getClientRects().length > 0,
      );
    const focusFirst = () => {
      const close = dialog.querySelector<HTMLElement>('[aria-label="할 일 상세 닫기"]');
      (close ?? focusable()[0] ?? dialog).focus();
    };
    const frame = requestAnimationFrame(focusFirst);
    const onKeyDown = (event: KeyboardEvent) => {
      // An active menu owns its first Escape and keyboard navigation.
      if (modalActiveRef.current || event.defaultPrevented || dialog.querySelector('[role="menu"]'))
        return;
      if (event.key === 'Escape') {
        event.preventDefault();
        closeRef.current();
      } else if (event.key === 'Tab') {
        const elements = focusable();
        const index = elements.indexOf(document.activeElement as HTMLElement);
        if (!elements.length) {
          event.preventDefault();
          dialog.focus();
        } else if (
          (event.shiftKey && index <= 0) ||
          (!event.shiftKey && index === elements.length - 1)
        ) {
          event.preventDefault();
          elements[event.shiftKey ? elements.length - 1 : 0].focus();
        }
      }
    };
    const containFocus = (event: FocusEvent) => {
      if (!modalActiveRef.current && event.target instanceof Node && !dialog.contains(event.target))
        focusFirst();
    };
    // RN Web TextInput stops key bubbling; capture also covers Escape/Tab while typing.
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('focusin', containFocus);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('focusin', containFocus);
      siblings.forEach(({ element, inert }) => {
        element.inert = inert;
      });
      // The stack can reveal its previous screen after this route unmounts.
      const restore = (remaining: number) => {
        const available = (element: HTMLElement) =>
          element.isConnected &&
          !element.closest('[inert], [aria-hidden="true"]') &&
          element.getClientRects().length > 0;
        const original =
          previous && previous !== document.body && available(previous) ? previous : null;
        const matching = returnLabelRef.current
          ? [...document.querySelectorAll<HTMLElement>('[aria-label]')].find((element) => {
              const label = element.getAttribute('aria-label') ?? '';
              return (
                label.startsWith(returnLabelRef.current!) &&
                label.endsWith('상세 보기') &&
                available(element)
              );
            })
          : null;
        const target = original ?? matching;
        if (target) target.focus();
        else if (remaining > 0) requestAnimationFrame(() => restore(remaining - 1));
      };
      requestAnimationFrame(() => restore(30));
    };
  }, []);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.overlay}
    >
      <Pressable
        accessible={false}
        importantForAccessibility="no"
        onPress={onClose}
        style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.overlay }]}
      />
      <View
        ref={dialogRef}
        accessibilityLabel={label}
        accessibilityViewIsModal
        role={Platform.OS === 'web' ? 'dialog' : undefined}
        aria-modal={Platform.OS === 'web' ? true : undefined}
        style={[
          styles.sheet,
          {
            backgroundColor: theme.colors.surface,
            marginTop: Math.max(insets.top, spacing[2]),
            height: expanded ? '96%' : '84%',
          },
        ]}
      >
        <View
          accessible={false}
          style={[styles.handle, { backgroundColor: theme.colors.border }]}
        />
        <View style={{ paddingHorizontal: screenPadding }}>{header}</View>
        {notice ? (
          <View style={{ paddingHorizontal: screenPadding, paddingTop: spacing[2] }}>{notice}</View>
        ) : null}
        <ScrollView
          automaticallyAdjustKeyboardInsets
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={{
            paddingHorizontal: screenPadding,
            paddingTop: spacing[2],
            paddingBottom: Math.max(insets.bottom, spacing[6]),
          }}
        >
          {children}
        </ScrollView>
        {overlay}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  sheet: {
    width: '100%',
    maxWidth: sizes.contentMaxWidth,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
    flexShrink: 1,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing[2],
    marginBottom: spacing[2],
  },
});
