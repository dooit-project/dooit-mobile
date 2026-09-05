import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { AppText, Button, Card, InlineNotice, ListSkeleton } from '@/components/ui';
import { getUserFacingApiErrorMessage } from '@/services/api';
import { radii, sizes, spacing, useAppTheme } from '@/theme';
import type { TaskChecklistItemResponse } from '@/types';

import {
  getTaskChecklistProgress,
  moveTaskChecklistItem,
  type ChecklistMoveDirection,
} from './task-checklist-presentation';
import {
  useCompleteTaskChecklistItem,
  useCreateTaskChecklistItem,
  useDeleteTaskChecklistItem,
  useReopenTaskChecklistItem,
  useReorderTaskChecklistItems,
  useTaskChecklist,
  useUpdateTaskChecklistItem,
} from './use-task-checklist';

type TaskChecklistSectionProps = {
  taskId: number;
  canEdit?: boolean;
};

const checklistLimits = { items: 100, title: 30 } as const;

export function TaskChecklistSection({ taskId, canEdit = true }: TaskChecklistSectionProps) {
  const theme = useAppTheme();
  const checklist = useTaskChecklist(taskId);
  const createItem = useCreateTaskChecklistItem(taskId);
  const updateItem = useUpdateTaskChecklistItem(taskId);
  const completeItem = useCompleteTaskChecklistItem(taskId);
  const reopenItem = useReopenTaskChecklistItem(taskId);
  const deleteItem = useDeleteTaskChecklistItem(taskId);
  const reorderItems = useReorderTaskChecklistItems(taskId);
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [activeItemId, setActiveItemId] = useState<number | null>(null);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const items = useMemo(
    () => [...(checklist.data ?? [])].sort((left, right) => left.sortOrder - right.sortOrder),
    [checklist.data],
  );
  const progress = getTaskChecklistProgress(items);
  const isMutating =
    createItem.isPending ||
    updateItem.isPending ||
    completeItem.isPending ||
    reopenItem.isPending ||
    deleteItem.isPending ||
    reorderItems.isPending;
  const mutationError =
    createItem.error ??
    updateItem.error ??
    completeItem.error ??
    reopenItem.error ??
    deleteItem.error ??
    reorderItems.error;

  const addItem = () => {
    const title = newTitle.trim();
    if (!title) return;
    createItem.mutate(
      { title },
      {
        onSuccess: () => {
          setNewTitle('');
          setIsAdding(false);
        },
      },
    );
  };
  const saveItem = (itemId: number) => {
    const title = editingTitle.trim();
    if (!title) return;
    updateItem.mutate(
      { itemId, request: { title } },
      {
        onSuccess: () => {
          setEditingItemId(null);
          setActiveItemId(null);
        },
      },
    );
  };
  const reorderItem = (itemId: number, direction: ChecklistMoveDirection) => {
    const orderedItemIds = moveTaskChecklistItem(items, itemId, direction);
    if (orderedItemIds.every((id, index) => id === items[index]?.id)) return;
    reorderItems.mutate(orderedItemIds, { onSuccess: () => setActiveItemId(null) });
  };

  return (
    <Card variant="outlined" style={styles.card}>
      {checklist.isPending ? (
        <ListSkeleton accessibilityLabel="체크리스트를 불러오는 중" count={3} />
      ) : checklist.error ? (
        <InlineNotice
          action={
            <Button size="compact" variant="ghost" onPress={() => void checklist.refetch()}>
              다시 시도
            </Button>
          }
          message={getUserFacingApiErrorMessage(checklist.error)}
          title="체크리스트를 불러오지 못했어요"
          tone="danger"
        />
      ) : (
        <>
          <View style={styles.heading}>
            <ChecklistProgressRing completed={progress.completed} total={progress.total} />
            <View style={styles.headingCopy}>
              <AppText variant="bodyLarge" weight="bold">
                체크리스트
              </AppText>
              <AppText tone="secondary" variant="label">
                {progress.total === 0
                  ? '아직 항목이 없어요'
                  : progress.remaining === 0
                    ? '모두 완료했어요'
                    : `${progress.remaining}개 남음`}
              </AppText>
            </View>
          </View>

          {!canEdit ? (
            <View style={styles.readOnlyRow}>
              <SymbolView
                name={{ ios: 'eye', android: 'visibility', web: 'visibility' }}
                size={15}
                tintColor={theme.colors.textSecondary}
              />
              <AppText tone="secondary" variant="caption">
                보기 전용 · 변경할 수 없어요
              </AppText>
            </View>
          ) : null}

          {mutationError ? (
            <InlineNotice message={getUserFacingApiErrorMessage(mutationError)} tone="danger" />
          ) : null}

          {isMutating ? (
            <View accessibilityLiveRegion="polite" style={styles.savingRow}>
              <ActivityIndicator color={theme.colors.primary} size="small" />
              <AppText tone="secondary" variant="caption">
                변경사항을 저장하고 있어요.
              </AppText>
            </View>
          ) : null}

          {items.length > 0 ? (
            <View style={[styles.items, { borderTopColor: theme.colors.rule }]}>
              {items.map((item, index) => (
                <ChecklistItemRow
                  key={item.id}
                  active={activeItemId === item.id}
                  canEdit={canEdit}
                  disabled={isMutating}
                  editing={editingItemId === item.id}
                  editingTitle={editingTitle}
                  first={index === 0}
                  item={item}
                  last={index === items.length - 1}
                  onCancelEdit={() => setEditingItemId(null)}
                  onChangeEditingTitle={setEditingTitle}
                  onDelete={() =>
                    deleteItem.mutate(item.id, { onSuccess: () => setActiveItemId(null) })
                  }
                  onMove={(direction) => reorderItem(item.id, direction)}
                  onSave={() => saveItem(item.id)}
                  onStartEdit={() => {
                    setEditingTitle(item.title);
                    setEditingItemId(item.id);
                  }}
                  onToggle={() =>
                    item.done
                      ? reopenItem.mutate(item.id)
                      : completeItem.mutate({ itemId: item.id })
                  }
                  onToggleActions={() =>
                    setActiveItemId((current) => (current === item.id ? null : item.id))
                  }
                />
              ))}
            </View>
          ) : null}

          {canEdit && items.length < checklistLimits.items ? (
            isAdding ? (
              <View style={styles.addEditor}>
                <TextInput
                  accessibilityLabel="새 체크리스트 항목"
                  autoFocus
                  editable={!isMutating}
                  maxLength={checklistLimits.title}
                  onChangeText={setNewTitle}
                  onSubmitEditing={addItem}
                  placeholder="항목을 입력하세요"
                  placeholderTextColor={theme.colors.textMuted}
                  returnKeyType="done"
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.colors.surfaceMuted,
                      borderColor: theme.colors.border,
                      color: theme.colors.text,
                    },
                  ]}
                  value={newTitle}
                />
                <View style={styles.editorActions}>
                  <Button
                    disabled={isMutating}
                    size="compact"
                    variant="ghost"
                    onPress={() => {
                      setNewTitle('');
                      setIsAdding(false);
                    }}
                  >
                    취소
                  </Button>
                  <Button
                    disabled={!newTitle.trim()}
                    loading={createItem.isPending}
                    size="compact"
                    onPress={addItem}
                  >
                    추가
                  </Button>
                </View>
              </View>
            ) : (
              <Button
                disabled={isMutating}
                fullWidth
                size="compact"
                variant="ghost"
                onPress={() => setIsAdding(true)}
                style={{ borderColor: theme.colors.border }}
              >
                + 항목 추가
              </Button>
            )
          ) : canEdit ? (
            <AppText tone="muted" variant="caption">
              체크리스트는 최대 {checklistLimits.items}개까지 추가할 수 있어요.
            </AppText>
          ) : null}
        </>
      )}
    </Card>
  );
}

