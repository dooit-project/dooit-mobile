import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

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
import { env } from '@/config/env';
import { useAuthState } from '@/features/auth';
import type { DdayGoalResponse } from '@/types';
import { getScreenBackAction, formatDateLabel } from '@/utils';
import { DdayCreateForm } from './dday-create-form';
import { getDdayGoalFallbackColor, useDdayGoalColors } from './dday-goal-colors';
import {
  DdayGoalTasks,
  type DdayGoalTasksHandle,
  type DdayItemOrderState,
} from './dday-goal-tasks';
import { DdayGoalOrderList } from './dday-goal-order-list';
import { applyDdayGoalOrder, useDdayGoalOrder } from './use-dday-goal-order';
import { useDeleteDdayGoal } from './use-delete-dday-goal';
import { useDdayGoals } from './use-dday-goals';
import { useDdayPlanSelection } from './use-dday-plan-selection';

export function DdayOverview({ embedded = false }: { embedded?: boolean }) {
  const theme = useAppTheme();
  const auth = useAuthState();
  const scope =
    auth.status === 'guest' || auth.status === 'registered'
      ? JSON.stringify([env.apiMode, env.apiUrl ?? null, auth.user.id])
      : null;
  if (scope === null) {
    return (
      <Screen safeAreaEdges={embedded ? ['left', 'right'] : undefined}>
        {auth.status === 'error' ? (
          <InlineNotice tone="danger" message={auth.error.message} />
        ) : (
          <View style={styles.stateRow} accessibilityLabel="계획을 불러오는 중">
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        )}
      </Screen>
    );
  }
  return <DdayPlanOverview key={scope ?? 'pending'} embedded={embedded} selectionScope={scope} />;
}

