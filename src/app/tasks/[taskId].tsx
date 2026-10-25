import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { usePreventRemove, type NavigationAction } from 'expo-router/react-navigation';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from 'react-native';

import {
  AppIcon,
  AppText,
  Button,
  Card,
  DetailSheet,
  IconButton,
  InlineNotice,
  Screen,
  uiAuditProps,
} from '@/components/ui';
import { useDdayGoals } from '@/features/dday';
import { TaskGoalPath } from '@/features/tasks/task-goal-path';
import { useAppToday } from '@/services/time/use-app-today';
import {
  TaskDateQuickActions,
  TaskChecklistSection,
  TaskForm,
  formatEstimatedDuration,
  getRecurrenceLabel,
  useCompleteTask,
  useReopenTask,
  useDeleteTask,
  useTaskDdayGoal,
  useTaskDetail,
  useUpdateTask,
} from '@/features/tasks';
import { radii, sizes, spacing, typography, useAppTheme, useMobileLayout } from '@/theme';
import type { RecurrenceEditScope, TaskResponse, TaskUpsertRequest } from '@/types';
import { formatDateLabel, formatTimeLabel, getScreenBackAction } from '@/utils';

type ManagementSection = 'goal' | 'history' | 'delete' | null;
type BrowserTraverseEvent = Event & { navigationType: string; destination: { key: string } };
type BrowserNavigation = EventTarget & { traverseTo: (key: string) => unknown };