function ChecklistProgressRing({ completed, total }: { completed: number; total: number }) {
  const theme = useAppTheme();
  const size = 52;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = total === 0 ? 0 : completed / total;

  return (
    <View
      accessible
      accessibilityLabel={`체크리스트 ${completed}/${total} 완료`}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: total, now: completed }}
      style={styles.progress}
    >
      <Svg height={size} width={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          fill="none"
          r={radius}
          stroke={theme.colors.border}
          strokeWidth={strokeWidth}
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          fill="none"
          r={radius}
          stroke={theme.colors.primary}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - ratio)}
          strokeLinecap="round"
          strokeWidth={strokeWidth}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <AppText style={styles.progressLabel} variant="label" weight="bold">
        {completed}/{total}
      </AppText>
    </View>
  );
}

type ChecklistItemRowProps = {
  active: boolean;
  canEdit: boolean;
  disabled: boolean;
  editing: boolean;
  editingTitle: string;
  first: boolean;
  item: TaskChecklistItemResponse;
  last: boolean;
  onCancelEdit: () => void;
  onChangeEditingTitle: (value: string) => void;
  onDelete: () => void;
  onMove: (direction: ChecklistMoveDirection) => void;
  onSave: () => void;
  onStartEdit: () => void;
  onToggle: () => void;
  onToggleActions: () => void;
};

