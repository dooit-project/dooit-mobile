import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';

import { AppText, Button, IconButton, InlineNotice, Screen } from '@/components/ui';
import { useCompleteTask, useTaskDetail } from '@/features/tasks';
import { spacing, useAppTheme } from '@/theme';
import { toApiLocalDate } from '@/utils';

import { getTodayFocusDateLabel, getTodayFocusMetadata } from './today-focus-presentation';

export function TodayFocusScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string; taskId?: string }>();
  const theme = useAppTheme();
  const taskId = Number(params.taskId);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(params.date ?? '') ? params.date! : toApiLocalDate();
  const task = useTaskDetail(Number.isInteger(taskId) && taskId > 0 ? taskId : null);
  const complete = useCompleteTask(date);
  const focusedTask = complete.data ?? task.data;
  const metadata = focusedTask ? getTodayFocusMetadata(focusedTask) : '';

  const leaveFocus = () => router.replace('/');
  const openDetail = () => {
    if (!focusedTask) return;
    router.push({ pathname: '/tasks/[taskId]', params: { taskId: String(focusedTask.id) } });
  };

  return (
    <Screen contentMaxWidth={560} contentContainerStyle={styles.screen}>
      <View style={styles.topBar}>
        <AppText variant="title" weight="heavy">
          dooit
        </AppText>
        <IconButton accessibilityLabel="집중 모드 나가기" onPress={leaveFocus}>
          <MaterialCommunityIcons color={theme.colors.text} name="close" size={28} />
        </IconButton>
      </View>

      {task.isPending ? (
        <View accessibilityLabel="집중할 일을 불러오는 중" style={styles.center}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
        </View>
      ) : task.error || !focusedTask ? (
        <View style={styles.center}>
          <InlineNotice
            message={task.error?.message ?? '집중할 일을 찾을 수 없어요.'}
            title="집중할 일을 열지 못했어요"
            tone="danger"
            action={
              <Button size="compact" variant="ghost" onPress={leaveFocus}>
                Today로 돌아가기
              </Button>
            }
          />
        </View>
      ) : (
        <>
          <View style={styles.intro}>
            <AppText align="center" tone="secondary" variant="bodyLarge">
              {getTodayFocusDateLabel(date)}
            </AppText>
            <AppText align="center" style={styles.introTitle} variant="title" weight="bold">
              오늘 한 가지에 집중하세요
            </AppText>
          </View>

          <View style={styles.focusContent}>
            <View style={[styles.focusIcon, { backgroundColor: theme.colors.primarySoft }]}>
              {Platform.OS === 'web' ? (
                <MaterialCommunityIcons
                  color={theme.colors.primary}
                  name="checkbox-marked-circle-outline"
                  size={34}
                />
              ) : (
                <SymbolView
                  name={{ ios: 'checkmark.circle', android: 'task_alt', web: 'task_alt' }}
                  size={34}
                  tintColor={theme.colors.primary}
                />
              )}
            </View>
            <AppText align="center" style={styles.taskTitle} variant="display" weight="heavy">
              {focusedTask.title}
            </AppText>
            <AppText align="center" tone="secondary" variant="bodyLarge">
              {complete.isSuccess
                ? '한 가지를 끝냈어요. 이제 Today로 돌아가도 좋아요.'
                : metadata || '지금 이 순간, 이 한 가지에만 온전히 집중해 보세요.'}
            </AppText>
          </View>

          <View style={styles.actions}>
            {complete.error ? (
              <InlineNotice message={complete.error.message} tone="danger" />
            ) : null}
            {complete.isSuccess ? (
              <Button
                fullWidth
                labelVariant="bodyLarge"
                size="large"
                style={styles.primaryButton}
                onPress={leaveFocus}
              >
                Today로 돌아가기
              </Button>
            ) : (
              <Button
                accessibilityLabel={`${focusedTask.title} 완료하기`}
                fullWidth
                labelVariant="bodyLarge"
                loading={complete.isPending}
                size="large"
                style={styles.primaryButton}
                leading={
                  <MaterialCommunityIcons
                    color={theme.colors.textOnPrimary}
                    name="check"
                    size={20}
                  />
                }
                onPress={() => complete.mutate(focusedTask.id)}
              >
                완료했어요
              </Button>
            )}
            <View style={styles.secondaryActions}>
              <Button
                disabled={complete.isPending}
                labelVariant="body"
                variant="ghost"
                onPress={openDetail}
              >
                자세히 보기
              </Button>
              <View style={[styles.actionDivider, { backgroundColor: theme.colors.border }]} />
              <Button
                disabled={complete.isPending}
                labelVariant="body"
                variant="ghost"
                onPress={leaveFocus}
              >
                집중 모드 나가기
              </Button>
            </View>
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingBottom: spacing[8], paddingTop: spacing[4] },
  topBar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  center: { flex: 1, justifyContent: 'center' },
  intro: { alignItems: 'center', gap: spacing[3], paddingTop: spacing[12] },
  focusContent: {
    alignItems: 'center',
    flex: 1,
    gap: spacing[5],
    justifyContent: 'center',
    paddingBottom: spacing[8],
  },
  focusIcon: {
    alignItems: 'center',
    borderRadius: 999,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  introTitle: { fontSize: 24, lineHeight: 32 },
  taskTitle: { fontSize: 34, lineHeight: 42, maxWidth: 480 },
  actions: { gap: spacing[3], paddingBottom: spacing[4] },
  primaryButton: { minHeight: 60 },
  secondaryActions: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  actionDivider: { height: 20, width: StyleSheet.hairlineWidth },
});
