import { useState } from 'react';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import {
  AppText,
  Button,
  Card,
  EmptyState,
  IconButton,
  InlineNotice,
  ListSkeleton,
  PageHeader,
  Screen,
  SectionHeader,
} from '@/components/ui';
import { useAuthState } from '@/features/auth';
import { ScheduleCard, TaskCard } from '@/features/tasks';
import { getUserFacingApiErrorMessage } from '@/services/api';
import { radii, spacing, useAppTheme } from '@/theme';
import type {
  LocalDateString,
  TaskResponse,
  TaskType,
  WorkspaceMemberResponse,
  WorkspaceRole,
} from '@/types';
import { taskLimits } from '@/types';
import { formatDateLabel, shiftLocalDate, toApiLocalDate } from '@/utils';
import {
  useInviteWorkspaceMember,
  useRemoveWorkspaceMember,
  useUpdateWorkspaceMemberRole,
} from './use-workspace-member-mutations';
import { useWorkspace, useWorkspaceMembers } from './use-workspaces';
import { useCreateWorkspaceTask, useWorkspaceTasks } from './use-workspace-tasks';

const roleLabels: Record<WorkspaceRole, string> = {
  OWNER: '관리자',
  EDITOR: '편집 가능',
  VIEWER: '보기 전용',
};

export function WorkspaceDetail({ workspaceId }: { workspaceId: number | null }) {
  const router = useRouter();
  const theme = useAppTheme();
  const auth = useAuthState();
  const [showInvite, setShowInvite] = useState(false);
  const detail = useWorkspace(workspaceId ?? 0);
  const members = useWorkspaceMembers(workspaceId ?? 0);
  const me =
    auth.status === 'registered'
      ? members.data?.find((item) => item.userId === auth.user.id)
      : undefined;
  const retry = () => {
    void detail.refetch();
    void members.refetch();
  };
  return (
    <Screen scroll contentContainerStyle={styles.screen}>
      <PageHeader
        title={detail.data?.name ?? '공유 공간'}
        description={detail.data?.description ?? undefined}
        leading={
          <IconButton accessibilityLabel="공유 공간 목록으로 돌아가기" onPress={router.back}>
            <SymbolView
              name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
              size={20}
              tintColor={theme.colors.text}
            />
          </IconButton>
        }
        action={
          me?.role === 'OWNER' ? (
            <Button size="compact" variant="secondary" onPress={() => setShowInvite((v) => !v)}>
              {showInvite ? '닫기' : '멤버 초대'}
            </Button>
          ) : undefined
        }
      />
      {workspaceId === null ? (
        <InlineNotice
          title="공유 공간을 찾을 수 없어요"
          message="목록에서 공유 공간을 다시 선택해 주세요."
          tone="danger"
        />
      ) : detail.isPending || members.isPending ? (
        <View accessibilityLabel="공유 공간 상세를 불러오는 중" style={styles.state}>
          <ActivityIndicator color={theme.colors.primary} />
          <AppText tone="secondary">공유 정보를 불러오고 있어요.</AppText>
        </View>
      ) : detail.error || members.error ? (
        <InlineNotice
          title="공유 정보를 불러오지 못했어요"
          message={(detail.error ?? members.error)?.message ?? '잠시 후 다시 시도해 주세요.'}
          tone="danger"
          action={
            <Button size="compact" variant="ghost" onPress={retry}>
              다시 시도
            </Button>
          }
        />
      ) : (
        <>
          {showInvite && workspaceId !== null ? (
            <InviteMemberForm workspaceId={workspaceId} onClose={() => setShowInvite(false)} />
          ) : null}
          <Card style={styles.summary}>
            <AppText weight="bold">내 권한</AppText>
            <AppText tone="primary" variant="bodyLarge" weight="bold">
              {me ? roleLabels[me.role] : '확인되지 않음'}
            </AppText>
            <AppText tone="secondary" variant="caption">
              {me?.role === 'VIEWER'
                ? '일정과 목표를 볼 수 있어요.'
                : '공유 일정과 목표를 함께 관리할 수 있어요.'}
            </AppText>
          </Card>
          <WorkspaceTaskList
            canEdit={me?.role === 'OWNER' || me?.role === 'EDITOR'}
            workspaceId={workspaceId!}
          />
          <View style={styles.list}>
            <SectionHeader title="함께하는 사람" count={members.data?.length ?? 0} />
            {members.data?.length ? (
              members.data.map((member) => (
                <WorkspaceMemberCard
                  key={member.id}
                  canManage={me?.role === 'OWNER'}
                  member={member}
                  workspaceId={workspaceId!}
                />
              ))
            ) : (
              <EmptyState
                title="멤버 정보를 찾을 수 없어요"
                description="잠시 후 다시 불러와 주세요."
              />
            )}
          </View>
        </>
      )}
    </Screen>
  );
}

