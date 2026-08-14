import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
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
import { spacing, useAppTheme } from '@/theme';
import type { WorkspaceRole } from '@/types';
import { useWorkspace, useWorkspaceMembers } from './use-workspaces';

const roleLabels: Record<WorkspaceRole, string> = {
  OWNER: '관리자',
  EDITOR: '편집 가능',
  VIEWER: '보기 전용',
};

export function WorkspaceDetail({ workspaceId }: { workspaceId: number | null }) {
  const router = useRouter();
  const theme = useAppTheme();
  const auth = useAuthState();
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
          <View style={styles.list}>
            <SectionHeader title="함께하는 사람" count={members.data?.length ?? 0} />
            {members.data?.length ? (
              members.data.map((member) => (
                <Card key={member.id} style={styles.member}>
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
                </Card>
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
const styles = StyleSheet.create({
  screen: { gap: spacing[4], paddingBottom: spacing[8], paddingTop: spacing[3] },
  state: { alignItems: 'center', flexDirection: 'row', gap: spacing[2] },
  summary: { gap: spacing[1] },
  list: { gap: spacing[3] },
  member: { alignItems: 'center', flexDirection: 'row', gap: spacing[3] },
  memberCopy: { flex: 1, gap: spacing[1], minWidth: 0 },
});
