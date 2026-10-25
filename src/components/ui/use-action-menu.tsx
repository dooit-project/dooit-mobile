import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentRef,
  type RefObject,
} from 'react';
import {
  BackHandler,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';

import { radii, sizes, spacing, typography, useAppTheme } from '@/theme';
import { AppIcon, type AppIconName } from './app-icon';
import { AppText } from './app-text';
import { IconButton } from './icon-button';
import { focusControl } from './focus-control';
import {
  getActionMenuKeyboardIndex,
  getActionMenuPlacement,
  type MenuAnchor,
} from './action-menu-layout';
import { uiAuditProps } from './ui-audit-props';

type MenuItem = {
  key: string;
  label: string;
  icon: AppIconName;
  destructive?: boolean;
  onPress: () => void;
};
type InitialFocus = 'first' | 'last';

/** Render overlay in the host's overlay slot, so it never enters the content flow. */
export function useActionMenu({
  open,
  onOpenChange,
  disabled,
  label,
  triggerLabel,
  items,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disabled: boolean;
  label: string;
  triggerLabel: string;
  items: MenuItem[];
}) {
  const theme = useAppTheme();
  const id = useId();
  const triggerRef = useRef<ComponentRef<typeof Pressable>>(null);
  const [initialFocus, setInitialFocus] = useState<InitialFocus>('first');
  const dismiss = useCallback(
    (restoreFocus = true) => {
      onOpenChange(false);
      if (restoreFocus) requestAnimationFrame(() => focusControl(triggerRef.current));
    },
    [onOpenChange],
  );
  const show = (focus: InitialFocus = 'first') => {
    if (disabled) return;
    setInitialFocus(focus);
    onOpenChange(true);
  };
  return {
    dismiss,
    trigger: (
      <IconButton
        ref={triggerRef}
        accessibilityLabel={triggerLabel}
        expanded={open}
        disabled={disabled}
        variant="plain"
        aria-haspopup="menu"
        aria-controls={open ? id : undefined}
        onPress={() => (open ? dismiss() : show())}
        {...(Platform.OS === 'web'
          ? {
              onKeyDown: (event: { key: string; preventDefault: () => void }) => {
                if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                  event.preventDefault();
                  show(event.key === 'ArrowUp' ? 'last' : 'first');
                }
              },
            }
          : {})}
      >
        <AppIcon name="more-horizontal" color={theme.colors.textSecondary} />
      </IconButton>
    ),
    overlay:
      open && !disabled ? (
        <ActionMenuOverlay
          id={id}
          label={label}
          items={items}
          anchorRef={triggerRef}
          initialFocus={initialFocus}
          onDismiss={dismiss}
        />
      ) : null,
  };
}