export default function TaskDetailScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const theme = useAppTheme();
  const { taskId } = useLocalSearchParams<{ taskId?: string | string[] }>();
  const parsedTaskId = parseTaskId(taskId);
  const taskQuery = useTaskDetail(parsedTaskId);
  const deleteTask = useDeleteTask();
  const updateTask = useUpdateTask();
  const taskDdayGoal = useTaskDdayGoal();
  const today = useAppToday();
  const completeTask = useCompleteTask(today);
  const reopenTask = useReopenTask(today);
  const [isPanel] = useState(() => router.canGoBack());
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isConfirmingClose, setIsConfirmingClose] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [management, setManagement] = useState<ManagementSection>(null);
  const [hasChecklistDraft, setHasChecklistDraft] = useState(false);
  const [checklistBusy, setChecklistBusy] = useState(false);
  const [dateBusy, setDateBusy] = useState(false);
  const [editScope, setEditScope] = useState<RecurrenceEditScope>('THIS');
  const [deleteScope, setDeleteScope] = useState<RecurrenceEditScope>('THIS');
  const pendingAction = useRef<NavigationAction | null>(null);
  const pendingBrowserNavigation = useRef<(() => void) | null>(null);
  const busy =
    updateTask.isPending ||
    deleteTask.isPending ||
    completeTask.isPending ||
    reopenTask.isPending ||
    taskDdayGoal.isPending ||
    checklistBusy ||
    dateBusy;
  const hasDraft = isEditing || hasChecklistDraft;
  const requestClose = useCallback(() => {
    if (busy) return;
    if (hasDraft) {
      pendingAction.current = null;
      pendingBrowserNavigation.current = null;
      setIsConfirmingClose(true);
      return;
    }
    getScreenBackAction(router).onPress();
  }, [busy, hasDraft, router]);
  usePreventRemove(hasDraft || (busy && !deleteTask.isSuccess), ({ data }) => {
    if (busy) return;
    pendingAction.current = data.action;
    setIsConfirmingClose(true);
  });
  useEffect(() => {
    if (deleteTask.isSuccess) getScreenBackAction(router).onPress();
  }, [deleteTask.isSuccess, router]);
  useEffect(() => {
    if (Platform.OS !== 'web' || !hasDraft) return;
    const protectDraft = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', protectDraft);
    return () => window.removeEventListener('beforeunload', protectDraft);
  }, [hasDraft]);
  useEffect(() => {
    if (Platform.OS !== 'web' || (!hasDraft && !busy)) return;
    // SDK 56's native removal hook does not cover browser Back/Forward.
    // Use the public browser API where traversal cancellation is available.
    const browserNavigation = (window as unknown as { navigation?: BrowserNavigation }).navigation;
    if (!browserNavigation) return;
    const protectTraversal = (event: Event) => {
      const traversal = event as BrowserTraverseEvent;
      if (traversal.navigationType !== 'traverse' || !traversal.cancelable) return;
      traversal.preventDefault();
      if (busy) return;
      pendingAction.current = null;
      pendingBrowserNavigation.current = () =>
        browserNavigation.traverseTo(traversal.destination.key);
      setIsConfirmingClose(true);
    };
    browserNavigation.addEventListener('navigate', protectTraversal);
    return () => browserNavigation.removeEventListener('navigate', protectTraversal);
  }, [hasDraft, busy]);
  useEffect(() => {
    if (Platform.OS !== 'web' || !isConfirmingClose) return;
    const frame = requestAnimationFrame(() =>
      document.querySelector<HTMLElement>('[aria-label="계속 작성"]')?.focus(),
    );
    return () => cancelAnimationFrame(frame);
  }, [isConfirmingClose]);
  const discardAndClose = () => {
    const action = pendingAction.current;
    const browserAction = pendingBrowserNavigation.current;
    setIsEditing(false);
    setHasChecklistDraft(false);
    setIsConfirmingClose(false);
    requestAnimationFrame(() => {
      if (browserAction) browserAction();
      else if (action) navigation.dispatch(action);
      else getScreenBackAction(router).onPress();
    });
  };
  const startEditing = () => {
    setMenuOpen(false);
    setManagement(null);
    setEditScope('THIS');
    setIsEditing(true);
  };
  const handleSubmit = (request: TaskUpsertRequest) => {
    if (parsedTaskId === null) return;
    updateTask.mutate(
      {
        taskId: parsedTaskId,
        request,
        recurrenceScope: taskQuery.data && isRecurringTask(taskQuery.data) ? editScope : undefined,
      },
      { onSuccess: () => setIsEditing(false) },
    );
  };
  const handleDelete = () => {
    if (parsedTaskId === null) return;
    deleteTask.mutate({
      taskId: parsedTaskId,
      recurrenceScope: taskQuery.data && isRecurringTask(taskQuery.data) ? deleteScope : undefined,
    });
  };
  const selectManagement = (section: ManagementSection) => {
    setMenuOpen(false);
    setManagement(section);
    if (section === 'delete') {
      setDeleteScope('THIS');
      setIsConfirmingDelete(true);
    }
  };
  const task = taskQuery.data;
  const header = (
    <View style={panelStyles.header}>
      <TaskGoalPath task={task} disabled={!task || busy || hasDraft} />
      {!isEditing ? (
        <Button
          accessibilityLabel="할 일 수정"
          disabled={!task || busy || hasChecklistDraft}
          size="compact"
          variant="ghost"
          onPress={startEditing}
          style={panelStyles.editButton}
        >
          <AppText tone="primary" variant="label" weight="semibold">
            수정
          </AppText>
        </Button>
      ) : null}
      {!isEditing ? (
        <IconButton
          accessibilityLabel="할 일 더보기"
          expanded={menuOpen}
          disabled={!task || busy || hasChecklistDraft}
          variant="plain"
          onPress={() => setMenuOpen((value) => !value)}
        >
          <AppIcon name="more-horizontal" color={theme.colors.textSecondary} />
        </IconButton>
      ) : null}
      <IconButton
        accessibilityLabel="할 일 상세 닫기"
        disabled={busy}
        variant="plain"
        onPress={requestClose}
      >
        <AppIcon name="x" color={theme.colors.textSecondary} />
      </IconButton>
    </View>
  );
  const confirmation = isConfirmingClose ? (
    <InlineNotice
      tone="warning"
      actionPosition="bottom"
      title="입력 중인 내용을 버릴까요?"
      message="저장하지 않은 내용이 있어요."
      action={
        <View style={panelStyles.confirmActions}>
          <Button size="compact" variant="ghost" onPress={() => setIsConfirmingClose(false)}>
            계속 작성
          </Button>
          <Button size="compact" variant="danger" onPress={discardAndClose}>
            버리고 닫기
          </Button>
        </View>
      }
    />
  ) : null;
  const content = (
    <View style={panelStyles.content}>
      {menuOpen ? (
        <View accessibilityLabel="할 일 관리" style={panelStyles.menu}>
          <Button
            contentAlignment="start"
            disabled={busy}
            variant="ghost"
            onPress={() => selectManagement('history')}
          >
            기록 정보
          </Button>
          <Button
            disabled={busy}
            contentAlignment="start"
            variant="ghost"
            onPress={() => selectManagement('goal')}
          >
            목표 연결 관리
          </Button>
          <Button
            contentAlignment="start"
            disabled={busy}
            variant="ghost"
            onPress={() => selectManagement('delete')}
          >
            할 일 삭제
          </Button>
        </View>
      ) : null}
      {parsedTaskId === null ? (
        <InlineNotice
          title="할 일을 찾을 수 없어요"
          message="올바르지 않은 상세 주소예요. 목록에서 다시 선택해 주세요."
          tone="danger"
        />
      ) : taskQuery.isPending ? (
        <View accessibilityLabel="할 일 상세를 불러오는 중" style={styles.loadingRow}>
          <ActivityIndicator color={theme.colors.primary} />
          <AppText tone="secondary">할 일 정보를 불러오고 있어요.</AppText>
        </View>
      ) : taskQuery.error ? (
        <InlineNotice
          title="상세 정보를 불러오지 못했어요"
          message={taskQuery.error.message}
          tone="danger"
          action={
            <Button variant="ghost" onPress={() => void taskQuery.refetch()}>
              다시 시도
            </Button>
          }
        />
      ) : task && isEditing ? (
        <View style={styles.editing}>
          <AppText accessibilityRole="header" variant="title" weight="semibold">
            할 일 수정
          </AppText>
          {isRecurringTask(task) ? (
            <RecurrenceScopePicker
              title="반복 수정 범위"
              description="어느 반복 항목까지 수정할지 먼저 선택해 주세요."
              value={editScope}
              onChange={setEditScope}
            />
          ) : null}
          <TaskForm
            initialTask={task}
            autoFocusTitle
            errorMessage={updateTask.error?.message}
            isSubmitting={updateTask.isPending}
            submitLabel="수정 완료"
            onCancel={() => {
              updateTask.reset();
              setIsEditing(false);
            }}
            onSubmit={handleSubmit}
          />
        </View>
      ) : task && management ? (
        <View style={panelStyles.content}>
          <Button
            contentAlignment="start"
            disabled={busy}
            variant="ghost"
            onPress={() => {
              setManagement(null);
              setIsConfirmingDelete(false);
              deleteTask.reset();
            }}
            leading={<AppIcon name="arrow-left" size="meta" color={theme.colors.textSecondary} />}
          >
            상세로 돌아가기
          </Button>
          <TaskManagement
            mode={management}
            task={task}
            taskDdayGoal={taskDdayGoal}
            deleteErrorMessage={deleteTask.error?.message}
            deleteScope={deleteScope}
            isConfirmingDelete={isConfirmingDelete}
            isDeleting={deleteTask.isPending}
            onCancelDelete={() => {
              deleteTask.reset();
              setIsConfirmingDelete(false);
              setManagement(null);
            }}
            onConfirmDelete={handleDelete}
            onDeleteScopeChange={setDeleteScope}
            onRequestDelete={() => setIsConfirmingDelete(true)}
          />
        </View>
      ) : task ? (
        <TaskContent
          task={task}
          busy={busy}
          editDisabled={busy || hasChecklistDraft}
          isCompleting={completeTask.isPending || reopenTask.isPending}
          completionError={completeTask.error?.message ?? reopenTask.error?.message}
          onComplete={() => {
            completeTask.reset();
            reopenTask.reset();
            if (task.status === 'DONE') reopenTask.mutate(task.id);
            else completeTask.mutate(task.id);
          }}
          onEdit={startEditing}
          onChecklistDraftChange={setHasChecklistDraft}
          onChecklistBusyChange={setChecklistBusy}
          onDateBusyChange={setDateBusy}
        />
      ) : null}
    </View>
  );
  return isPanel ? (
    <DetailSheet
      header={header}
      notice={confirmation}
      label="할 일 상세"
      returnFocusLabel={task?.title}
      expanded={isEditing}
      onClose={requestClose}
    >
      {content}
    </DetailSheet>
  ) : (
    <Screen scroll contentContainerStyle={styles.screen}>
      {header}
      {confirmation}
      {content}
    </Screen>
  );
}