function WorkspaceTaskList({ workspaceId, canEdit }: { workspaceId: number; canEdit: boolean }) {
  const today = toApiLocalDate();
  const tasks = useWorkspaceTasks(workspaceId, { type: 'DAY', date: today });
  const dateLabel = formatDateLabel(today, { month: 'long', day: 'numeric', weekday: 'short' });
  const [showCreate, setShowCreate] = useState(false);

  return (
    <View style={styles.list}>
      <SectionHeader
        title={`공유 일정 · ${dateLabel}`}
        count={tasks.data?.length ?? 0}
        action={
          canEdit ? (
            <Button size="compact" variant="secondary" onPress={() => setShowCreate((v) => !v)}>
              {showCreate ? '닫기' : '일정 추가'}
            </Button>
          ) : undefined
        }
      />
      <AppText tone="secondary" variant="caption">
        이 공간의 일정만 표시해 개인 일정과 섞이지 않아요.
      </AppText>
      {showCreate ? (
        <CreateWorkspaceTaskForm
          date={today}
          workspaceId={workspaceId}
          onClose={() => setShowCreate(false)}
        />
      ) : null}
      {tasks.isPending ? (
        <ListSkeleton accessibilityLabel="오늘 공유 일정을 불러오는 중" count={2} />
      ) : tasks.error ? (
        <InlineNotice
          action={
            <Button size="compact" variant="ghost" onPress={() => void tasks.refetch()}>
              다시 시도
            </Button>
          }
          message={getUserFacingApiErrorMessage(tasks.error)}
          title="공유 일정을 불러오지 못했어요"
          tone="danger"
        />
      ) : tasks.data?.length ? (
        <View style={styles.taskList}>
          {tasks.data.map((task) => (
            <WorkspaceTaskCard key={task.id} date={today} task={task} />
          ))}
        </View>
      ) : (
        <EmptyState
          title="오늘 공유 일정이 없어요"
          description="공간 멤버가 함께 볼 일정은 아직 등록되지 않았어요."
        />
      )}
    </View>
  );
}

function CreateWorkspaceTaskForm({
  workspaceId,
  date,
  onClose,
}: {
  workspaceId: number;
  date: LocalDateString;
  onClose: () => void;
}) {
  const theme = useAppTheme();
  const create = useCreateWorkspaceTask(workspaceId);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<Extract<TaskType, 'SCHEDULE' | 'TODO'>>('SCHEDULE');
  const [validationError, setValidationError] = useState(false);
  const submit = () => {
    const normalizedTitle = title.trim();
    const nextDate = shiftLocalDate(date, 1);
    if (!normalizedTitle || !nextDate) return setValidationError(true);
    create.mutate(
      {
        title: normalizedTitle,
        type,
        allDay: true,
        startAt: `${date}T00:00:00`,
        endAt: `${nextDate}T00:00:00`,
      },
      { onSuccess: onClose },
    );
  };

  return (
    <Card style={styles.form}>
      <View style={styles.formCopy}>
        <AppText variant="bodyLarge" weight="bold">
          오늘 공유 일정 추가
        </AppText>
        <AppText tone="secondary" variant="caption">
          공간의 모든 ACTIVE 멤버가 볼 수 있는 종일 일정으로 등록돼요.
        </AppText>
      </View>
      <View style={styles.field}>
        <AppText variant="label" weight="bold">
          제목 · {title.length}/{taskLimits.title}
        </AppText>
        <TextInput
          accessibilityLabel="공유 일정 제목"
          maxLength={taskLimits.title}
          onChangeText={(value) => {
            setTitle(value);
            setValidationError(false);
          }}
          onSubmitEditing={submit}
          placeholder="예: 출시 체크리스트 검토"
          placeholderTextColor={theme.colors.textMuted}
          returnKeyType="done"
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.surfaceMuted,
              borderColor: validationError ? theme.colors.danger : theme.colors.border,
              color: theme.colors.text,
            },
          ]}
          value={title}
        />
        {validationError ? (
          <AppText tone="danger" variant="caption">
            공유 일정 제목을 입력해 주세요.
          </AppText>
        ) : null}
      </View>
      <View style={styles.field}>
        <AppText variant="label" weight="bold">
          종류
        </AppText>
        <View style={styles.roleOptions}>
          {(['SCHEDULE', 'TODO'] as const).map((option) => (
            <Pressable
              key={option}
              accessibilityRole="radio"
              accessibilityState={{ checked: type === option }}
              onPress={() => setType(option)}
              style={[
                styles.roleOption,
                {
                  backgroundColor:
                    type === option ? theme.colors.primarySoft : theme.colors.surfaceMuted,
                  borderColor: type === option ? theme.colors.primary : theme.colors.border,
                },
              ]}
            >
              <AppText tone={type === option ? 'primary' : 'secondary'} weight="bold">
                {option === 'SCHEDULE' ? '일정' : '할 일'}
              </AppText>
            </Pressable>
          ))}
        </View>
      </View>
      {create.error ? <InlineNotice message={create.error.message} tone="danger" /> : null}
      <View style={styles.formActions}>
        <Button disabled={create.isPending} fullWidth variant="secondary" onPress={onClose}>
          취소
        </Button>
        <Button fullWidth loading={create.isPending} onPress={submit}>
          공유 일정 추가
        </Button>
      </View>
    </Card>
  );
}