function ChecklistItemRow({
  active,
  canEdit,
  disabled,
  editing,
  editingTitle,
  first,
  item,
  last,
  onCancelEdit,
  onChangeEditingTitle,
  onDelete,
  onMove,
  onSave,
  onStartEdit,
  onToggle,
  onToggleActions,
}: ChecklistItemRowProps) {
  const theme = useAppTheme();

  return (
    <View style={[styles.item, { borderBottomColor: theme.colors.rule }]}>
      {editing ? (
        <View style={styles.itemEditor}>
          <TextInput
            accessibilityLabel={`${item.title} 제목 수정`}
            autoFocus
            editable={!disabled}
            maxLength={checklistLimits.title}
            onChangeText={onChangeEditingTitle}
            onSubmitEditing={onSave}
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.surfaceMuted,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              },
            ]}
            value={editingTitle}
          />
          <View style={styles.editorActions}>
            <Button disabled={disabled} size="compact" variant="ghost" onPress={onCancelEdit}>
              취소
            </Button>
            <Button disabled={!editingTitle.trim()} size="compact" onPress={onSave}>
              저장
            </Button>
          </View>
        </View>
      ) : (
        <View style={styles.itemMain}>
          {canEdit ? (
            <Pressable
              accessibilityLabel={`${item.title}, ${item.done ? '완료 취소' : '완료하기'}`}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: item.done, disabled }}
              disabled={disabled}
              hitSlop={6}
              onPress={onToggle}
              style={styles.checkboxTarget}
            >
              <ChecklistCheckbox done={item.done} />
            </Pressable>
          ) : (
            <View
              accessible
              accessibilityLabel={`${item.title}, ${item.done ? '완료' : '미완료'}`}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: item.done }}
              style={styles.checkboxTarget}
            >
              <ChecklistCheckbox done={item.done} />
            </View>
          )}
          <AppText
            numberOfLines={2}
            tone={item.done ? 'secondary' : 'default'}
            variant="label"
            style={styles.itemTitle}
          >
            {item.title}
          </AppText>
          {canEdit ? (
            <Pressable
              accessibilityLabel={`${item.title} 항목 행동 ${active ? '닫기' : '열기'}`}
              accessibilityRole="button"
              accessibilityState={{ expanded: active, disabled }}
              disabled={disabled}
              hitSlop={6}
              onPress={onToggleActions}
              style={styles.itemActionTrigger}
            >
              <SymbolView
                name={{
                  ios: active ? 'chevron.up' : 'chevron.right',
                  android: active ? 'expand_less' : 'chevron_right',
                  web: active ? 'expand_less' : 'chevron_right',
                }}
                size={17}
                tintColor={theme.colors.textSecondary}
              />
            </Pressable>
          ) : null}
        </View>
      )}

      {active && !editing ? (
        <View style={styles.itemActions}>
          <Button
            disabled={disabled || first}
            size="compact"
            variant="ghost"
            onPress={() => onMove('up')}
          >
            위로
          </Button>
          <Button
            disabled={disabled || last}
            size="compact"
            variant="ghost"
            onPress={() => onMove('down')}
          >
            아래로
          </Button>
          <Button disabled={disabled} size="compact" variant="ghost" onPress={onStartEdit}>
            수정
          </Button>
          <Button disabled={disabled} size="compact" variant="ghost" onPress={onDelete}>
            삭제
          </Button>
        </View>
      ) : null}
    </View>
  );
}

function ChecklistCheckbox({ done }: { done: boolean }) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.checkbox,
        {
          backgroundColor: done ? theme.colors.primary : theme.colors.surface,
          borderColor: done ? theme.colors.primary : theme.colors.borderStrong,
        },
      ]}
    >
      {done ? (
        <SymbolView
          name={{ ios: 'checkmark', android: 'check', web: 'check' }}
          size={15}
          tintColor={theme.colors.textOnPrimary}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing[3] },
  heading: { alignItems: 'center', flexDirection: 'row', gap: spacing[3] },
  headingCopy: { flex: 1, gap: spacing[1] },
  progress: { height: 52, justifyContent: 'center', width: 52 },
  progressLabel: { position: 'absolute', textAlign: 'center', width: '100%' },
  readOnlyRow: { alignItems: 'center', flexDirection: 'row', gap: spacing[1] },
  savingRow: { alignItems: 'center', flexDirection: 'row', gap: spacing[2] },
  items: { borderTopWidth: StyleSheet.hairlineWidth },
  item: { borderBottomWidth: StyleSheet.hairlineWidth },
  itemMain: { alignItems: 'center', flexDirection: 'row', minHeight: sizes.touchTarget },
  checkboxTarget: {
    alignItems: 'center',
    height: sizes.touchTarget,
    justifyContent: 'center',
    width: sizes.touchTarget,
  },
  checkbox: {
    alignItems: 'center',
    borderRadius: radii.sm,
    borderWidth: 1.5,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  itemTitle: { flex: 1, minWidth: 0, paddingVertical: spacing[2] },
  itemActionTrigger: {
    alignItems: 'center',
    height: sizes.touchTarget,
    justifyContent: 'center',
    width: sizes.touchTarget,
  },
  itemActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[1],
    justifyContent: 'flex-end',
    paddingBottom: spacing[2],
  },
  itemEditor: { gap: spacing[2], paddingVertical: spacing[2] },
  addEditor: { gap: spacing[2] },
  editorActions: { flexDirection: 'row', gap: spacing[2], justifyContent: 'flex-end' },
  input: {
    borderRadius: radii.md,
    borderWidth: 1,
    minHeight: sizes.touchTarget,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
});
