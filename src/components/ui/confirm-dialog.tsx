import { useEffect, useId, useRef, useState, type ComponentRef } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { radii, spacing, useAppTheme } from '@/theme';

import { AppText } from './app-text';
import { Button } from './button';
import { focusControl } from './focus-control';

/** A focused decision above an existing screen. Dismissal always keeps the draft. */
export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const titleId = useId();
  const messageId = useId();
  const dialogRef = useRef<ComponentRef<typeof View>>(null);
  const cancelRef = useRef<ComponentRef<typeof Pressable>>(null);
  const confirmRef = useRef<ComponentRef<typeof Pressable>>(null);
  const [shown, setShown] = useState(false);
  const [openingControl] = useState(() =>
    Platform.OS === 'web' && typeof document !== 'undefined'
      ? (document.activeElement as HTMLElement | null)
      : null,
  );
  const restoreFocus = useRef(true);

  useEffect(() => {
    if (!shown) return;
    const frame = requestAnimationFrame(() => focusControl(cancelRef.current));
    if (Platform.OS !== 'web') return () => cancelAnimationFrame(frame);
    const dialog = dialogRef.current as unknown as HTMLElement | null;
    if (!dialog) return () => cancelAnimationFrame(frame);
    const siblings: { element: HTMLElement; inert: boolean }[] = [];
    // A nested route sheet must not remain keyboard/assistive-technology interactive.
    for (let node: HTMLElement | null = dialog; node?.parentElement; node = node.parentElement) {
      for (const child of node.parentElement.children) {
        if (child !== node && child instanceof HTMLElement) {
          siblings.push({ element: child, inert: child.inert });
          child.inert = true;
        }
      }
    }
    const trapTab = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const confirm = confirmRef.current as unknown as HTMLElement | null;
      const cancel = cancelRef.current as unknown as HTMLElement | null;
      if (!confirm || !cancel) return;
      event.preventDefault();
      (document.activeElement === confirm ? cancel : confirm).focus();
    };
    document.addEventListener('keydown', trapTab, true);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', trapTab, true);
      siblings.forEach(({ element, inert }) => {
        element.inert = inert;
      });
      requestAnimationFrame(() => {
        if (
          restoreFocus.current &&
          openingControl?.isConnected &&
          !openingControl.closest('[inert], [aria-hidden="true"]')
        ) {
          openingControl.focus({ preventScroll: true });
        }
      });
    };
  }, [shown, openingControl]);

  return (
    <Modal transparent animationType="none" onRequestClose={onCancel} onShow={() => setShown(true)}>
      <View
        style={[
          styles.overlay,
          {
            paddingTop: Math.max(insets.top, spacing[4]),
            paddingBottom: Math.max(insets.bottom, spacing[4]),
          },
        ]}
      >
        <Pressable
          testID="confirmation-backdrop"
          accessible={false}
          importantForAccessibility="no"
          onPress={onCancel}
          style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.overlay }]}
        />
        <ScrollView
          bounces={false}
          keyboardShouldPersistTaps="handled"
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
        >
          <View
            ref={dialogRef}
            role={Platform.OS === 'web' ? 'alertdialog' : undefined}
            aria-modal={Platform.OS === 'web' ? true : undefined}
            aria-labelledby={Platform.OS === 'web' ? titleId : undefined}
            aria-describedby={Platform.OS === 'web' ? messageId : undefined}
            accessibilityViewIsModal
            style={[styles.dialog, { backgroundColor: theme.colors.surfaceElevated }]}
          >
            <View style={styles.copy}>
              <AppText
                nativeID={titleId}
                accessibilityRole="header"
                variant="sectionTitle"
                weight="semibold"
                align="center"
              >
                {title}
              </AppText>
              <AppText nativeID={messageId} variant="label" tone="secondary" align="center">
                {message}
              </AppText>
            </View>
            <View style={styles.actions}>
              <Button
                ref={confirmRef}
                variant="dangerOutline"
                size="compact"
                focusAppearance="ring"
                onPress={() => {
                  restoreFocus.current = false;
                  onConfirm();
                }}
                style={styles.action}
              >
                {confirmLabel}
              </Button>
              <Button
                ref={cancelRef}
                size="compact"
                focusAppearance="ring"
                onPress={onCancel}
                style={styles.action}
              >
                {cancelLabel}
              </Button>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
  },
  scroll: { flexGrow: 0, flexShrink: 1, width: '100%', maxWidth: 324 },
  scrollContent: { padding: 4 },
  dialog: { borderRadius: radii.xl, padding: spacing[4], gap: spacing[6] },
  copy: { gap: spacing[2], paddingTop: spacing[1] },
  actions: { flexDirection: 'row', alignItems: 'stretch', gap: spacing[2] },
  action: { flex: 1, paddingHorizontal: spacing[1], minWidth: 0 },
});