function WorkspaceTaskCard({ task, date }: { task: TaskResponse; date: LocalDateString }) {
  return task.type === 'SCHEDULE' ? (
    <ScheduleCard referenceDate={date} task={task} />
  ) : (
    <TaskCard showCompletionControl={false} task={task} />
  );
}

type InviteRole = Exclude<WorkspaceRole, 'OWNER'>;

function InviteMemberForm({ workspaceId, onClose }: { workspaceId: number; onClose: () => void }) {
  const theme = useAppTheme();
  const invite = useInviteWorkspaceMember(workspaceId);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<InviteRole>('EDITOR');
  const [validationError, setValidationError] = useState(false);
  const [sent, setSent] = useState(false);
  const submit = () => {
    const normalizedEmail = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) return setValidationError(true);
    invite.mutate(
      { email: normalizedEmail, role },
      {
        onSuccess: () => {
          setSent(true);
          setEmail('');
        },
      },
    );
  };

  return (
    <Card style={styles.form}>
      <View style={styles.formHeading}>
        <View style={styles.formCopy}>
          <AppText variant="bodyLarge" weight="bold">
            멤버 초대
          </AppText>
          <AppText tone="secondary" variant="caption">
            초대를 수락하면 공유 일정과 목표를 함께 볼 수 있어요.
          </AppText>
        </View>
        <Button size="compact" variant="ghost" onPress={onClose}>
          취소
        </Button>
      </View>
      {sent ? (
        <InlineNotice
          title="초대를 보냈어요"
          message="상대가 수락하면 함께하는 사람 목록에 나타나요."
        />
      ) : null}
      <View style={styles.field}>
        <AppText variant="label" weight="bold">
          이메일
        </AppText>
        <TextInput
          accessibilityLabel="초대할 멤버 이메일"
          autoCapitalize="none"
          autoComplete="email"
          inputMode="email"
          maxLength={254}
          onChangeText={(value) => {
            setEmail(value);
            setValidationError(false);
            setSent(false);
          }}
          onSubmitEditing={submit}
          placeholder="name@example.com"
          placeholderTextColor={theme.colors.textMuted}
          returnKeyType="send"
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.surfaceMuted,
              borderColor: validationError ? theme.colors.danger : theme.colors.border,
              color: theme.colors.text,
            },
          ]}
          value={email}
        />
        {validationError ? (
          <AppText tone="danger" variant="caption">
            올바른 이메일을 입력해 주세요.
          </AppText>
        ) : null}
      </View>
      <View style={styles.field}>
        <AppText variant="label" weight="bold">
          초대 권한
        </AppText>
        <View style={styles.roleOptions}>
          {(['EDITOR', 'VIEWER'] as const).map((option) => (
            <Pressable
              key={option}
              accessibilityRole="radio"
              accessibilityState={{ checked: role === option }}
              onPress={() => setRole(option)}
              style={[
                styles.roleOption,
                {
                  backgroundColor:
                    role === option ? theme.colors.primarySoft : theme.colors.surfaceMuted,
                  borderColor: role === option ? theme.colors.primary : theme.colors.border,
                },
              ]}
            >
              <AppText tone={role === option ? 'primary' : 'secondary'} weight="bold">
                {roleLabels[option]}
              </AppText>
            </Pressable>
          ))}
        </View>
      </View>
      {invite.error ? <InlineNotice message={invite.error.message} tone="danger" /> : null}
      <Button fullWidth loading={invite.isPending} onPress={submit}>
        초대 보내기
      </Button>
    </Card>
  );
}

