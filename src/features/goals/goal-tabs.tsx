import { useCallback, useEffect, useRef, useState, type ComponentRef } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { spacing, useAppTheme } from '@/theme';

import {
  getGoalTabKeyboardTarget,
  getGoalTabScrollOffset,
  type GoalTabLayout,
} from './goal-tab-navigation';

type GoalTab<Key extends string> = {
  key: Key;
  title: string;
  color: string;
  accessibilityLabel: string;
};

export function GoalTabs<Key extends string>({
  items,
  selectedKey,
  disabled,
  panelId,
  onSelect,
}: {
  items: GoalTab<Key>[];
  selectedKey?: Key;
  disabled: boolean;
  panelId: string;
  onSelect: (key: Key) => void;
}) {
  const theme = useAppTheme();
  const scroll = useRef<ScrollView>(null);
  const nodes = useRef<Record<string, ComponentRef<typeof Pressable> | null>>({});
  const layouts = useRef<Record<string, GoalTabLayout>>({});
  const contentWidth = useRef(0);
  const offset = useRef(0);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [focusedKey, setFocusedKey] = useState<Key | null>(null);
  const reveal = useCallback(
    (key = selectedKey) => {
      const next = getGoalTabScrollOffset({
        tab: key ? layouts.current[key] : undefined,
        viewportWidth,
        contentWidth: contentWidth.current,
        offset: offset.current,
      });
      if (next !== undefined) {
        offset.current = next;
        scroll.current?.scrollTo({ x: next, animated: false });
      }
    },
    [selectedKey, viewportWidth],
  );
  useEffect(() => reveal(), [reveal]);

  return (
    <ScrollView
      ref={scroll}
      horizontal
      accessibilityRole="tablist"
      accessibilityLabel="목표 선택"
      showsHorizontalScrollIndicator={false}
      style={styles.tabs}
      scrollEventThrottle={16}
      onScroll={(event) => {
        offset.current = event.nativeEvent.contentOffset.x;
      }}
      onLayout={(event) => {
        setViewportWidth(event.nativeEvent.layout.width);
        reveal();
      }}
      onContentSizeChange={(width) => {
        contentWidth.current = width;
        reveal();
      }}
    >
      {items.map((item) => {
        const selected = item.key === selectedKey;
        return (
          <Pressable
            key={item.key}
            ref={(node) => {
              nodes.current[item.key] = node;
            }}
            accessibilityRole="tab"
            nativeID={`${panelId}-tab-${item.key}`}
            accessibilityLabel={item.accessibilityLabel}
            accessibilityState={{ selected, disabled }}
            aria-selected={selected}
            aria-controls={panelId}
            disabled={disabled}
            tabIndex={selected && !disabled ? 0 : -1}
            onFocus={(event) => {
              const target = event.currentTarget as unknown as {
                matches?: (selector: string) => boolean;
              };
              if (Platform.OS === 'web' && target.matches?.(':focus-visible'))
                setFocusedKey(item.key);
            }}
            onBlur={() => setFocusedKey(null)}
            onPress={() => onSelect(item.key)}
            {...(Platform.OS === 'web'
              ? {
                  onKeyDown: (event: {
                    key: string;
                    altKey?: boolean;
                    ctrlKey?: boolean;
                    metaKey?: boolean;
                    preventDefault: () => void;
                  }) => {
                    if (disabled || event.altKey || event.ctrlKey || event.metaKey) return;
                    if (event.key === ' ' || event.key === 'Spacebar') {
                      event.preventDefault();
                      onSelect(item.key);
                      return;
                    }
                    const target = getGoalTabKeyboardTarget(
                      items.map((entry) => entry.key),
                      item.key,
                      event.key,
                    );
                    if (target === undefined) return;
                    event.preventDefault();
                    reveal(target);
                    nodes.current[target]?.focus();
                  },
                }
              : {})}
            onLayout={(event) => {
              const { x, width } = event.nativeEvent.layout;
              layouts.current[item.key] = { x, width };
              if (selected) reveal();
            }}
            style={[
              styles.tab,
              {
                // Native layout measurements may round up the fractional Web viewport width.
                maxWidth: viewportWidth ? Math.max(1, viewportWidth - 1) : undefined,
                borderBottomColor: selected ? theme.colors.primary : 'transparent',
              },
              Platform.OS === 'web' && focusedKey === item.key
                ? {
                    outlineStyle: 'solid',
                    outlineWidth: 2,
                    outlineOffset: -2,
                    outlineColor: theme.colors.primary,
                  }
                : null,
            ]}
          >
            <View style={[styles.dot, { backgroundColor: item.color }]} />
            <AppText
              variant="bodyLarge"
              tone={selected ? 'default' : 'secondary'}
              numberOfLines={1}
              weight={selected ? 'bold' : 'regular'}
              style={styles.title}
            >
              {item.title}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tabs: { flex: 1, minWidth: 0 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    minHeight: 48,
    gap: spacing[2],
    paddingHorizontal: spacing[2],
    borderBottomWidth: 2,
  },
  dot: { width: 13, height: 13, borderRadius: 7, flexShrink: 0 },
  title: { maxWidth: 172, flexShrink: 1, minWidth: 0 },
});
