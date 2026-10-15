import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, StyleSheet, View } from 'react-native';

import { AppText, IconButton } from '@/components/ui';
import { spacing, useAppTheme } from '@/theme';

type GoalOrderItem = { id: number; title: string; color: string };
type RowLayout = { y: number; height: number };
type Props = {
  items: GoalOrderItem[];
  disabled: boolean;
  onMove: (from: number, to: number) => void;
  onDragging: (dragging: boolean) => void;
};

export function DdayGoalOrderList({ items, disabled, onMove, onDragging }: Props) {
  const layouts = useRef(new Map<number, RowLayout>());
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [targetId, setTargetId] = useState<number | null>(null);
  const translation = useRef(new Animated.Value(0)).current;
  const targetIndex = useRef(0);
  const targetItemId = useRef<number | null>(null);
  const latest = useRef({ items, disabled, onMove, onDragging });
  latest.current = { items, disabled, onMove, onDragging };

  useEffect(
    () => () => {
      latest.current.onDragging(false);
    },
    [],
  );

  const itemIds = items.map((item) => item.id).join(',');
  const responders = useMemo(
    () =>
      itemIds
        .split(',')
        .filter(Boolean)
        .map((id) => {
          const itemId = Number(id);
          return PanResponder.create({
            onStartShouldSetPanResponder: () => !latest.current.disabled,
            onMoveShouldSetPanResponder: (_, gesture) =>
              !latest.current.disabled && Math.abs(gesture.dy) > 5,
            onPanResponderGrant: () => {
              const index = latest.current.items.findIndex((candidate) => candidate.id === itemId);
              targetItemId.current = itemId;
              targetIndex.current = index;
              setDraggedId(itemId);
              setTargetId(itemId);
              latest.current.onDragging(true);
            },
            onPanResponderMove: (_, gesture) => {
              const layout = layouts.current.get(itemId);
              if (!layout) return;
              const center = layout.y + layout.height / 2 + gesture.dy;
              let closest = Number.POSITIVE_INFINITY;
              latest.current.items.forEach((candidate, index) => {
                const candidateLayout = layouts.current.get(candidate.id);
                if (!candidateLayout) return;
                const distance = Math.abs(candidateLayout.y + candidateLayout.height / 2 - center);
                if (distance < closest) {
                  closest = distance;
                  targetIndex.current = index;
                }
              });
              targetItemId.current = latest.current.items[targetIndex.current]?.id ?? null;
              setTargetId(targetItemId.current);
              const measured = latest.current.items
                .map((candidate) => layouts.current.get(candidate.id))
                .filter((value): value is RowLayout => Boolean(value));
              const min = Math.min(...measured.map((value) => value.y)) - layout.y;
              const max =
                Math.max(...measured.map((value) => value.y + value.height)) -
                layout.y -
                layout.height;
              translation.setValue(Math.max(min, Math.min(max, gesture.dy)));
            },
            onPanResponderRelease: () => {
              const from = latest.current.items.findIndex((candidate) => candidate.id === itemId);
              const to = latest.current.items.findIndex(
                (candidate) => candidate.id === targetItemId.current,
              );
              translation.setValue(0);
              setDraggedId(null);
              setTargetId(null);
              targetItemId.current = null;
              latest.current.onDragging(false);
              if (from >= 0 && to >= 0 && from !== to) latest.current.onMove(from, to);
            },
            onPanResponderTerminate: () => {
              translation.setValue(0);
              setDraggedId(null);
              setTargetId(null);
              targetItemId.current = null;
              latest.current.onDragging(false);
            },
            onPanResponderTerminationRequest: () => false,
          });
        }),
    [itemIds, translation],
  );

  const theme = useAppTheme();
  return (
    <View>
      {items.map((item, index) => (
        <Animated.View
          key={item.id}
          onLayout={(event) => layouts.current.set(item.id, event.nativeEvent.layout)}
          style={[
            styles.row,
            {
              backgroundColor:
                targetId === item.id ? theme.colors.primarySoft : theme.colors.background,
              zIndex: draggedId === item.id ? 1 : 0,
              transform: [{ translateY: draggedId === item.id ? translation : 0 }],
            },
          ]}
        >
          <View style={[styles.dot, { backgroundColor: item.color }]} />
          <AppText style={styles.title}>{item.title}</AppText>
          <IconButton
            accessibilityLabel={`${item.title} 위로 이동`}
            disabled={disabled || draggedId !== null || index === 0}
            style={styles.control}
            onPress={() => onMove(index, index - 1)}
          >
            <MaterialCommunityIcons name="arrow-up" size={20} color={theme.colors.textSecondary} />
          </IconButton>
          <IconButton
            accessibilityLabel={`${item.title} 아래로 이동`}
            disabled={disabled || draggedId !== null || index === items.length - 1}
            style={styles.control}
            onPress={() => onMove(index, index + 1)}
          >
            <MaterialCommunityIcons
              name="arrow-down"
              size={20}
              color={theme.colors.textSecondary}
            />
          </IconButton>
          <View
            {...responders[index].panHandlers}
            accessible
            accessibilityRole="adjustable"
            accessibilityValue={{ min: 1, max: items.length, now: index + 1 }}
            accessibilityLabel={`${item.title} 순서, ${items.length}개 중 ${index + 1}번째`}
            accessibilityHint="끌어서 이동하거나 위로 이동, 아래로 이동 버튼을 사용하세요."
            accessibilityState={{ disabled }}
            accessibilityActions={[
              { name: 'increment', label: '아래로 이동' },
              { name: 'decrement', label: '위로 이동' },
            ]}
            onAccessibilityAction={(event) => {
              if (disabled || draggedId !== null) return;
              if (
                event.nativeEvent.actionName !== 'increment' &&
                event.nativeEvent.actionName !== 'decrement'
              )
                return;
              const next = index + (event.nativeEvent.actionName === 'increment' ? 1 : -1);
              if (next >= 0 && next < items.length) onMove(index, next);
            }}
            style={styles.handle}
          >
            <MaterialCommunityIcons
              name="drag-horizontal"
              size={22}
              color={theme.colors.textSecondary}
            />
          </View>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingVertical: spacing[2],
    gap: spacing[1],
  },
  dot: { width: 9, height: 9, borderRadius: 5, marginRight: spacing[1] },
  title: { flex: 1, minWidth: 0 },
  control: { backgroundColor: 'transparent' },
  handle: { width: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
});
