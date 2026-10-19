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

import { AppText, Button, EmptyState, IconButton, InlineNotice, Screen } from '@/components/ui';
import { env } from '@/config/env';
import { useAuthState } from '@/features/auth';
import { useDdayGoals } from '@/features/dday/use-dday-goals';
import {
  getDdayGoalFallbackColor,
  useDdayGoalColors,
  type DdayGoalColor,
} from '@/features/dday/dday-goal-colors';
import {
  DdayGoalTasks,
  type DdayGoalTasksHandle,
  type DdayItemOrderState,
} from '@/features/dday/dday-goal-tasks';
import { DdayOrderList } from '@/features/dday/dday-order-list';
import { getUserFacingApiErrorMessage } from '@/services/api';
import { spacing, useAppTheme } from '@/theme';
import type { DdayGoalResponse, GoalResponse, GoalStatus, GoalFuturePlanPolicy } from '@/types';
import { formatDateLabel } from '@/utils';

import { GoalForm } from './goal-form';
import { useGoals, useGoalStatus } from './use-goals';
import { GoalPlanList } from './goal-plan-list';
import {
  readPlanGoalPreferences,
  updatePlanGoalPreferences,
  type PlanGoalKey,
  type PlanGoalPreferences,
} from './plan-goal-preferences';

type Target = { key: PlanGoalKey; title: string; targetDate: string | null } & (
  | { kind: 'goal'; value: GoalResponse }
  | { kind: 'dday'; value: DdayGoalResponse }
);
const statusLabels: Record<GoalStatus, string> = {
  ACTIVE: '진행 중',
  PAUSED: '잠시 멈춤',
  ACHIEVED: '달성',
  ARCHIVED: '보관됨',
};
const initialPreferences: PlanGoalPreferences = { selected: null, order: [], colors: {} };

export function GoalOverview() {
  const auth = useAuthState();
  if (auth.status !== 'guest' && auth.status !== 'registered') {
    return (
      <Screen safeAreaEdges={['left', 'right']}>
        {auth.status === 'error' ? (
          <InlineNotice tone="danger" message={auth.error.message} />
        ) : (
          <ActivityIndicator accessibilityLabel="계획을 불러오는 중" />
        )}
      </Screen>
    );
  }
  const scope = JSON.stringify([env.apiMode, env.apiUrl ?? null, auth.user.id]);
  return <GoalWorkspace key={scope} scope={scope} />;
}