function WorkspaceMemberCard({
  workspaceId,
  member,
  canManage,
}: {
  workspaceId: number;
  member: WorkspaceMemberResponse;
  canManage: boolean;
}) {
  const theme = useAppTheme();
  const updateRole = useUpdateWorkspaceMemberRole(workspaceId);
  const remove = useRemoveWorkspaceMember(workspaceId);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const manageable = canManage && member.role !== 'OWNER';
  const nextRole: InviteRole = member.role === 'EDITOR' ? 'VIEWER' : 'EDITOR';

  return (
    <Card style={styles.member}>
      <View style={styles.memberRow}>
        <View style={styles.memberCopy}>
          <AppText numberOfLines={1} weight="semibold">
            {member.displayName || member.email}
          </AppText>
          <AppText numberOfLines={1} tone="secondary" variant="caption">
            {member.email}
          </AppText>
        </View>
        <AppText tone="primary" variant="caption" weight="bold">
          {roleLabels[member.role]}
        </AppText>
      </View>
      {manageable ? (
        confirmRemove ? (
          <View
            accessibilityLiveRegion="polite"
            style={[styles.confirmation, { backgroundColor: theme.colors.dangerSoft }]}
          >
            <AppText tone="danger" variant="caption" weight="bold">
              이 멤버를 공유 공간에서 내보낼까요?
            </AppText>
            {remove.error ? (
              <AppText tone="danger" variant="caption">
                {remove.error.message}
              </AppText>
            ) : null}
            <View style={styles.memberActions}>
              <Button
                disabled={remove.isPending}
                fullWidth
                size="compact"
                variant="secondary"
                onPress={() => setConfirmRemove(false)}
              >
                취소
              </Button>
              <Button
                fullWidth
                loading={remove.isPending}
                size="compact"
                variant="danger"
                onPress={() => remove.mutate(member.id)}
              >
                내보내기
              </Button>
            </View>
          </View>
        ) : (
          <View style={styles.memberActions}>
            <Button
              fullWidth
              loading={updateRole.isPending}
              size="compact"
              variant="secondary"
              onPress={() => updateRole.mutate({ memberId: member.id, role: nextRole })}
            >
              {nextRole === 'EDITOR' ? '편집 허용' : '보기 전용으로 변경'}
            </Button>
            <Button fullWidth size="compact" variant="ghost" onPress={() => setConfirmRemove(true)}>
              내보내기
            </Button>
          </View>
        )
      ) : null}
      {updateRole.error ? <InlineNotice message={updateRole.error.message} tone="danger" /> : null}
    </Card>
  );
}
const styles = StyleSheet.create({
  screen: { gap: spacing[4], paddingBottom: spacing[8], paddingTop: spacing[3] },
  state: { alignItems: 'center', flexDirection: 'row', gap: spacing[2] },
  summary: { gap: spacing[1] },
  list: { gap: spacing[3] },
  taskList: { gap: spacing[2] },
  form: { gap: spacing[4] },
  formHeading: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing[2] },
  formCopy: { flex: 1, gap: spacing[1], minWidth: 0 },
  formActions: { gap: spacing[2] },
  field: { gap: spacing[2] },
  input: {
    borderRadius: radii.md,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 48,
    padding: spacing[3],
  },
  roleOptions: { flexDirection: 'row', gap: spacing[2] },
  roleOption: {
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: spacing[2],
  },
  member: { gap: spacing[3] },
  memberRow: { alignItems: 'center', flexDirection: 'row', gap: spacing[3] },
  memberCopy: { flex: 1, gap: spacing[1], minWidth: 0 },
  memberActions: { flexDirection: 'row', gap: spacing[2] },
  confirmation: { borderRadius: radii.md, gap: spacing[2], padding: spacing[3] },
});
