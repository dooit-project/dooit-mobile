import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import {
  AppText,
  Button,
  Card,
  EmptyState,
  InlineNotice,
  ListSkeleton,
  SectionHeader,
} from '@/components/ui';
import { getDdayLabel, validateDdayGoal } from '@/features/dday';
import { getUserFacingApiErrorMessage } from '@/services/api';
import { radii, spacing, useAppTheme } from '@/theme';
import { ddayGoalLimits } from '@/types';
import type { DdayGoalRequest, DdayGoalResponse } from '@/types';
import { formatDateLabel } from '@/utils';

import {
  useCreateWorkspaceDdayGoal,
  useDeleteWorkspaceDdayGoal,
  useWorkspaceDdayGoals,
} from './use-workspace-ddays';

export function WorkspaceDdaySection({
  workspaceId,
  canEdit,
}: {
  workspaceId: number;
  canEdit: boolean;
}) {
  const goals = useWorkspaceDdayGoals(workspaceId);
  const [showCreate, setShowCreate] = useState(false);

  return (
    <View style={styles.section}>
      <SectionHeader
        title="공유 D-Day"
        count={goals.data?.length ?? 0}
        action={
          canEdit ? (
            <Button size="compact" variant="secondary" onPress={() => setShowCreate((v) => !v)}>
              {showCreate ? '닫기' : '목표 추가'}
            </Button>
          ) : undefined
        }
      />
      <AppText tone="secondary" variant="caption">
        이 공간의 멤버가 함께 확인하는 목표일이에요.
      </AppText>
      {showCreate ? (
        <WorkspaceDdayCreateForm workspaceId={workspaceId} onClose={() => setShowCreate(false)} />
      ) : null}
      {goals.isPending ? (
        <ListSkeleton accessibilityLabel="공유 D-Day를 불러오는 중" count={2} />
      ) : goals.error ? (
        <InlineNotice
          action={
            <Button size="compact" variant="ghost" onPress={() => void goals.refetch()}>
              다시 시도
            </Button>
          }
          message={getUserFacingApiErrorMessage(goals.error)}
          title="공유 D-Day를 불러오지 못했어요"
          tone="danger"
        />
      ) : goals.data?.length ? (
        <View style={styles.goalList}>
          {goals.data.map((goal) => (
            <WorkspaceDdayCard
              key={goal.id}
              canEdit={canEdit}
              goal={goal}
              workspaceId={workspaceId}
            />
          ))}
        </View>
      ) : (
        <EmptyState
          title="공유 D-Day가 없어요"
          description="팀이 함께 바라볼 목표일을 등록해 보세요."
        />
      )}
    </View>
  );
}

function WorkspaceDdayCreateForm({
  workspaceId,
  onClose,
}: {
  workspaceId: number;
  onClose: () => void;
}) {
  const theme = useAppTheme();
  const create = useCreateWorkspaceDdayGoal(workspaceId);
  const [title, setTitle] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [errors, setErrors] = useState<ReturnType<typeof validateDdayGoal>>({});
  const submit = () => {
    const nextErrors = validateDdayGoal({ title, targetDate });
    if (Object.keys(nextErrors).length) return setErrors(nextErrors);
    create.mutate(
      { title: title.trim(), targetDate: targetDate.trim() as DdayGoalRequest['targetDate'] },
      { onSuccess: onClose },
    );
  };

  return (
    <Card style={styles.form}>
      <View style={styles.copy}>
        <AppText variant="bodyLarge" weight="bold">
          공유 목표일 추가
        </AppText>
        <AppText tone="secondary" variant="caption">
          개인 D-Day와 분리되어 이 공간에서만 보여요.
        </AppText>
      </View>
      <View style={styles.field}>
        <AppText variant="label" weight="bold">
          목표 이름 · {title.length}/{ddayGoalLimits.title}
        </AppText>
        <TextInput
          accessibilityLabel="공유 D-Day 목표 이름"
          maxLength={ddayGoalLimits.title}
          onChangeText={(value) => {
            setTitle(value);
            setErrors((current) => ({ ...current, title: undefined }));
          }}
          placeholder="예: 정식 출시"
          placeholderTextColor={theme.colors.textMuted}
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.surfaceMuted,
              borderColor: errors.title ? theme.colors.danger : theme.colors.border,
              color: theme.colors.text,
            },
          ]}
          value={title}
        />
        {errors.title ? (
          <AppText tone="danger" variant="caption">
            {errors.title}
          </AppText>
        ) : null}
      </View>
      <View style={styles.field}>
        <AppText variant="label" weight="bold">
          목표 날짜
        </AppText>
        <TextInput
          accessibilityLabel="공유 D-Day 목표 날짜"
          autoCapitalize="none"
          maxLength={10}
          onChangeText={(value) => {
            setTargetDate(value);
            setErrors((current) => ({ ...current, targetDate: undefined }));
          }}
          onSubmitEditing={submit}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={theme.colors.textMuted}
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.surfaceMuted,
              borderColor: errors.targetDate ? theme.colors.danger : theme.colors.border,
              color: theme.colors.text,
            },
          ]}
          value={targetDate}
        />
        {errors.targetDate ? (
          <AppText tone="danger" variant="caption">
            {errors.targetDate}
          </AppText>
        ) : null}
      </View>
      {create.error ? <InlineNotice message={create.error.message} tone="danger" /> : null}
      <View style={styles.actions}>
        <Button disabled={create.isPending} fullWidth variant="secondary" onPress={onClose}>
          취소
        </Button>
        <Button fullWidth loading={create.isPending} onPress={submit}>
          공유 목표 만들기
        </Button>
      </View>
    </Card>
  );
}

