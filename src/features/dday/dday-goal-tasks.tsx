import { useRouter } from 'expo-router';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import {
  AppIcon,
  AppText,
  Button,
  EmptyState,
  InlineNotice,
  ItemCopy,
  ItemLeading,
  uiAuditProps,
} from '@/components/ui';
import { spacing, useAppTheme } from '@/theme';
import { formatDateLabel, toApiLocalDate } from '@/utils';

import { getRecurrenceLabel } from '../tasks/recurrence-presentation';
import { DdayOrderList } from './dday-order-list';
import { getDdayOccurrenceDate, getDdayPlanItems, type DdayPlanItem } from './dday-plan-items';
import { useDdayGoalTasks } from './use-dday-goal-tasks';
import { applyDdayPlanItemOrder, useDdayPlanItemOrder } from './use-dday-plan-item-order';

export type DdayItemOrderState = { editing: boolean; saving: boolean; canEdit: boolean };
export type DdayGoalTasksHandle = { startOrdering: () => void; saveOrder: () => void };
type Props = {
  goalId: number;
  goalTitle: string;
  selectionScope: string;
  onOrderStateChange: (state: DdayItemOrderState) => void;
  onDragging: (dragging: boolean) => void;
};

export const DdayGoalTasks = forwardRef<DdayGoalTasksHandle, Props>(function DdayGoalTasks(
  { goalId, goalTitle, selectionScope, onOrderStateChange, onDragging },
  ref,
) {
  const router = useRouter();
  const theme = useAppTheme();
  const query = useDdayGoalTasks(goalId);
  const order = useDdayPlanItemOrder(selectionScope, goalId);
  const items = applyDdayPlanItemOrder(
    getDdayPlanItems(query.data ?? [], toApiLocalDate()),
    order.keys,
  );
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [draft, setDraft] = useState<string[]>([]);
  const [history, setHistory] = useState<string[][]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const draftItems = applyDdayPlanItemOrder(items, draft);
  const canEdit = items.length > 1 && !query.isPending && !query.error && !order.isRestoring;

  const handleDragging = useCallback(
    (active: boolean) => {
      setDragging(active);
      onDragging(active);
    },
    [onDragging],
  );

  useEffect(() => {
    onOrderStateChange({ editing, saving, canEdit });
  }, [editing, saving, canEdit, onOrderStateChange]);

  useEffect(
    () => () => {
      onDragging(false);
      onOrderStateChange({ editing: false, saving: false, canEdit: false });
    },
    [onDragging, onOrderStateChange],
  );

  const startOrdering = () => {
    if (!canEdit) return;
    setDraft(items.map((item) => item.key));
    setHistory([]);
    setSaveError(null);
    setEditing(true);
  };
  const saveOrder = async () => {
    if (!editing || saving || dragging) return;
    setSaving(true);
    setSaveError(null);
    try {
      await order.save(draftItems.map((item) => item.key));
      setEditing(false);
      setHistory([]);
    } catch {
      setSaveError('순서를 저장하지 못했어요. 다시 시도해 주세요.');
    } finally {
      setSaving(false);
    }
  };
  useImperativeHandle(ref, () => ({ startOrdering, saveOrder: () => void saveOrder() }));

  const moveItem = (from: number, to: number) => {
    if (
      saving ||
      from === to ||
      from < 0 ||
      to < 0 ||
      from >= draftItems.length ||
      to >= draftItems.length
    )
      return;
    const current = draftItems.map((item) => item.key);
    const next = [...current];
    const [key] = next.splice(from, 1);
    next.splice(to, 0, key);
    setHistory((previous) => [...previous, current]);
    setDraft(next);
  };

  const errorNotice = query.error ? (
    <InlineNotice
      message={query.error.message}
      title="연결된 항목을 불러오지 못했어요"
      tone="danger"
      action={
        <Button size="compact" variant="ghost" onPress={() => void query.refetch()}>
          다시 시도
        </Button>
      }
    />
  ) : null;
  if (query.isPending || order.isRestoring)
    return (
      <View accessibilityLabel={`${goalTitle} 연결 항목을 불러오는 중`} style={styles.stateRow}>
        <ActivityIndicator color={theme.colors.primary} size="small" />
        <AppText tone="secondary" variant="caption">
          연결된 항목을 불러오고 있어요.
        </AppText>
      </View>
    );
  if (query.error && !query.data) return errorNotice;
  if (items.length === 0 && !editing)
    return (
      <EmptyState
        title="연결된 항목이 없어요"
        description="항목 추가로 할 일이나 일정을 만들어 보세요."
      />
    );

  return (
    <View style={styles.container}>
      {errorNotice}
      {editing ? (
        <>
          <AppText tone="secondary" variant="caption">
            손잡이를 끌거나 화살표로 옮겨보세요. 현재 순서는 이 기기에 저장돼요.
          </AppText>
          <DdayOrderList
            items={draftItems.map((item) => ({
              id: item.key,
              title: item.task.title,
              subtitle: getPlanItemSubtitle(item),
              icon: item.recurring
                ? 'repeat'
                : item.task.type === 'SCHEDULE'
                  ? 'calendar-blank-outline'
                  : 'file-document-outline',
            }))}
            disabled={saving}
            onMove={moveItem}
            onDragging={handleDragging}
          />
          {saveError ? <InlineNotice message={saveError} tone="danger" /> : null}
          <View style={styles.actions}>
            <Button
              size="compact"
              variant="ghost"
              disabled={saving || dragging}
              onPress={() => {
                setEditing(false);
                setSaveError(null);
              }}
            >
              취소
            </Button>
            <Button
              size="compact"
              variant="ghost"
              disabled={saving || dragging || history.length === 0}
              onPress={() => {
                setDraft(history[history.length - 1]);
                setHistory((previous) => previous.slice(0, -1));
              }}
            >
              되돌리기
            </Button>
          </View>
        </>
      ) : (
        items.map((item) => {
          const subtitle = getPlanItemSubtitle(item);
          return (
            <Pressable
              key={item.key}
              {...uiAuditProps({ uiRow: 'plan-item', uiAlign: 'text-block' })}
              accessibilityRole="button"
              accessibilityLabel={`${item.task.title}${subtitle ? ', ' + subtitle : ''}, 상세 보기`}
              accessibilityHint={
                item.recurring
                  ? '연결된 반복 회차의 상세를 엽니다. 수정할 때 적용 범위를 선택할 수 있어요.'
                  : undefined
              }
              onPress={() =>
                router.push({
                  pathname: '/tasks/[taskId]',
                  params: { taskId: String(item.task.id) },
                })
              }
              style={({ pressed }) => [
                styles.taskRow,
                { backgroundColor: pressed ? theme.colors.surfaceMuted : 'transparent' },
              ]}
            >
              <ItemLeading>
                <AppIcon
                  name={getPlanItemIcon(item)}
                  size="list"
                  color={theme.colors.textSecondary}
                />
              </ItemLeading>
              <View style={styles.copy}>
                <ItemCopy title={item.task.title} metadata={subtitle} />
              </View>
            </Pressable>
          );
        })
      )}
    </View>
  );
});