function GoalWorkspace({ scope }: { scope: string }) {
  const router = useRouter();
  const theme = useAppTheme();
  const goals = useGoals();
  const legacy = useDdayGoals();
  const status = useGoalStatus();
  const legacyColors = useDdayGoalColors((legacy.data ?? []).map((goal) => goal.id));
  const [preferences, setPreferences] = useState(initialPreferences);
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState<PlanGoalKey | null>(null);
  const [all, setAll] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<'create' | 'edit' | null>(null);
  const [menu, setMenu] = useState(false);
  const [plansEditing, setPlansEditing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<GoalStatus | null>(null);
  const [futurePolicy, setFuturePolicy] = useState<GoalFuturePlanPolicy>('PAUSE_FUTURE');
  const [ordering, setOrdering] = useState(false);
  const [draft, setDraft] = useState<PlanGoalKey[]>([]);
  const [history, setHistory] = useState<PlanGoalKey[][]>([]);
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [itemOrder, setItemOrder] = useState<DdayItemOrderState>({
    editing: false,
    saving: false,
    canEdit: false,
  });
  const itemRef = useRef<DdayGoalTasksHandle>(null);
  const tabs = useRef<ScrollView>(null);
  const positions = useRef<Record<string, number>>({});
  useEffect(() => {
    let active = true;
    void readPlanGoalPreferences(scope)
      .then((saved) => {
        if (active) {
          setPreferences(saved);
          setReady(true);
        }
      })
      .catch(() => {
        if (active) {
          setReady(true);
          setNotice('이 기기의 선택과 순서를 불러오지 못했어요. 저장된 목표는 유지돼요.');
        }
      });
    return () => {
      active = false;
    };
  }, [scope]);
  const targets: Target[] = [
    ...(legacy.data ?? []).map(
      (value): Target => ({
        key: `dday:${value.id}`,
        title: value.title,
        targetDate: value.targetDate,
        kind: 'dday',
        value,
      }),
    ),
    ...(goals.data ?? []).map(
      (value): Target => ({
        key: `goal:${value.id}`,
        title: value.title,
        targetDate: value.targetDate,
        kind: 'goal',
        value,
      }),
    ),
  ];
  const arranged = (keys: PlanGoalKey[]) => {
    const order = new Map(keys.map((key, index) => [key, index]));
    return [...targets].sort(
      (a, b) =>
        (order.get(a.key) ?? keys.length) - (order.get(b.key) ?? keys.length) ||
        (a.targetDate ?? '9999').localeCompare(b.targetDate ?? '9999'),
    );
  };
  const ordered = arranged(preferences.order);
  const current =
    ordered.find((goal) => goal.key === (selected ?? preferences.selected)) ?? ordered[0];
  const currentKey = current?.key;
  const currentGoal = current?.kind === 'goal' ? current.value : null;
  const matches = ordered.filter((target) =>
    target.title
      .normalize('NFKC')
      .toLocaleLowerCase()
      .includes(search.trim().normalize('NFKC').toLocaleLowerCase()),
  );
  const revealTab = () => {
    if (currentKey && positions.current[currentKey] !== undefined)
      tabs.current?.scrollTo({
        x: Math.max(0, positions.current[currentKey] - 8),
        animated: false,
      });
  };
  useEffect(() => {
    if (currentKey && positions.current[currentKey] !== undefined)
      tabs.current?.scrollTo({
        x: Math.max(0, positions.current[currentKey] - 8),
        animated: false,
      });
  }, [currentKey]);
  const color = (target: Target): DdayGoalColor =>
    target.kind === 'dday'
      ? (legacyColors[String(target.value.id)] ?? getDdayGoalFallbackColor(target.value.id))
      : (preferences.colors[target.key] ?? getDdayGoalFallbackColor(target.value.id));
  const locked = form !== null || status.isPending || itemOrder.editing || ordering || plansEditing;
  const savePreferences = async (patch: Partial<PlanGoalPreferences>) => {
    const saved = await updatePlanGoalPreferences(scope, patch);
    setPreferences(saved);
  };
  const choose = (key: PlanGoalKey) => {
    setSelected(key);
    setAll(false);
    setMenu(false);
    setConfirmation(null);
    setSearch('');
    status.reset();
    void savePreferences({ selected: key }).catch(() =>
      setNotice('선택한 목표를 이 기기에 기억하지 못했어요. 현재 선택은 유지돼요.'),
    );
  };
  const retrySource = (kind: 'goal' | 'dday') => {
    if (kind === 'goal') void goals.refetch();
    else void legacy.refetch();
  };
  async function setGoalStatus() {
    if (current?.kind !== 'goal' || !confirmation || status.isPending) return;
    try {
      await status.mutateAsync({
        goalId: current.value.id,
        request: { status: confirmation, futurePlanPolicy: futurePolicy },
      });
      setConfirmation(null);
      setMenu(false);
    } catch {
      /* Mutation retains the error and confirmation for retry. */
    }
  }
  return (
    <Screen
      scroll
      safeAreaEdges={['left', 'right']}
      contentContainerStyle={styles.screen}
      scrollViewProps={{ scrollEnabled: !dragging }}
    >
      {!ready || ((goals.isPending || legacy.isPending) && !ordered.length) ? (
        <ActivityIndicator accessibilityLabel="목표를 불러오는 중" color={theme.colors.primary} />
      ) : (
        <>
          {notice ? <InlineNotice message={notice} tone="warning" /> : null}
          {(
            [
              ['goal', goals.error],
              ['dday', legacy.error],
            ] as const
          ).map(([kind, error]) =>
            error ? (
              <InlineNotice
                key={kind}
                tone="danger"
                message={`${kind === 'goal' ? '목표' : '기존 목표'}를 갱신하지 못했어요. ${getUserFacingApiErrorMessage(error)}`}
                action={
                  <Button variant="ghost" size="compact" onPress={() => retrySource(kind)}>
                    다시 시도
                  </Button>
                }
              />
            ) : null,
          )}
          {ordered.length ? (
            <View style={[styles.navigation, { borderBottomColor: theme.colors.border }]}>
              <ScrollView
                horizontal
                ref={tabs}
                showsHorizontalScrollIndicator={false}
                style={styles.tabs}
                onLayout={revealTab}
                onContentSizeChange={revealTab}
              >
                {ordered.map((target) => (
                  <Pressable
                    key={target.key}
                    accessibilityRole="tab"
                    accessibilityLabel={`${target.title}${target.kind === 'dday' ? ', 기존 목표' : ''}`}
                    accessibilityState={{ selected: currentKey === target.key, disabled: locked }}
                    disabled={locked}
                    onPress={() => choose(target.key)}
                    onLayout={(event) => {
                      positions.current[target.key] = event.nativeEvent.layout.x;
                    }}
                    style={[
                      styles.tab,
                      {
                        borderBottomColor:
                          currentKey === target.key ? theme.colors.primary : 'transparent',
                      },
                    ]}
                  >
                    <View style={[styles.dot, { backgroundColor: color(target) }]} />
                    <AppText
                      numberOfLines={1}
                      weight={currentKey === target.key ? 'bold' : 'regular'}
                      style={styles.tabTitle}
                    >
                      {target.title}
                    </AppText>
                  </Pressable>
                ))}
              </ScrollView>
              <Button
                size="compact"
                variant="ghost"
                disabled={locked}
                accessibilityState={{ expanded: all }}
                onPress={() => setAll(!all)}
              >
                전체 목표
              </Button>
            </View>
          ) : null}
          {ordering ? (
            <View style={styles.section}>
              <AppText weight="semibold">목표 순서 바꾸기</AppText>
              <AppText variant="caption" tone="secondary">
                손잡이나 화살표로 옮겨보세요. 이 기기에 저장돼요.
              </AppText>
              <DdayOrderList
                items={arranged(draft).map((target) => ({
                  id: target.key,
                  title: target.title,
                  color: color(target),
                }))}
                disabled={saving}
                onDragging={setDragging}
                onMove={(from, to) => {
                  const keys = arranged(draft).map((target) => target.key);
                  if (
                    saving ||
                    from === to ||
                    from < 0 ||
                    to < 0 ||
                    from >= keys.length ||
                    to >= keys.length
                  )
                    return;
                  const next = [...keys];
                  const [key] = next.splice(from, 1);
                  next.splice(to, 0, key);
                  setHistory((old) => [...old, keys]);
                  setDraft(next);
                }}
              />
              <View style={styles.actions}>
                <Button
                  variant="ghost"
                  disabled={saving || dragging}
                  onPress={() => setOrdering(false)}
                >
                  취소
                </Button>
                <Button
                  variant="ghost"
                  disabled={saving || dragging || !history.length}
                  onPress={() => {
                    setDraft(history[history.length - 1]);
                    setHistory((old) => old.slice(0, -1));
                  }}
                >
                  되돌리기
                </Button>
                <Button
                  loading={saving}
                  disabled={dragging}
                  onPress={() => {
                    setSaving(true);
                    void savePreferences({ order: arranged(draft).map((target) => target.key) })
                      .then(() => setOrdering(false))
                      .catch(() =>
                        setNotice('순서를 저장하지 못했어요. 편집 중인 순서는 유지돼요.'),
                      )
                      .finally(() => setSaving(false));
                  }}
                >
                  완료
                </Button>
              </View>
            </View>
          ) : all ? (
            <View style={styles.section}>
              <TextInput
                accessibilityLabel="전체 목표 검색"
                value={search}
                onChangeText={setSearch}
                placeholder="목표 검색"
                placeholderTextColor={theme.colors.textMuted}
                style={[
                  styles.search,
                  { color: theme.colors.text, borderColor: theme.colors.border },
                ]}
              />
              {!matches.length ? (
                <AppText accessibilityLiveRegion="polite" tone="secondary">
                  찾는 목표가 없어요.
                </AppText>
              ) : null}
              {matches.map((target) => (
                <Pressable
                  key={target.key}
                  accessibilityRole="button"
                  accessibilityState={{ selected: currentKey === target.key }}
                  onPress={() => choose(target.key)}
                  style={styles.option}
                >
                  <View style={[styles.dot, { backgroundColor: color(target) }]} />
                  <AppText style={styles.grow}>{target.title}</AppText>
                  <AppText variant="caption" tone="secondary">
                    {target.kind === 'dday' ? '기존 목표' : statusLabels[target.value.status]}
                  </AppText>
                </Pressable>
              ))}
              <Button
                variant="ghost"
                onPress={() => {
                  setAll(false);
                  setForm('create');
                }}
              >
                새 목표 만들기
              </Button>
              {ordered.length > 1 ? (
                <Button
                  variant="ghost"
                  onPress={() => {
                    setDraft(ordered.map((target) => target.key));
                    setHistory([]);
                    setOrdering(true);
                  }}
                >
                  목표 순서 바꾸기
                </Button>
              ) : null}
            </View>
          ) : null}
          {form ? (
            <GoalForm
              key={form === 'edit' ? currentKey : 'new'}
              goal={form === 'edit' && current?.kind === 'goal' ? current.value : undefined}
              color={form === 'edit' && current ? color(current) : getDdayGoalFallbackColor(0)}
              onCancel={() => setForm(null)}
              onSaved={async (saved, selectedColor) => {
                const key: PlanGoalKey = `goal:${saved.id}`;
                setSelected(key);
                setForm(null);
                setAll(false);
                setMenu(false);
                try {
                  await savePreferences({ selected: key, colors: { [key]: selectedColor } });
                } catch {
                  setNotice('목표는 저장됐어요. 이 기기의 색상과 마지막 선택은 저장하지 못했어요.');
                }
              }}
            />
          ) : !ordering && current ? (
            <View key={current.key} style={styles.section}>
              <View style={styles.header}>
                <View style={styles.grow}>
                  <AppText style={styles.title} weight="bold">
                    {current.title}
                  </AppText>
                  {current.targetDate ? (
                    <AppText variant="label" tone="secondary">
                      목표일{' '}
                      {formatDateLabel(current.targetDate, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </AppText>
                  ) : null}
                  {current.kind === 'goal' && current.value.status !== 'ACTIVE' ? (
                    <AppText variant="caption" tone="secondary">
                      {statusLabels[current.value.status]}
                    </AppText>
                  ) : null}
                </View>
                {itemOrder.editing ? (
                  <Button
                    size="compact"
                    loading={itemOrder.saving}
                    onPress={() => itemRef.current?.saveOrder()}
                  >
                    완료
                  </Button>
                ) : currentGoal?.status === 'ARCHIVED' ? null : (
                  <IconButton
                    accessibilityLabel={`${current.title} 관리 메뉴`}
                    expanded={menu}
                    disabled={status.isPending || plansEditing}
                    onPress={() => setMenu(!menu)}
                  >
                    <MaterialCommunityIcons
                      name="dots-horizontal"
                      size={24}
                      color={theme.colors.textSecondary}
                    />
                  </IconButton>
                )}
              </View>
              {menu ? (
                <View style={styles.actions}>
                  {current.kind === 'goal' ? (
                    <>
                      {current.value.status !== 'ARCHIVED' ? (
                        <>
                          <Button
                            size="compact"
                            variant="ghost"
                            disabled={status.isPending}
                            onPress={() => {
                              setForm('edit');
                              setMenu(false);
                            }}
                          >
                            목표 수정
                          </Button>
                          {(['ACTIVE', 'PAUSED', 'ACHIEVED', 'ARCHIVED'] as GoalStatus[])
                            .filter((value) => value !== currentGoal?.status)
                            .map((value) => (
                              <Button
                                key={value}
                                size="compact"
                                variant="ghost"
                                disabled={status.isPending}
                                onPress={() => {
                                  status.reset();
                                  setFuturePolicy('PAUSE_FUTURE');
                                  setConfirmation(value);
                                  setMenu(false);
                                }}
                              >
                                {value === 'ACTIVE'
                                  ? currentGoal?.status === 'ACHIEVED'
                                    ? '달성 취소'
                                    : '다시 시작'
                                  : value === 'PAUSED'
                                    ? '잠시 멈추기'
                                    : value === 'ACHIEVED'
                                      ? '달성으로 기록'
                                      : '목표 보관'}
                              </Button>
                            ))}
                        </>
                      ) : null}
                    </>
                  ) : (
                    <>
                      <Button
                        size="compact"
                        variant="ghost"
                        disabled={!itemOrder.canEdit}
                        onPress={() => {
                          setMenu(false);
                          itemRef.current?.startOrdering();
                        }}
                      >
                        순서 바꾸기
                      </Button>
                      <Button size="compact" variant="ghost" onPress={() => router.push('/dday')}>
                        기존 목표 관리
                      </Button>
                    </>
                  )}
                  <Button size="compact" variant="ghost" onPress={() => setMenu(false)}>
                    닫기
                  </Button>
                </View>
              ) : null}
              {confirmation && current.kind === 'goal' ? (
                <View style={styles.section}>
                  <AppText>
                    {confirmation === 'ACTIVE'
                      ? '목표를 다시 진행할까요? 멈춘 반복 계획은 자동으로 시작하지 않아요.'
                      : `${statusLabels[confirmation]} 상태로 바꿀까요? 지나온 기록은 그대로 남아요.`}
                  </AppText>
                  {confirmation !== 'ACTIVE' ? (
                    <>
                      <AppText variant="caption" tone="secondary">
                        앞으로의 반복 계획은 어떻게 할까요?
                      </AppText>
                      <View style={styles.actions}>
                        <Button
                          size="compact"
                          variant={futurePolicy === 'PAUSE_FUTURE' ? 'secondary' : 'ghost'}
                          accessibilityState={{ selected: futurePolicy === 'PAUSE_FUTURE' }}
                          disabled={status.isPending}
                          onPress={() => setFuturePolicy('PAUSE_FUTURE')}
                        >
                          계획도 멈추기
                        </Button>
                        <Button
                          size="compact"
                          variant={futurePolicy === 'KEEP_FUTURE' ? 'secondary' : 'ghost'}
                          accessibilityState={{ selected: futurePolicy === 'KEEP_FUTURE' }}
                          disabled={status.isPending}
                          onPress={() => setFuturePolicy('KEEP_FUTURE')}
                        >
                          계획 유지
                        </Button>
                      </View>
                    </>
                  ) : null}
                  {confirmation === 'ARCHIVED' ? (
                    <AppText variant="caption" tone="secondary">
                      보관한 목표는 조회할 수 있지만 다시 수정하거나 활성화할 수 없어요.
                    </AppText>
                  ) : null}
                  {status.error ? (
                    <InlineNotice
                      tone="danger"
                      message={getUserFacingApiErrorMessage(status.error)}
                    />
                  ) : null}
                  <View style={styles.actions}>
                    <Button
                      disabled={status.isPending}
                      variant="ghost"
                      onPress={() => {
                        setConfirmation(null);
                        status.reset();
                      }}
                    >
                      취소
                    </Button>
                    <Button loading={status.isPending} onPress={() => void setGoalStatus()}>
                      확인
                    </Button>
                  </View>
                </View>
              ) : null}
              {current.kind === 'goal' ? (
                <>
                  {current.value.desiredOutcome ? (
                    <AppText tone="secondary">{current.value.desiredOutcome}</AppText>
                  ) : null}
                  {current.value.motivationText ? (
                    <AppText tone="secondary">{current.value.motivationText}</AppText>
                  ) : null}
                  <GoalPlanList
                    key={current.key}
                    goal={current.value}
                    disabled={Boolean(confirmation) || status.isPending || menu || all}
                    onEditingChange={setPlansEditing}
                  />
                </>
              ) : (
                <>
                  <DdayGoalTasks
                    key={current.key}
                    ref={itemRef}
                    goalId={current.value.id}
                    goalTitle={current.title}
                    selectionScope={scope}
                    onOrderStateChange={setItemOrder}
                    onDragging={setDragging}
                  />
                  {!itemOrder.editing ? (
                    <Button
                      variant="ghost"
                      onPress={() =>
                        router.push({
                          pathname: '/tasks/new',
                          params: { goalId: String(current.value.id) },
                        })
                      }
                    >
                      항목 추가
                    </Button>
                  ) : null}
                </>
              )}
            </View>
          ) : !form && !ordering && !goals.error && !legacy.error ? (
            <EmptyState
              title="원하는 방향부터 정해볼까요?"
              description="잘할 자신이 없어도 괜찮아요. 해보고 싶은 일을 적어보세요."
              primaryAction={<Button onPress={() => setForm('create')}>첫 목표 만들기</Button>}
            />
          ) : null}
          {!ordered.length && (goals.error || legacy.error) && !form ? (
            <Button onPress={() => setForm('create')}>새 목표 만들기</Button>
          ) : null}
        </>
      )}
    </Screen>
  );
}
const styles = StyleSheet.create({
  screen: { gap: spacing[4], paddingTop: 0 },
  navigation: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1 },
  tabs: { flex: 1 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    borderBottomWidth: 2,
  },
  tabTitle: { maxWidth: 172 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  section: { gap: spacing[3] },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginTop: spacing[1] },
  title: { fontSize: 24, lineHeight: 32 },
  grow: { flex: 1, minWidth: 0 },
  option: { flexDirection: 'row', alignItems: 'center', minHeight: 48, gap: spacing[3] },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  search: { minHeight: 48, borderWidth: 1, borderRadius: 8, padding: spacing[3], fontSize: 16 },
});