function TaskContent({
  task,
  busy,
  editDisabled,
  isCompleting,
  completionError,
  onComplete,
  onEdit,
  onChecklistDraftChange,
  onChecklistBusyChange,
  onDateBusyChange,
}: {
  task: TaskResponse;
  busy: boolean;
  editDisabled: boolean;
  isCompleting: boolean;
  completionError?: string | null;
  onComplete: () => void;
  onEdit: () => void;
  onChecklistDraftChange: (draft: boolean) => void;
  onChecklistBusyChange: (busy: boolean) => void;
  onDateBusyChange: (busy: boolean) => void;
}) {
  const theme = useAppTheme();
  const { fontScale } = useMobileLayout();
  const today = useAppToday();
  const [dateExpanded, setDateExpanded] = useState(false);
  const titleLineHeight = typography.lineHeight.title * fontScale;
  const leadingHeight = Math.max(sizes.touchTarget, titleLineHeight);
  const done = task.status === 'DONE';
  const recurrenceLabel = getRecurrenceLabel(task);
  const scheduleLabel = getScheduleLabel(task);
  const plannedLabel = task.plannedDate
    ? `${task.plannedDate === today ? '오늘 · ' : ''}${formatDateLabel(task.plannedDate)}`
    : '날짜 없음 · 기록함';
  return (
    <View style={panelStyles.content}>
      <View
        {...uiAuditProps({ uiRow: 'detail-title', uiAlign: 'title-line' })}
        style={panelStyles.titleRow}
      >
        <Pressable
          {...uiAuditProps({ uiIcon: 'control', uiTouch: '44' })}
          accessibilityRole="checkbox"
          accessibilityLabel={`${task.title} ${done ? '완료 취소' : '완료하기'}`}
          accessibilityHint={
            done
              ? '오늘 목록으로 되돌립니다.'
              : '할 일 전체를 완료합니다. 체크리스트와 별도 동작이에요.'
          }
          accessibilityState={{ checked: done, disabled: busy, busy: isCompleting }}
          aria-checked={done}
          disabled={busy}
          onPress={onComplete}
          style={[panelStyles.checkTarget, { height: leadingHeight }]}
        >
          {isCompleting ? (
            <ActivityIndicator color={theme.colors.primary} />
          ) : (
            <MaterialCommunityIcons
              accessible={false}
              aria-hidden
              name={done ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
              size={24}
              color={done ? theme.colors.primary : theme.colors.textMuted}
            />
          )}
        </Pressable>
        <View style={{ flex: 1, minWidth: 0, paddingTop: (leadingHeight - titleLineHeight) / 2 }}>
          <AppText
            {...uiAuditProps({ uiText: 'title' })}
            accessibilityRole="header"
            variant="title"
            weight="semibold"
            style={done && { color: theme.colors.textMuted, textDecorationLine: 'line-through' }}
          >
            {task.title}
          </AppText>
        </View>
      </View>
      {completionError ? <InlineNotice tone="danger" message={completionError} /> : null}
      <View style={panelStyles.fields}>
        {scheduleLabel !== '없음' ? (
          <DetailField
            icon="clock"
            label="일정"
            value={scheduleLabel}
            disabled={editDisabled}
            onPress={onEdit}
          />
        ) : null}
        <DetailField
          icon="calendar"
          label={done ? '계획일' : '실행일'}
          value={plannedLabel}
          disabled={busy || done}
          expanded={dateExpanded}
          onPress={() => setDateExpanded((value) => !value)}
        />
        {dateExpanded && !done ? (
          <TaskDateQuickActions
            task={task}
            grouped
            showHeading={false}
            onBusyChange={onDateBusyChange}
          />
        ) : null}
        {recurrenceLabel ? (
          <AppText tone="secondary" variant="caption" style={panelStyles.fieldNote}>
            {recurrenceLabel}
          </AppText>
        ) : null}
        {task.targetDate ? (
          <AppText tone="secondary" variant="caption" style={panelStyles.fieldNote}>
            목표일 {formatDateLabel(task.targetDate)}
          </AppText>
        ) : null}
        {task.estimatedDurationMinutes ? (
          <AppText tone="secondary" variant="caption" style={panelStyles.fieldNote}>
            예상 {formatEstimatedDuration(task.estimatedDurationMinutes)}
          </AppText>
        ) : null}
        {task.category ? (
          <AppText tone="secondary" variant="caption" style={panelStyles.fieldNote}>
            {task.category}
          </AppText>
        ) : null}
      </View>
      {task.description ? <AppText tone="secondary">{task.description}</AppText> : null}
      <TaskChecklistSection
        taskId={task.id}
        grouped
        compact
        onDraftChange={onChecklistDraftChange}
        onBusyChange={onChecklistBusyChange}
      />
    </View>
  );
}

function DetailField({
  icon,
  label,
  value,
  disabled,
  expanded,
  onPress,
}: {
  icon: 'clock' | 'calendar';
  label: string;
  value: string;
  disabled: boolean;
  expanded?: boolean;
  onPress: () => void;
}) {
  const theme = useAppTheme();
  return (
    <Pressable
      {...uiAuditProps({ uiRow: 'detail-field', uiAlign: 'text-block', uiTouch: '44' })}
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${value}${icon === 'clock' ? ', 일정 수정' : ', 실행일 변경'}`}
      accessibilityState={{ disabled, expanded }}
      aria-expanded={expanded}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        panelStyles.field,
        { backgroundColor: pressed ? theme.colors.surfaceMuted : 'transparent' },
      ]}
    >
      <AppIcon name={icon} size="list" color={theme.colors.textSecondary} />
      <View {...uiAuditProps({ uiText: 'block' })} style={panelStyles.fieldCopy}>
        <AppText tone="secondary" variant="caption" weight="medium">
          {label}
        </AppText>
        <AppText>{value}</AppText>
      </View>
      {!disabled ? (
        <AppIcon
          name={expanded === undefined ? 'chevron-right' : expanded ? 'chevron-up' : 'chevron-down'}
          size="meta"
          color={theme.colors.textSecondary}
        />
      ) : null}
    </Pressable>
  );
}

function TaskManagement({
  task,
  mode,
  deleteErrorMessage,
  deleteScope,
  isConfirmingDelete,
  isDeleting,
  taskDdayGoal,
  onCancelDelete,
  onConfirmDelete,
  onDeleteScopeChange,
  onRequestDelete,
}: {
  task: TaskResponse;
  mode: ManagementSection;
  deleteErrorMessage?: string | null;
  deleteScope: RecurrenceEditScope;
  isConfirmingDelete: boolean;
  isDeleting: boolean;
  taskDdayGoal: ReturnType<typeof useTaskDdayGoal>;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
  onDeleteScopeChange: (scope: RecurrenceEditScope) => void;
  onRequestDelete: () => void;
}) {
  const theme = useAppTheme();
  const ddayGoals = useDdayGoals();
  const isDdayExpanded = mode === 'goal';
  const isHistoryExpanded = mode === 'history';
  const hasManagementHistory = Boolean(task.deferReasonLabel) || task.carryOverCount > 0;
  return (
    <View style={panelStyles.content}>
      {isDdayExpanded ? (
        <Card variant="grouped" padded={false} style={styles.section}>
          <View style={styles.stateCopy}>
            <AppText variant="bodyLarge" weight="bold">
              D-Day 목표
            </AppText>
            <AppText tone="secondary" variant="label">
              이 할 일을 장기 목표와 연결해 진행 상황을 함께 모아보세요.
            </AppText>
          </View>

          {ddayGoals.isPending ? (
            <View accessibilityLabel="D-Day 목표를 불러오는 중" style={styles.inlineLoading}>
              <ActivityIndicator color={theme.colors.primary} />
              <AppText tone="secondary" variant="label">
                목표를 불러오고 있어요.
              </AppText>
            </View>
          ) : ddayGoals.error ? (
            <InlineNotice
              action={
                <Button
                  disabled={taskDdayGoal.isPending}
                  size="compact"
                  variant="ghost"
                  onPress={() => void ddayGoals.refetch()}
                >
                  다시 시도
                </Button>
              }
              message={ddayGoals.error.message}
              tone="danger"
            />
          ) : ddayGoals.data?.length ? (
            <View style={styles.goalActions}>
              {ddayGoals.data.map((goal) => {
                const isConnected = task.ddayGoalId === goal.id;

                return (
                  <Button
                    key={goal.id}
                    accessibilityLabel={`${goal.title} D-Day 목표${isConnected ? ' 연결됨' : ' 연결하기'}`}
                    disabled={taskDdayGoal.isPending || isConnected}
                    variant={isConnected ? 'primary' : 'secondary'}
                    onPress={() =>
                      taskDdayGoal.mutate({
                        taskId: task.id,
                        ddayGoalId: goal.id,
                      })
                    }
                  >
                    {isConnected ? `✓ ${goal.title}` : goal.title}
                  </Button>
                );
              })}
              {task.ddayGoalId !== null ? (
                <Button
                  disabled={taskDdayGoal.isPending}
                  loading={taskDdayGoal.isPending}
                  variant="ghost"
                  onPress={() =>
                    taskDdayGoal.mutate({
                      taskId: task.id,
                      ddayGoalId: null,
                    })
                  }
                >
                  목표 연결 해제
                </Button>
              ) : null}
              {taskDdayGoal.isPending ? (
                <View accessibilityLiveRegion="polite" style={styles.inlineLoading}>
                  <ActivityIndicator color={theme.colors.primary} />
                  <AppText tone="secondary" variant="label">
                    목표 연결을 변경하고 있어요.
                  </AppText>
                </View>
              ) : null}
            </View>
          ) : (
            <AppText tone="muted" variant="label">
              연결할 기존 목표가 없어요.
            </AppText>
          )}

          {taskDdayGoal.error ? (
            <InlineNotice message={taskDdayGoal.error.message} tone="danger" />
          ) : null}
        </Card>
      ) : null}

      {isHistoryExpanded ? (
        <Card variant="grouped" padded={false} style={styles.footerCard}>
          <AppText accessibilityRole="header" variant="sectionTitle" weight="semibold">
            기록 정보
          </AppText>
          <InfoRow label="생성" value={getDateTimeLabel(task.createdAt)} />
          {task.updatedAt ? (
            <InfoRow label="수정" value={getDateTimeLabel(task.updatedAt)} />
          ) : null}
          {task.completedAt ? (
            <InfoRow label="완료" value={getDateTimeLabel(task.completedAt)} />
          ) : null}
          {hasManagementHistory ? (
            <>
              {task.deferReasonLabel ? (
                <InfoRow label="미룬 이유" value={task.deferReasonLabel} />
              ) : null}
              {task.carryOverCount > 0 ? (
                <InfoRow label="이월 횟수" value={`${task.carryOverCount}회`} />
              ) : null}
            </>
          ) : null}
        </Card>
      ) : null}
      {mode === 'delete' ? (
        <>
          {' '}
          {isConfirmingDelete ? (
            <Card
              style={[
                styles.deleteCard,
                { backgroundColor: theme.colors.dangerSoft, borderColor: theme.colors.danger },
              ]}
            >
              <View style={styles.stateCopy}>
                <AppText tone="danger" variant="label" weight="bold">
                  정말 삭제할까요?
                </AppText>
                <AppText tone="secondary" variant="caption">
                  삭제한 할 일은 현재 앱에서 되돌릴 수 없어요.
                </AppText>
              </View>

              {isRecurringTask(task) ? (
                <RecurrenceScopePicker
                  title="반복 삭제 범위"
                  description="반복 일정 중 삭제할 범위를 선택해 주세요."
                  value={deleteScope}
                  onChange={onDeleteScopeChange}
                />
              ) : null}

              {deleteErrorMessage ? (
                <AppText accessibilityLiveRegion="polite" tone="danger" variant="caption">
                  {deleteErrorMessage}
                </AppText>
              ) : null}

              <View style={styles.deleteActions}>
                <Button disabled={isDeleting} fullWidth variant="ghost" onPress={onCancelDelete}>
                  취소
                </Button>
                <Button fullWidth loading={isDeleting} variant="danger" onPress={onConfirmDelete}>
                  영구 삭제
                </Button>
              </View>
            </Card>
          ) : (
            <Button
              contentAlignment="start"
              fullWidth
              size="compact"
              style={styles.ddayToggle}
              disabled={isDeleting}
              variant="ghost"
              onPress={onRequestDelete}
            >
              이 할 일 삭제
            </Button>
          )}
        </>
      ) : null}
    </View>
  );
}

type RecurrenceScopePickerProps = {
  title: string;
  description: string;
  value: RecurrenceEditScope;
  onChange: (scope: RecurrenceEditScope) => void;
};

function RecurrenceScopePicker({
  title,
  description,
  value,
  onChange,
}: RecurrenceScopePickerProps) {
  return (
    <Card variant="outlined" style={styles.scopeCard}>
      <View style={styles.stateCopy}>
        <AppText variant="label" weight="bold">
          {title}
        </AppText>
        <AppText tone="secondary" variant="caption">
          {description}
        </AppText>
      </View>
      <View style={styles.scopeActions}>
        {recurrenceScopeOptions.map((option) => (
          <Button
            key={option.value}
            accessibilityState={{ selected: option.value === value }}
            size="compact"
            variant={option.value === value ? 'primary' : 'secondary'}
            onPress={() => onChange(option.value)}
            style={styles.scopeButton}
          >
            {option.label}
          </Button>
        ))}
      </View>
      <AppText tone="muted" variant="caption">
        {recurrenceScopeOptions.find((option) => option.value === value)?.description}
      </AppText>
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <AppText tone="secondary" variant="caption" style={styles.infoLabel}>
        {label}
      </AppText>
      <AppText variant="body" style={styles.infoValue}>
        {value}
      </AppText>
    </View>
  );
}

function parseTaskId(value: string | string[] | undefined) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const numericValue = Number(rawValue);

  if (!rawValue || !Number.isInteger(numericValue) || numericValue <= 0) {
    return null;
  }

  return numericValue;
}

function getScheduleLabel(task: TaskResponse) {
  if (task.allDay) {
    return '종일';
  }

  if (task.startAt && task.endAt) {
    return `${getDateTimeLabel(task.startAt)} - ${formatTimeLabel(task.endAt)}`;
  }

  if (task.startAt) {
    return getDateTimeLabel(task.startAt);
  }

  return task.unscheduled ? '시간 미정' : '없음';
}

function getDateTimeLabel(value: TaskResponse['createdAt']) {
  const [date] = value.split('T');

  return `${formatDateLabel(date as TaskResponse['plannedDate'] & string)} ${formatTimeLabel(value)}`;
}

function isRecurringTask(task: TaskResponse) {
  return Boolean(task.recurrence ?? task.recurrenceRule ?? task.recurrenceSeriesId);
}

const recurrenceScopeOptions: {
  value: RecurrenceEditScope;
  label: string;
  description: string;
}[] = [
  {
    value: 'THIS',
    label: '이번만',
    description: '선택한 발생 항목 하나에만 적용합니다.',
  },
  {
    value: 'THIS_AND_FUTURE',
    label: '이후 모두',
    description: '선택한 날짜와 이후 반복 항목에 적용합니다.',
  },
  {
    value: 'ALL',
    label: '전체',
    description: '반복 묶음 전체에 적용합니다.',
  },
];

const styles = StyleSheet.create({
  screen: {
    gap: spacing[4],
    paddingTop: spacing[4],
  },
  headerButton: {
    backgroundColor: 'transparent',
  },
  loadingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[3],
    justifyContent: 'center',
    minHeight: 64,
  },
  stateCopy: {
    gap: spacing[1],
  },
  detail: {
    gap: spacing[6],
  },
  editing: {
    gap: spacing[4],
  },
  heroCard: {
    gap: spacing[3],
  },
  deleteCard: {
    gap: spacing[4],
  },
  deleteActions: {
    gap: spacing[2],
  },
  scopeActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  scopeButton: {
    flexGrow: 1,
  },
  scopeCard: {
    gap: spacing[2],
  },
  goalActions: {
    gap: spacing[2],
  },
  inlineLoading: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[2],
  },
  statusRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[2],
    flexWrap: 'wrap',
  },
  statusBadge: {
    borderRadius: radii.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
  },
  titleBlock: {
    gap: spacing[2],
  },
  section: {
    gap: spacing[2],
  },
  footerCard: {
    gap: spacing[2],
  },
  infoRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: spacing[3],
    paddingVertical: spacing[1],
  },
  infoLabel: { width: 64 },
  infoValue: {
    flex: 1,
    minWidth: 0,
  },
  ddayToggle: {
    paddingHorizontal: 0,
  },
});

const panelStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    minHeight: sizes.touchTarget,
  },
  editButton: { paddingHorizontal: spacing[2] },
  content: { gap: spacing[6] },
  menu: { alignSelf: 'flex-end', gap: spacing[1] },
  confirmActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[2], marginLeft: -10 },
  checkTarget: { width: sizes.touchTarget, alignItems: 'center', justifyContent: 'center' },
  fields: { gap: spacing[4] },
  field: { flexDirection: 'row', alignItems: 'center', gap: spacing[5], minHeight: 48 },
  fieldCopy: { flex: 1, minWidth: 0, gap: spacing[1] },
  fieldNote: { marginLeft: sizes.listIcon + spacing[5] },
});