function ActionMenuOverlay({
  id,
  label,
  items,
  anchorRef,
  initialFocus,
  onDismiss,
}: {
  id: string;
  label: string;
  items: MenuItem[];
  anchorRef: RefObject<ComponentRef<typeof Pressable> | null>;
  initialFocus: InitialFocus;
  onDismiss: (restoreFocus?: boolean) => void;
}) {
  const theme = useAppTheme();
  const viewport = useWindowDimensions();
  const hostRef = useRef<ComponentRef<typeof View>>(null);
  const menuRef = useRef<ComponentRef<typeof View>>(null);
  const itemRefs = useRef<(ComponentRef<typeof Pressable> | null)[]>([]);
  const version = useRef(0);
  const invalidateMeasurements = useCallback(() => {
    version.current++;
  }, []);
  const focusedOnce = useRef(false);
  const [focused, setFocused] = useState<number | null>(null);
  const [geometry, setGeometry] = useState<{
    anchor: MenuAnchor;
    host: { width: number; height: number };
  } | null>(null);
  const [contentHeight, setContentHeight] = useState(0);
  const latest = useRef({ items, onDismiss });
  useLayoutEffect(() => {
    latest.current = { items, onDismiss };
  }, [items, onDismiss]);
  const measure = useCallback(() => {
    const ticket = ++version.current;
    anchorRef.current?.measureInWindow((x, y, width, height) => {
      hostRef.current?.measureInWindow((hostX, hostY, hostWidth, hostHeight) => {
        if (ticket !== version.current || !width || !height || !hostWidth || !hostHeight) return;
        const next = {
          anchor: { x: x - hostX, y: y - hostY, width, height },
          host: { width: hostWidth, height: hostHeight },
        };
        setGeometry((previous) =>
          JSON.stringify(previous) === JSON.stringify(next) ? previous : next,
        );
      });
    });
  }, [anchorRef]);
  useLayoutEffect(() => {
    const frame = requestAnimationFrame(measure);
    return () => {
      cancelAnimationFrame(frame);
      invalidateMeasurements();
    };
  }, [measure, invalidateMeasurements, viewport.width, viewport.height, viewport.fontScale]);
  const placement = geometry
    ? getActionMenuPlacement({
        ...geometry,
        contentHeight:
          contentHeight ||
          items.length *
            Math.max(
              sizes.touchTarget,
              typography.lineHeight.label * viewport.fontScale + spacing[4],
            ) +
            spacing[2] +
            2,
      })
    : null;
  const ready = placement !== null;
  useEffect(() => {
    if (!ready || focusedOnce.current) return;
    const frame = requestAnimationFrame(() => {
      focusedOnce.current = true;
      focusControl(itemRefs.current[initialFocus === 'last' ? latest.current.items.length - 1 : 0]);
    });
    return () => cancelAnimationFrame(frame);
  }, [ready, initialFocus]);
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      latest.current.onDismiss();
      return true;
    });
    return () => subscription.remove();
  }, []);
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const host = hostRef.current as unknown as HTMLElement | null;
    const menu = menuRef.current as unknown as HTMLElement | null;
    if (!host || !menu) return;
    // Keep the host visible but prevent background keyboard/screen-reader actions.
    const siblings = [...(host.parentElement?.children ?? [])]
      .filter((node): node is HTMLElement => node !== host && node instanceof HTMLElement)
      .map((element) => ({ element, inert: element.inert }));
    siblings.forEach(({ element }) => {
      element.inert = true;
    });
    const entries = () => [...menu.querySelectorAll<HTMLElement>('[role="menuitem"]')];
    const keyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const index = entries().indexOf(document.activeElement as HTMLElement);
      const next = getActionMenuKeyboardIndex(entries().length, index, event.key);
      if (next !== null) {
        event.preventDefault();
        event.stopImmediatePropagation();
        entries()[next]?.focus();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        event.stopImmediatePropagation();
        latest.current.onDismiss();
      } else if (event.key === 'Enter' || event.key === ' ') {
        if (index < 0) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        latest.current.onDismiss(false);
        latest.current.items[index]?.onPress();
      } else if (event.key === 'Tab') {
        event.preventDefault();
        event.stopImmediatePropagation();
        const trigger = anchorRef.current as unknown as HTMLElement | null;
        const scope = host.closest('[role="dialog"]') ?? host.parentElement;
        const reverse = event.shiftKey;
        latest.current.onDismiss(false);
        requestAnimationFrame(() => {
          const controls = [
            ...(scope?.querySelectorAll<HTMLElement>(
              'button, input, textarea, [tabindex="0"], [role="button"], [role="checkbox"]',
            ) ?? []),
          ].filter(
            (element) =>
              !element.closest('[inert], [aria-hidden="true"]') &&
              !element.hasAttribute('disabled') &&
              element.getAttribute('aria-disabled') !== 'true' &&
              element.getClientRects().length > 0,
          );
          const triggerIndex = trigger ? controls.indexOf(trigger) : -1;
          const target =
            triggerIndex < 0 || !controls.length
              ? trigger
              : controls[(triggerIndex + (reverse ? -1 : 1) + controls.length) % controls.length];
          target?.focus();
        });
      }
    };
    document.addEventListener('keydown', keyDown, true);
    return () => {
      document.removeEventListener('keydown', keyDown, true);
      siblings.forEach(({ element, inert }) => {
        element.inert = inert;
      });
    };
  }, [anchorRef]);
  const choose = (item: MenuItem) => {
    onDismiss(false);
    item.onPress();
  };
  return (
    <View
      ref={hostRef}
      onLayout={measure}
      style={styles.overlay}
      accessibilityViewIsModal
      pointerEvents="box-none"
    >
      <Pressable
        testID="action-menu-backdrop"
        accessible={false}
        focusable={false}
        importantForAccessibility="no"
        onPress={() => onDismiss()}
        style={StyleSheet.absoluteFill}
      />
      <View
        ref={menuRef}
        nativeID={id}
        accessibilityRole="menu"
        accessibilityLabel={label}
        pointerEvents={ready ? 'auto' : 'none'}
        style={[
          styles.menu,
          {
            backgroundColor: theme.colors.surfaceElevated,
            borderColor: theme.colors.border,
            opacity: ready ? 1 : 0,
          },
          placement && {
            left: placement.left,
            top: placement.top,
            width: placement.width,
            maxHeight: placement.maxHeight,
          },
        ]}
      >
        <ScrollView
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
          // ScrollView's measured content already includes its container padding.
          onContentSizeChange={(_width, height) => setContentHeight(height + 2)}
          contentContainerStyle={styles.items}
        >
          {items.map((item, index) => (
            <Pressable
              key={item.key}
              ref={(node) => {
                itemRefs.current[index] = node;
              }}
              {...uiAuditProps({ uiRow: 'action-menu-item', uiAlign: 'text-block', uiTouch: '44' })}
              accessibilityRole="menuitem"
              accessibilityLabel={item.label}
              tabIndex={-1}
              onPress={() => choose(item)}
              onFocus={() => setFocused(index)}
              onBlur={() => setFocused(null)}
              style={({ pressed }) => [
                styles.item,
                {
                  backgroundColor:
                    pressed || focused === index ? theme.colors.surfaceMuted : 'transparent',
                  borderColor: focused === index ? theme.colors.primary : 'transparent',
                },
              ]}
            >
              <AppIcon
                name={item.icon}
                size="menu"
                color={item.destructive ? theme.colors.danger : theme.colors.textSecondary}
              />
              <AppText
                {...uiAuditProps({ uiText: 'block' })}
                variant="label"
                style={[styles.copy, item.destructive && { color: theme.colors.danger }]}
              >
                {item.label}
              </AppText>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFill, zIndex: 100 },
  menu: { position: 'absolute', borderWidth: 1, borderRadius: radii.lg, overflow: 'hidden' },
  items: { padding: spacing[1] },
  item: {
    minHeight: sizes.touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderWidth: 2,
    borderRadius: radii.sm,
  },
  copy: { flex: 1, minWidth: 0 },
});
