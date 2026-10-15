import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import {
  AppText,
  Button,
  Card,
  EmptyState,
  IconButton,
  InlineNotice,
  PageHeader,
  Screen,
} from '@/components/ui';
import { spacing, useAppTheme } from '@/theme';
import type { DdayGoalResponse } from '@/types';
import { formatDateLabel } from '@/utils';
import { DdayCreateForm } from './dday-create-form';
import { getDdayGoalFallbackColor, useDdayGoalColors } from './dday-goal-colors';
import { DdayGoalTasks } from './dday-goal-tasks';
import { useDeleteDdayGoal } from './use-delete-dday-goal';
import { useDdayGoals } from './use-dday-goals';

export function DdayOverview({ embedded = false }: { embedded?: boolean }) {
  const router = useRouter();
  const theme = useAppTheme();
  const query = useDdayGoals();
  const goals = [...(query.data ?? [])].sort((a, b) => a.targetDate.localeCompare(b.targetDate));
  const colors = useDdayGoalColors(goals.map((item) => item.id));
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [creating, setCreating] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const goal = goals.find((item) => item.id === selectedId) ?? goals[0];
  const selectGoal = (id: number) => {
    setSelectedId(id);
    setShowAll(false);
    setCreating(false);
    setMenuOpen(false);
    setDeleting(false);
  };

  return (
    <Screen
      scroll
      safeAreaEdges={embedded ? ['left', 'right'] : undefined}
      contentContainerStyle={styles.screen}
    >
      {!embedded ? (
        <PageHeader
          title="목표"
          leading={
            <IconButton accessibilityLabel="이전 화면으로 돌아가기" onPress={router.back}>
              <MaterialCommunityIcons name="arrow-left" size={22} color={theme.colors.text} />
            </IconButton>
          }
        />
      ) : null}
      {query.isPending ? (
        <View style={styles.stateRow} accessibilityLabel="목표를 불러오는 중">
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      ) : query.error ? (
        <InlineNotice
          title="목표를 불러오지 못했어요"
          message={query.error.message}
          tone="danger"
          action={
            <Button size="compact" variant="ghost" onPress={() => void query.refetch()}>
              다시 시도
            </Button>
          }
        />
      ) : (
        <>
          {goals.length ? (
            <View style={[styles.navigation, { borderBottomColor: theme.colors.border }]}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
                {goals.map((item) => (
                  <Pressable
                    key={item.id}
                    accessibilityRole="tab"
                    accessibilityLabel={item.title}
                    accessibilityState={{ selected: item.id === goal?.id }}
                    onPress={() => selectGoal(item.id)}
                    style={({ pressed }) => [
                      styles.tab,
                      {
                        borderBottomColor:
                          item.id === goal?.id ? theme.colors.primary : 'transparent',
                        backgroundColor: pressed ? theme.colors.surfaceMuted : 'transparent',
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.dot,
                        {
                          backgroundColor:
                            colors[String(item.id)] ?? getDdayGoalFallbackColor(item.id),
                        },
                      ]}
                    />
                    <AppText
                      numberOfLines={1}
                      style={styles.tabTitle}
                      weight={item.id === goal?.id ? 'bold' : 'regular'}
                    >
                      {item.title}
                    </AppText>
                  </Pressable>
                ))}
              </ScrollView>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="전체 목표"
                accessibilityState={{ expanded: showAll }}
                onPress={() => {
                  setShowAll(!showAll);
                  setMenuOpen(false);
                }}
                style={({ pressed }) => [
                  styles.allGoals,
                  { backgroundColor: pressed ? theme.colors.surfaceMuted : 'transparent' },
                ]}
              >
                <MaterialCommunityIcons
                  name="view-grid-outline"
                  size={20}
                  color={theme.colors.textSecondary}
                />
                <AppText variant="label" tone="secondary">
                  전체 목표
                </AppText>
              </Pressable>
            </View>
          ) : null}
          {showAll ? (
            <View style={styles.selector}>
              {goals.map((item) => (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  accessibilityLabel={item.title}
                  accessibilityState={{ selected: item.id === goal?.id }}
                  onPress={() => selectGoal(item.id)}
                  style={({ pressed }) => [
                    styles.goalOption,
                    { backgroundColor: pressed ? theme.colors.surfaceMuted : 'transparent' },
                  ]}
                >
                  <View
                    style={[
                      styles.dot,
                      {
                        backgroundColor:
                          colors[String(item.id)] ?? getDdayGoalFallbackColor(item.id),
                      },
                    ]}
                  />
                  <AppText style={styles.optionTitle}>{item.title}</AppText>
                  {item.id === goal?.id ? (
                    <MaterialCommunityIcons name="check" size={20} color={theme.colors.primary} />
                  ) : null}
                </Pressable>
              ))}
              <Button size="compact" variant="ghost" onPress={() => setCreating(true)}>
                새 목표 만들기
              </Button>
            </View>
          ) : null}
          {creating ? (
            <DdayCreateForm
              onCancel={() => setCreating(false)}
              onCreated={() => setCreating(false)}
            />
          ) : null}
          {goal ? (
            <View key={goal.id} style={styles.goal}>
              <View style={styles.goalHeader}>
                <View style={styles.goalCopy}>
                  <AppText weight="bold" style={styles.goalTitle}>
                    {goal.title}
                  </AppText>
                  <AppText variant="label" tone="secondary">
                    목표일{' '}
                    {formatDateLabel(goal.targetDate, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </AppText>
                </View>
                <IconButton
                  accessibilityLabel={`${goal.title} 관리 메뉴`}
                  expanded={menuOpen}
                  style={styles.headerButton}
                  onPress={() => setMenuOpen(!menuOpen)}
                >
                  <MaterialCommunityIcons
                    name="dots-horizontal"
                    size={24}
                    color={theme.colors.textSecondary}
                  />
                </IconButton>
              </View>
              {menuOpen ? (
                <View style={styles.menu}>
                  <Button
                    size="compact"
                    variant="ghost"
                    onPress={() => {
                      setDeleting(true);
                      setMenuOpen(false);
                    }}
                  >
                    목표 삭제
                  </Button>
                  <Button size="compact" variant="ghost" onPress={() => setMenuOpen(false)}>
                    닫기
                  </Button>
                </View>
              ) : null}
              {deleting ? (
                <DdayDeleteConfirmation
                  goal={goal}
                  onCancel={() => setDeleting(false)}
                  onDeleted={() => {
                    setDeleting(false);
                    setSelectedId(null);
                  }}
                />
              ) : null}
              <DdayGoalTasks goalId={goal.id} goalTitle={goal.title} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${goal.title} 목표에 항목 추가`}
                onPress={() =>
                  router.push({ pathname: '/tasks/new', params: { goalId: String(goal.id) } })
                }
                style={({ pressed }) => [
                  styles.addItem,
                  { backgroundColor: pressed ? theme.colors.surfaceMuted : 'transparent' },
                ]}
              >
                <MaterialCommunityIcons name="plus" size={22} color={theme.colors.textSecondary} />
                <AppText tone="secondary" weight="semibold">
                  항목 추가
                </AppText>
              </Pressable>
            </View>
          ) : (
            <View style={styles.selector}>
              <EmptyState
                title="원하는 방향부터 정해볼까요?"
                description="목표를 만들고, 꾸준히 할 일을 연결해 보세요."
              />
              {!creating ? <Button onPress={() => setCreating(true)}>첫 목표 만들기</Button> : null}
            </View>
          )}
        </>
      )}
    </Screen>
  );
}

function DdayDeleteConfirmation({
  goal,
  onCancel,
  onDeleted,
}: {
  goal: DdayGoalResponse;
  onCancel: () => void;
  onDeleted: () => void;
}) {
  const theme = useAppTheme();
  const deleteGoal = useDeleteDdayGoal();

  return (
    <Card
      accessibilityLiveRegion="polite"
      style={[
        styles.deleteCard,
        { backgroundColor: theme.colors.dangerSoft, borderColor: theme.colors.danger },
      ]}
    >
      <View style={styles.errorCopy}>
        <AppText tone="danger" variant="label" weight="bold">
          “{goal.title}” 목표를 삭제할까요?
        </AppText>
        <AppText tone="secondary" variant="caption">
          목표 목록에서 사라지며 현재 앱에서는 되돌릴 수 없어요.
        </AppText>
      </View>

      {deleteGoal.error ? (
        <AppText tone="danger" variant="caption">
          {deleteGoal.error.message}
        </AppText>
      ) : null}

      <View style={styles.deleteActions}>
        <Button disabled={deleteGoal.isPending} fullWidth variant="secondary" onPress={onCancel}>
          취소
        </Button>
        <Button
          fullWidth
          loading={deleteGoal.isPending}
          variant="danger"
          onPress={() => deleteGoal.mutate(goal.id, { onSuccess: onDeleted })}
        >
          영구 삭제
        </Button>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: { gap: spacing[4], paddingTop: 0 },
  navigation: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabs: { flex: 1, minWidth: 0 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    minHeight: 48,
    paddingHorizontal: spacing[2],
    borderBottomWidth: 2,
  },
  tabTitle: { maxWidth: 160 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  allGoals: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1],
    minHeight: 48,
    paddingHorizontal: spacing[2],
  },
  selector: { gap: spacing[3] },
  goalOption: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], minHeight: 48 },
  optionTitle: { flex: 1 },
  goal: { gap: spacing[3], paddingTop: 4 },
  goalHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[2] },
  goalCopy: { flex: 1, minWidth: 0, gap: spacing[1] },
  goalTitle: { fontSize: 22, lineHeight: 30 },
  headerButton: { backgroundColor: 'transparent' },
  menu: { alignItems: 'flex-end', gap: spacing[1] },
  addItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    minHeight: 44,
    paddingHorizontal: spacing[1],
  },
  stateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    minHeight: 72,
  },
  errorCopy: { gap: spacing[1] },
  deleteCard: { gap: spacing[3] },
  deleteActions: { gap: spacing[2] },
});
