import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import {
  AppText,
  Button,
  Card,
  IconButton,
  InlineNotice,
  PageHeader,
  Screen,
  SectionHeader,
} from '@/components/ui';
import { useDdayGoals } from '@/features/dday';
import {
  TaskDateQuickActions,
  TaskForm,
  getRecurrenceLabel,
  useDeleteTask,
  useTaskDdayGoal,
  useTaskDetail,
  useUpdateTask,
} from '@/features/tasks';
import { radii, spacing, useAppTheme } from '@/theme';
import type {
  RecurrenceEditScope,
  TaskResponse,
  TaskStatus,
  TaskType,
  TaskUpsertRequest,
} from '@/types';
import { formatDateLabel, formatTimeLabel } from '@/utils';

export default function TaskDetailScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { taskId } = useLocalSearchParams<{ taskId?: string | string[] }>();
  const parsedTaskId = parseTaskId(taskId);
  const taskQuery = useTaskDetail(parsedTaskId);
  const deleteTask = useDeleteTask();
  const updateTask = useUpdateTask();
  const taskDdayGoal = useTaskDdayGoal();
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [editScope, setEditScope] = useState<RecurrenceEditScope>('THIS');
  const [deleteScope, setDeleteScope] = useState<RecurrenceEditScope>('THIS');

  const startEditing = () => {
    setEditScope('THIS');
    setIsEditing(true);
  };

  const handleSubmit = (request: TaskUpsertRequest) => {
    if (parsedTaskId === null) {
      return;
    }

    const recurrenceScope =
      taskQuery.data && isRecurringTask(taskQuery.data) ? editScope : undefined;

    updateTask.mutate(
      { taskId: parsedTaskId, request, recurrenceScope },
      {
        onSuccess: () => {
          setIsEditing(false);
        },
      },
    );
  };

  const handleDelete = () => {
    if (parsedTaskId === null) {
      return;
    }

    const recurrenceScope =
      taskQuery.data && isRecurringTask(taskQuery.data) ? deleteScope : undefined;

    deleteTask.mutate(
      { taskId: parsedTaskId, recurrenceScope },
      {
        onSuccess: () => {
          router.replace('/');
        },
      },
    );
  };

  return (
    <Screen scroll contentContainerStyle={styles.screen}>
      <PageHeader
        title={isEditing ? '할 일 수정' : '할 일 상세'}
        leading={
          <IconButton
            accessibilityLabel="이전 화면으로 돌아가기"
            onPress={router.back}
            style={styles.headerButton}
          >
            <SymbolView
              name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
              size={20}
              tintColor={theme.colors.text}
            />
          </IconButton>
        }
        action={
          taskQuery.data && !isEditing ? (
            <Button
              accessibilityLabel="할 일 수정"
              disabled={deleteTask.isPending || isConfirmingDelete}
              leading={
                <SymbolView
                  name={{ ios: 'square.and.pencil', android: 'edit', web: 'edit' }}
                  size={16}
                  tintColor={theme.colors.primary}
                />
              }
              size="compact"
              variant="secondary"
              onPress={startEditing}
            >
              수정
            </Button>
          ) : null
        }
      />

      {parsedTaskId === null ? (
        <InlineNotice
          message="올바르지 않은 상세 주소예요. 목록에서 다시 선택해 주세요."
          title="Task를 찾을 수 없어요"
          tone="danger"
        />
      ) : taskQuery.isPending ? (
        <View accessibilityLabel="Task 상세를 불러오는 중" style={styles.loadingRow}>
          <ActivityIndicator color={theme.colors.primary} />
          <AppText tone="secondary" variant="label">
            할 일 정보를 불러오고 있어요.
          </AppText>
        </View>
      ) : taskQuery.error ? (
        <InlineNotice
          action={
            <Button size="compact" variant="ghost" onPress={() => void taskQuery.refetch()}>
              다시 시도
            </Button>
          }
          message={taskQuery.error.message}
          title="상세 정보를 불러오지 못했어요"
          tone="danger"
        />
      ) : taskQuery.data && isEditing ? (
        <View style={styles.editing}>
          {isRecurringTask(taskQuery.data) ? (
            <RecurrenceScopePicker
              title="반복 수정 범위"
              description="어느 반복 항목까지 수정할지 먼저 선택해 주세요."
              value={editScope}
              onChange={setEditScope}
            />
          ) : null}
          <TaskForm
            errorMessage={updateTask.error?.message}
            initialTask={taskQuery.data}
            isSubmitting={updateTask.isPending}
            submitLabel="수정 완료"
            onCancel={() => {
              updateTask.reset();
              setIsEditing(false);
            }}
            onSubmit={handleSubmit}
          />
        </View>
      ) : taskQuery.data ? (
        <TaskDetail
          deleteErrorMessage={deleteTask.error?.message}
          deleteScope={deleteScope}
          isConfirmingDelete={isConfirmingDelete}
          isDeleting={deleteTask.isPending}
          taskDdayGoal={taskDdayGoal}
          task={taskQuery.data}
          onCancelDelete={() => {
            deleteTask.reset();
            setIsConfirmingDelete(false);
          }}
          onConfirmDelete={handleDelete}
          onDeleteScopeChange={setDeleteScope}
          onRequestDelete={() => {
            setDeleteScope('THIS');
            setIsConfirmingDelete(true);
          }}
        />
      ) : null}
    </Screen>
  );
}

