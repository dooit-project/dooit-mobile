import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import {
  AppText,
  Button,
  Card,
  EmptyState,
  IconButton,
  InlineNotice,
  PageHeader,
  Screen,
  SectionHeader,
} from '@/components/ui';
import { useAuthState } from '@/features/auth';
import { radii, spacing, useAppTheme } from '@/theme';
import type { LocalDateString, WorkspaceInvitationResponse, WorkspaceRole } from '@/types';
import { formatDateLabel } from '@/utils';
import { useAcceptWorkspaceInvitation, useWorkspaceInvitations } from './use-workspace-invitations';
import { useCreateWorkspace, useWorkspaces } from './use-workspaces';

const invitationRoleLabels: Record<WorkspaceRole, string> = {
  OWNER: '관리자',
  EDITOR: '편집 가능',
  VIEWER: '보기 전용',
};

export function WorkspaceOverview() {
  const router = useRouter();
  const theme = useAppTheme();
  const auth = useAuthState();
  const query = useWorkspaces();
  const [creating, setCreating] = useState(false);
  const registered = auth.status === 'registered';
  return (
    <Screen scroll contentContainerStyle={styles.screen}>
      <PageHeader
        title="공유 공간"
        description="함께 관리할 일정과 목표를 공간별로 나눠요."
        leading={
          <IconButton accessibilityLabel="더보기 화면으로 돌아가기" onPress={router.back}>
            <SymbolView
              name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
              size={20}
              tintColor={theme.colors.text}
            />
          </IconButton>
        }
        action={
          registered && !creating ? (
            <Button size="compact" variant="secondary" onPress={() => setCreating(true)}>
              새 공간
            </Button>
          ) : undefined
        }
      />
      {auth.status === 'guest' ? (
        <InlineNotice
          title="계정 연결이 필요해요"
          message="로그인하거나 계정을 만들면 공유 공간을 사용할 수 있어요."
          tone="warning"
          action={
            <Button size="compact" variant="ghost" onPress={() => router.push('/login')}>
              로그인
            </Button>
          }
        />
      ) : null}
      {registered ? <WorkspaceInvitations accountId={auth.user.id} /> : null}
      {creating ? <CreateForm onClose={() => setCreating(false)} /> : null}
      {!creating ? (
        registered && query.isPending ? (
          <View accessibilityLabel="공유 공간을 불러오는 중" style={styles.state}>
            <ActivityIndicator color={theme.colors.primary} />
            <AppText tone="secondary">불러오고 있어요.</AppText>
          </View>
        ) : registered && query.error ? (
          <InlineNotice
            title="공유 공간을 불러오지 못했어요"
            message={query.error.message}
            tone="danger"
            action={
              <Button size="compact" variant="ghost" onPress={() => void query.refetch()}>
                다시 시도
              </Button>
            }
          />
        ) : registered && !query.data?.length ? (
          <EmptyState
            title="참여 중인 공간이 없어요"
            description="초대를 수락하거나 새 공간을 만들어 함께 시작해 보세요."
            primaryAction={<Button onPress={() => setCreating(true)}>공유 공간 만들기</Button>}
          />
        ) : registered ? (
          <View style={styles.list}>
            <SectionHeader title="참여 중인 공간" count={query.data?.length ?? 0} />
            {query.data?.map((item) => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={`${item.name} 공유 공간 열기`}
                onPress={() =>
                  router.push({
                    pathname: '/workspaces/[workspaceId]',
                    params: { workspaceId: String(item.id) },
                  })
                }
              >
                <Card style={styles.workspaceCard}>
                  <View style={styles.workspaceCopy}>
                    <AppText numberOfLines={2} weight="semibold">
                      {item.name}
                    </AppText>
                    {item.description ? (
                      <AppText numberOfLines={3} tone="secondary" variant="caption">
                        {item.description}
                      </AppText>
                    ) : null}
                  </View>
                  <AppText tone="muted" variant="bodyLarge">
                    ›
                  </AppText>
                </Card>
              </Pressable>
            ))}
          </View>
        ) : null
      ) : null}
    </Screen>
  );
}

function WorkspaceInvitations({ accountId }: { accountId: number }) {
  const query = useWorkspaceInvitations(accountId);
  const accept = useAcceptWorkspaceInvitation(accountId);

  if (!query.isPending && !query.error && !query.data?.length) return null;

  return (
    <View style={styles.list}>
      <SectionHeader title="받은 초대" count={query.data?.length} />
      {query.isPending ? (
        <Card variant="muted" style={styles.invitationState}>
          <ActivityIndicator />
          <AppText tone="secondary">받은 초대를 확인하고 있어요.</AppText>
        </Card>
      ) : query.error ? (
        <InlineNotice
          title="받은 초대를 불러오지 못했어요"
          message={query.error.message}
          tone="danger"
          action={
            <Button size="compact" variant="ghost" onPress={() => void query.refetch()}>
              다시 시도
            </Button>
          }
        />
      ) : (
        query.data?.map((invitation) => (
          <InvitationCard
            key={invitation.membership.id}
            invitation={invitation}
            accepting={
              accept.isPending && accept.variables?.membership.id === invitation.membership.id
            }
            error={
              accept.error && accept.variables?.membership.id === invitation.membership.id
                ? accept.error.message
                : undefined
            }
            onAccept={() => accept.mutate(invitation)}
          />
        ))
      )}
    </View>
  );
}