function getPlanItemIcon(item: DdayPlanItem): 'repeat' | 'calendar' | 'file-text' {
  return item.recurring ? 'repeat' : item.task.type === 'SCHEDULE' ? 'calendar' : 'file-text';
}

function getPlanItemSubtitle({ task, recurring, onlyCompleted }: DdayPlanItem) {
  const recurrence = getRecurrenceLabel(task) ?? (recurring ? '반복' : null);
  const date = getDdayOccurrenceDate(task);
  const dateLabel = date ? formatDateLabel(date, { month: 'long', day: 'numeric' }) : null;
  const exception = task.recurrenceException
    ? task.recurrenceException === 'MOVED'
      ? '이동됨'
      : task.recurrenceException === 'SKIPPED'
        ? '건너뜀'
        : '개별 수정'
    : null;
  return (
    exception
      ? [
          dateLabel,
          exception,
          onlyCompleted && task.recurrenceException !== 'SKIPPED' ? '완료' : null,
        ]
      : [recurrence ?? dateLabel, onlyCompleted ? (recurring ? '완료 기록' : '완료') : null]
  )
    .filter(Boolean)
    .join(' · ');
}

const styles = StyleSheet.create({
  container: { gap: spacing[1] },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing[2], flexWrap: 'wrap' },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[5],
    minHeight: 64,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[1],
  },
  copy: { flex: 1, minWidth: 0 },
  stateRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[2],
    justifyContent: 'center',
    minHeight: 72,
  },
});