function WorkspaceDdayCard({
  workspaceId,
  goal,
  canEdit,
}: {
  workspaceId: number;
  goal: DdayGoalResponse;
  canEdit: boolean;
}) {
  const theme = useAppTheme();
  const remove = useDeleteWorkspaceDdayGoal(workspaceId);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const dayLabel = getDdayLabel(goal.daysLeft);

  return (
    <View style={styles.goalItem}>
      <Card style={styles.goalCard}>
        <View style={styles.goalCopy}>
          <AppText numberOfLines={2} weight="semibold">
            {goal.title}
          </AppText>
          <AppText tone="secondary" variant="caption">
            {formatDateLabel(goal.targetDate, { year: 'numeric', month: 'long', day: 'numeric' })}
          </AppText>
        </View>
        <AppText tone={goal.daysLeft < 0 ? 'secondary' : 'primary'} weight="heavy">
          {dayLabel}
        </AppText>
      </Card>
      {canEdit && !confirmDelete ? (
        <View style={styles.goalActions}>
          <Button size="compact" variant="ghost" onPress={() => setConfirmDelete(true)}>
            삭제
          </Button>
        </View>
      ) : null}
      {confirmDelete ? (
        <View style={[styles.confirmation, { backgroundColor: theme.colors.dangerSoft }]}>
          <AppText tone="danger" variant="label" weight="bold">
            “{goal.title}” 공유 목표를 삭제할까요?
          </AppText>
          <AppText tone="secondary" variant="caption">
            연결된 공유 일정은 유지되고 D-Day 연결만 해제돼요.
          </AppText>
          {remove.error ? <InlineNotice message={remove.error.message} tone="danger" /> : null}
          <View style={styles.actions}>
            <Button
              disabled={remove.isPending}
              fullWidth
              variant="secondary"
              onPress={() => setConfirmDelete(false)}
            >
              취소
            </Button>
            <Button
              fullWidth
              loading={remove.isPending}
              variant="danger"
              onPress={() => remove.mutate(goal.id)}
            >
              공유 목표 삭제
            </Button>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing[3] },
  goalList: { gap: spacing[2] },
  goalItem: { gap: spacing[2] },
  goalCard: { alignItems: 'center', flexDirection: 'row', gap: spacing[3] },
  goalCopy: { flex: 1, gap: spacing[1], minWidth: 0 },
  goalActions: { alignItems: 'flex-end' },
  form: { gap: spacing[4] },
  copy: { gap: spacing[1] },
  field: { gap: spacing[2] },
  input: {
    borderRadius: radii.md,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 48,
    padding: spacing[3],
  },
  actions: { gap: spacing[2] },
  confirmation: { borderRadius: radii.md, gap: spacing[2], padding: spacing[3] },
});