function InvitationCard({
  invitation,
  accepting,
  error,
  onAccept,
}: {
  invitation: WorkspaceInvitationResponse;
  accepting: boolean;
  error?: string;
  onAccept: () => void;
}) {
  const invitedDate = invitation.invitedAt.slice(0, 10) as LocalDateString;

  return (
    <Card style={styles.invitationCard}>
      <View style={styles.workspaceCopy}>
        <AppText weight="bold">{invitation.workspace.name}</AppText>
        {invitation.workspace.description ? (
          <AppText numberOfLines={3} tone="secondary" variant="caption">
            {invitation.workspace.description}
          </AppText>
        ) : null}
        <AppText tone="muted" variant="caption">
          {invitationRoleLabels[invitation.membership.role]} ·{' '}
          {formatDateLabel(invitedDate, { month: 'long', day: 'numeric' })} 초대
        </AppText>
      </View>
      {error ? <InlineNotice message={error} tone="danger" /> : null}
      <Button
        accessibilityLabel={`${invitation.workspace.name} 초대 수락`}
        fullWidth
        loading={accepting}
        onPress={onAccept}
      >
        초대 수락
      </Button>
    </Card>
  );
}

function CreateForm({ onClose }: { onClose: () => void }) {
  const theme = useAppTheme();
  const create = useCreateWorkspace();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState(false);
  const submit = () => {
    if (!name.trim()) return setError(true);
    create.mutate(
      { name: name.trim(), description: description.trim() || null },
      { onSuccess: onClose },
    );
  };
  return (
    <Card style={styles.form}>
      <AppText variant="bodyLarge" weight="bold">
        새 공유 공간
      </AppText>
      <View style={styles.field}>
        <AppText variant="label" weight="bold">
          이름 · {name.length}/50
        </AppText>
        <TextInput
          accessibilityLabel="공유 공간 이름"
          maxLength={50}
          onChangeText={(v) => {
            setName(v);
            setError(false);
          }}
          placeholder="예: 제품팀"
          placeholderTextColor={theme.colors.textMuted}
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.surfaceMuted,
              borderColor: error ? theme.colors.danger : theme.colors.border,
              color: theme.colors.text,
            },
          ]}
          value={name}
        />
        {error ? (
          <AppText tone="danger" variant="caption">
            공유 공간 이름을 입력해 주세요.
          </AppText>
        ) : null}
      </View>
      <View style={styles.field}>
        <AppText variant="label" weight="bold">
          설명 · {description.length}/300
        </AppText>
        <TextInput
          accessibilityLabel="공유 공간 설명"
          maxLength={300}
          multiline
          onChangeText={setDescription}
          placeholder="함께 관리할 일정이나 목표"
          placeholderTextColor={theme.colors.textMuted}
          style={[
            styles.input,
            styles.area,
            {
              backgroundColor: theme.colors.surfaceMuted,
              borderColor: theme.colors.border,
              color: theme.colors.text,
            },
          ]}
          value={description}
        />
      </View>
      {create.error ? <InlineNotice message={create.error.message} tone="danger" /> : null}
      <View style={styles.actions}>
        <Button fullWidth variant="secondary" onPress={onClose}>
          취소
        </Button>
        <Button fullWidth loading={create.isPending} onPress={submit}>
          공간 만들기
        </Button>
      </View>
    </Card>
  );
}
const styles = StyleSheet.create({
  screen: { gap: spacing[4], paddingBottom: spacing[8], paddingTop: spacing[3] },
  state: { alignItems: 'center', flexDirection: 'row', gap: spacing[2] },
  list: { gap: spacing[3] },
  workspaceCard: { alignItems: 'center', flexDirection: 'row', gap: spacing[3] },
  workspaceCopy: { flex: 1, gap: spacing[1], minWidth: 0 },
  invitationCard: { gap: spacing[3] },
  invitationState: { alignItems: 'center', flexDirection: 'row', gap: spacing[2] },
  form: { gap: spacing[4] },
  field: { gap: spacing[2] },
  input: {
    borderRadius: radii.md,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 48,
    padding: spacing[3],
  },
  area: { minHeight: 96, textAlignVertical: 'top' },
  actions: { gap: spacing[2] },
});