function DdayPlanOverview({
  embedded,
  selectionScope,
}: {
  embedded: boolean;
  selectionScope: string;
}) {
  const router = useRouter();
  const theme = useAppTheme();
  const query = useDdayGoals();
  const goalOrder = useDdayGoalOrder(selectionScope);
  const goals = applyDdayGoalOrder(
    [...(query.data ?? [])].sort((a, b) => a.targetDate.localeCompare(b.targetDate)),
    goalOrder.ids,
  );
  const colors = useDdayGoalColors(goals.map((item) => item.id));
  const {
    selectedId,
    isRestoring,
    selectGoal: setSelectedId,
  } = useDdayPlanSelection(selectionScope);
  const tabsRef = useRef<ScrollView>(null);
  const tabPositions = useRef<Record<number, number>>({});
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [creating, setCreating] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isOrdering, setIsOrdering] = useState(false);
  const [draftOrder, setDraftOrder] = useState<number[]>([]);
  const [orderHistory, setOrderHistory] = useState<number[][]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const goalItemsRef = useRef<DdayGoalTasksHandle>(null);
  const [itemOrderState, setItemOrderState] = useState<DdayItemOrderState>({
    editing: false,
    saving: false,
    canEdit: false,
  });
  const draftGoals = applyDdayGoalOrder(goals, draftOrder);
  const goal = goals.find((item) => item.id === selectedId) ?? goals[0];
  const currentGoalId = goal?.id;
  const searchTerm = search.trim().normalize('NFKC').toLocaleLowerCase();
  const matchingGoals = goals.filter((item) =>
    item.title.normalize('NFKC').toLocaleLowerCase().includes(searchTerm),
  );
  const revealSelectedTab = () => {
    if (currentGoalId === undefined) return;
    const x = tabPositions.current[currentGoalId];
    if (x !== undefined) tabsRef.current?.scrollTo({ x: Math.max(0, x - 8), animated: false });
  };
  useEffect(() => {
    if (currentGoalId === undefined) return;
    const x = tabPositions.current[currentGoalId];
    if (x !== undefined) tabsRef.current?.scrollTo({ x: Math.max(0, x - 8), animated: false });
  }, [currentGoalId]);
  const selectGoal = (id: number) => {
    setSelectedId(id);
    setShowAll(false);
    setCreating(false);
    setMenuOpen(false);
    setDeleting(false);
    setSearch('');
  };
  const startOrdering = () => {
    setDraftOrder(goals.map((item) => item.id));
    setOrderHistory([]);
    setOrderError(null);
    setSearch('');
    setMenuOpen(false);
    setIsOrdering(true);
  };
  const moveGoal = (from: number, to: number) => {
    if (
      isSavingOrder ||
      from === to ||
      from < 0 ||
      to < 0 ||
      from >= draftGoals.length ||
      to >= draftGoals.length
    )
      return;
    const current = draftGoals.map((item) => item.id);
    const next = [...current];
    const [id] = next.splice(from, 1);
    next.splice(to, 0, id);
    setOrderHistory((history) => [...history, current]);
    setDraftOrder(next);
  };
  const saveOrder = async () => {
    setIsSavingOrder(true);
    setOrderError(null);
    try {
      await goalOrder.save(draftGoals.map((item) => item.id));
      setIsOrdering(false);
      setOrderHistory([]);
    } catch {
      setOrderError('순서를 저장하지 못했어요. 다시 시도해 주세요.');
    } finally {
      setIsSavingOrder(false);
    }
  };

  return (
    <Screen
      scroll
      safeAreaEdges={embedded ? ['left', 'right'] : undefined}
      contentContainerStyle={styles.screen}
      scrollViewProps={{ scrollEnabled: !isDragging }}
    >
      {!embedded ? (
        <PageHeader
          title="목표"
          leading={
            <IconButton {...getScreenBackAction(router)}>
              <MaterialCommunityIcons name="arrow-left" size={22} color={theme.colors.text} />
            </IconButton>
          }
        />
      ) : null}
      {query.isPending || isRestoring || goalOrder.isRestoring ? (
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
              <ScrollView
                ref={tabsRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.tabs}
                onLayout={revealSelectedTab}
                onContentSizeChange={revealSelectedTab}
              >
                {goals.map((item) => (
                  <Pressable
                    key={item.id}
                    accessibilityRole="tab"
                    accessibilityLabel={item.title}
                    accessibilityState={{
                      selected: item.id === goal?.id,
                      disabled: isOrdering || itemOrderState.editing,
                    }}
                    disabled={isOrdering || itemOrderState.editing}
                    onPress={() => selectGoal(item.id)}
                    onLayout={(event) => {
                      tabPositions.current[item.id] = event.nativeEvent.layout.x;
                      if (item.id === goal?.id) revealSelectedTab();
                    }}
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
                accessibilityState={{
                  expanded: showAll,
                  disabled: isOrdering || itemOrderState.editing,
                }}
                disabled={isOrdering || itemOrderState.editing}
                onPress={() => {
                  setShowAll(!showAll);
                  setMenuOpen(false);
                  setSearch('');
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
          {showAll && isOrdering ? (
            <View style={styles.selector}>
              <AppText weight="semibold">목표 순서 바꾸기</AppText>
              <AppText tone="secondary" variant="caption">
                손잡이를 끌거나 화살표로 옮겨보세요. 현재 순서는 이 기기에 저장돼요.
              </AppText>
              <DdayGoalOrderList
                items={draftGoals.map((item) => ({
                  id: item.id,
                  title: item.title,
                  color: colors[String(item.id)] ?? getDdayGoalFallbackColor(item.id),
                }))}
                disabled={isSavingOrder}
                onMove={moveGoal}
                onDragging={setIsDragging}
              />
              {orderError ? <InlineNotice message={orderError} tone="danger" /> : null}
              <View style={styles.orderActions}>
                <Button
                  size="compact"
                  variant="ghost"
                  disabled={isSavingOrder || isDragging}
                  onPress={() => {
                    setIsOrdering(false);
                    setOrderError(null);
                  }}
                >
                  취소
                </Button>
                <Button
                  size="compact"
                  variant="ghost"
                  disabled={isSavingOrder || isDragging || orderHistory.length === 0}
                  onPress={() => {
                    setDraftOrder(orderHistory[orderHistory.length - 1]);
                    setOrderHistory((history) => history.slice(0, -1));
                  }}
                >
                  되돌리기
                </Button>
                <Button
                  size="compact"
                  loading={isSavingOrder}
                  disabled={isDragging}
                  onPress={() => void saveOrder()}
                >
                  완료
                </Button>
              </View>
            </View>
          ) : showAll ? (
            <View style={styles.selector}>
              <View style={[styles.searchField, { borderColor: theme.colors.border }]}>
                <MaterialCommunityIcons
                  name="magnify"
                  size={20}
                  color={theme.colors.textSecondary}
                />
                <TextInput
                  accessibilityLabel="목표 검색"
                  placeholder="목표 검색"
                  value={search}
                  onChangeText={setSearch}
                  placeholderTextColor={theme.colors.textMuted}
                  autoCorrect={false}
                  returnKeyType="search"
                  style={[styles.searchInput, { color: theme.colors.text }]}
                />
                {search ? (
                  <IconButton
                    accessibilityLabel="목표 검색어 지우기"
                    style={styles.headerButton}
                    onPress={() => setSearch('')}
                  >
                    <MaterialCommunityIcons
                      name="close"
                      size={20}
                      color={theme.colors.textSecondary}
                    />
                  </IconButton>
                ) : null}
              </View>
              {matchingGoals.length === 0 ? (
                <AppText accessibilityLiveRegion="polite" tone="secondary">
                  찾는 목표가 없어요.
                </AppText>
              ) : null}
              {matchingGoals.map((item) => (
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
              <Button
                size="compact"
                variant="ghost"
                onPress={() => {
                  setCreating(true);
                  setShowAll(false);
                }}
              >
                새 목표 만들기
              </Button>
              {goals.length > 1 ? (
                <Button size="compact" variant="ghost" onPress={startOrdering}>
                  목표 순서 바꾸기
                </Button>
              ) : null}
            </View>
          ) : null}
          {creating ? (
            <DdayCreateForm
              onCancel={() => setCreating(false)}
              onCreated={(createdGoal) => selectGoal(createdGoal.id)}
            />
          ) : null}
          {goal && !creating && !isOrdering ? (
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
                {itemOrderState.editing ? (
                  <Button
                    size="compact"
                    loading={itemOrderState.saving}
                    disabled={isDragging}
                    onPress={() => goalItemsRef.current?.saveOrder()}
                  >
                    완료
                  </Button>
                ) : (
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
                )}
              </View>
              {menuOpen ? (
                <View style={styles.menu}>
                  <Button
                    size="compact"
                    variant="ghost"
                    disabled={!itemOrderState.canEdit}
                    onPress={() => {
                      setMenuOpen(false);
                      setShowAll(false);
                      setDeleting(false);
                      goalItemsRef.current?.startOrdering();
                    }}
                  >
                    순서 바꾸기
                  </Button>
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
              <DdayGoalTasks
                ref={goalItemsRef}
                goalId={goal.id}
                goalTitle={goal.title}
                selectionScope={selectionScope}
                onOrderStateChange={setItemOrderState}
                onDragging={setIsDragging}
              />
              {!itemOrderState.editing ? (
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
                  <MaterialCommunityIcons
                    name="plus"
                    size={22}
                    color={theme.colors.textSecondary}
                  />
                  <AppText tone="secondary" weight="semibold">
                    항목 추가
                  </AppText>
                </Pressable>
              ) : null}
            </View>
          ) : !creating && !isOrdering ? (
            <View style={styles.selector}>
              <EmptyState
                title="원하는 방향부터 정해볼까요?"
                description="목표를 만들고, 꾸준히 할 일을 연결해 보세요."
              />
              {!creating ? <Button onPress={() => setCreating(true)}>첫 목표 만들기</Button> : null}
            </View>
          ) : null}
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
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing[2],
    flexWrap: 'wrap',
  },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    borderWidth: 1,
    borderRadius: 8,
    paddingLeft: spacing[3],
    minHeight: 44,
  },
  searchInput: { flex: 1, minWidth: 0, fontSize: 16, paddingVertical: spacing[3] },
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