function TaskDetail({
  task,
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
  const [isDdayExpanded, setIsDdayExpanded] = useState(false);
  const status = statusLabels[task.status];
  const scheduleLabel = getScheduleLabel(task);
  const recurrenceLabel = getRecurrenceLabel(task);
  const hasManagementHistory = Boolean(task.deferReasonLabel) || task.carryOverCount > 0;

  return (
    <View style={styles.detail}>
      <Card variant="outlined" style={styles.heroCard}>
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  task.status === 'DONE' ? theme.colors.successSoft : theme.colors.primarySoft,
              },
            ]}
          >
            <AppText
              tone={task.status === 'DONE' ? 'success' : 'primary'}
              variant="caption"
              weight="bold"
            >
              {status}
            </AppText>
          </View>
          <AppText tone="secondary" variant="caption" weight="semibold">
            {typeLabels[task.type]}
          </AppText>
        </View>

        <View style={styles.titleBlock}>
          <AppText variant="title" weight="heavy">
            {task.title}
          </AppText>
          {task.description ? (
            <AppText tone="secondary" variant="body">
              {task.description}
            </AppText>
          ) : (
            <AppText tone="muted" variant="label">
              아직 설명이 없어요.
            </AppText>
          )}
        </View>
      </Card>

      <TaskDateQuickActions task={task} />

      <Card variant="outlined" style={styles.section}>
        <SectionHeader title="일정 정보" />
        <InfoRow label="일정" value={scheduleLabel} />
        <InfoRow label="반복" value={recurrenceLabel ?? '없음'} />
        <InfoRow
          label="계획일"
          value={task.plannedDate ? formatDateLabel(task.plannedDate) : '없음'}
        />
        <InfoRow
          label="목표일"
          value={task.targetDate ? formatDateLabel(task.targetDate) : '없음'}
        />
        <InfoRow label="종일" value={task.allDay ? '예' : '아니오'} />
        <InfoRow label="카테고리" value={task.category ?? '없음'} />
      </Card>

      <Button
        accessibilityState={{ expanded: isDdayExpanded }}
        size="compact"
        variant="ghost"
        onPress={() => setIsDdayExpanded((current) => !current)}
        style={styles.ddayToggle}
      >
        {isDdayExpanded ? 'D-Day 목표 관리 접기' : `D-Day 목표 · ${getDdayLabel(task)}`}
      </Button>

      {isDdayExpanded ? (
        <Card variant="outlined" style={styles.section}>
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
              연결할 D-Day 목표가 없어요. D-Day 탭에서 먼저 목표를 만들어 주세요.
            </AppText>
          )}

          {taskDdayGoal.error ? (
            <InlineNotice message={taskDdayGoal.error.message} tone="danger" />
          ) : null}
        </Card>
      ) : null}

      {hasManagementHistory ? (
        <Card variant="outlined" style={styles.section}>
          <SectionHeader title="관리 기록" />
          {task.deferReasonLabel ? (
            <InfoRow label="미룬 이유" value={task.deferReasonLabel} />
          ) : null}
          {task.carryOverCount > 0 ? (
            <InfoRow label="이월 횟수" value={`${task.carryOverCount}회`} />
          ) : null}
        </Card>
      ) : null}

      <Card variant="outlined" style={styles.footerCard}>
        <InfoRow label="생성" value={getDateTimeLabel(task.createdAt)} />
        <InfoRow label="수정" value={task.updatedAt ? getDateTimeLabel(task.updatedAt) : '없음'} />
        <InfoRow
          label="완료"
          value={task.completedAt ? getDateTimeLabel(task.completedAt) : '없음'}
        />
      </Card>

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
        <Button disabled={isDeleting} variant="ghost" onPress={onRequestDelete}>
          이 할 일 삭제
        </Button>
      )}
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
  const theme = useAppTheme();

  return (
    <View style={[styles.infoRow, { borderBottomColor: theme.colors.rule }]}>
      <AppText tone="secondary" variant="label" weight="semibold">
        {label}
      </AppText>
      <AppText align="right" variant="label" weight="bold" style={styles.infoValue}>
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

function getDdayLabel(task: TaskResponse) {
  if (!task.ddayGoalTitle) {
    return '없음';
  }

  if (task.ddayDaysLeft === null) {
    return task.ddayGoalTitle;
  }

  const dayLabel =
    task.ddayDaysLeft === 0
      ? 'D-Day'
      : task.ddayDaysLeft > 0
        ? `D-${task.ddayDaysLeft}`
        : `D+${Math.abs(task.ddayDaysLeft)}`;

  return `${task.ddayGoalTitle} · ${dayLabel}`;
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

const statusLabels: Record<TaskStatus, string> = {
  DONE: '완료',
  INBOX: '기록함',
  TODAY: '오늘',
};

const typeLabels: Record<TaskType, string> = {
  IDEA: '아이디어',
  SCHEDULE: '일정',
  TODO: '할 일',
};

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
    gap: spacing[3],
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
    justifyContent: 'space-between',
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
    alignItems: 'flex-start',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing[3],
    justifyContent: 'space-between',
    paddingVertical: spacing[2],
  },
  infoValue: {
    flex: 1,
  },
  ddayToggle: {
    alignSelf: 'flex-start',
  },
});
