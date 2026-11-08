import { useInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from 'react-native';

import {
  AppIcon,
  AppText,
  Button,
  InlineNotice,
  ItemCopy,
  ItemLeading,
  uiAuditProps,
} from '@/components/ui';
import { useDdayGoalTasks } from '@/features/dday/use-dday-goal-tasks';
import { useAppToday } from '@/services/time/use-app-today';
import { spacing, useAppTheme } from '@/theme';
import { formatDateLabel } from '@/utils';

import {
  fetchHistoryPage,
  goalHistoryRows,
  legacyHistoryRows,
  type HistoryPageParam,
  type HistoryRow,
} from './goal-history';
import { goalJourneyQueryKeys } from './goal-journey-query-keys';

const BATCH = 3;

export function GoalHistoryList({ kind, id }: { kind: 'goal' | 'dday'; id: number }) {
  return kind === 'goal' ? <GoalHistory id={id} /> : <DdayHistory id={id} />;
}

function GoalHistory({ id }: { id: number }) {
  const today = useAppToday();
  const [visible, setVisible] = useState(BATCH);
  const initialPageParam: HistoryPageParam = { cursor: null, version: null, used: [] };
  const query = useInfiniteQuery({
    queryKey: [...goalJourneyQueryKeys.goal(id), 'inline-history', today],
    queryFn: ({ pageParam, signal }) => fetchHistoryPage(id, today, pageParam, signal),
    initialPageParam,
    getNextPageParam: (last, _pages, param) =>
      last.nextCursor
        ? {
            cursor: last.nextCursor,
            version: last.journeyVersion,
            used: [...param.used, ...(param.cursor ? [param.cursor] : [])],
          }
        : undefined,
    enabled: Platform.OS !== 'web' || typeof window !== 'undefined',
    retry: false,
  });
  const rows = goalHistoryRows(query.data?.pages ?? []);
  const more = visible < rows.length || query.hasNextPage;
  return (
    <HistoryContent
      rows={rows.slice(0, visible)}
      loading={query.isPending}
      error={query.error}
      loadingMore={query.isFetchingNextPage}
      more={Boolean(more)}
      expanded={visible > BATCH && rows.length > BATCH}
      onRetry={() => {
        setVisible(BATCH);
        void query.refetch();
      }}
      onCollapse={() => setVisible(BATCH)}
      onMore={() => {
        if (visible < rows.length) setVisible((value) => value + BATCH);
        else if (query.hasNextPage && !query.isFetchingNextPage) {
          void query
            .fetchNextPage({ throwOnError: true })
            .then(() => setVisible((value) => value + BATCH))
            .catch(() => {});
        }
      }}
    />
  );
}

function DdayHistory({ id }: { id: number }) {
  const query = useDdayGoalTasks(id);
  const [visible, setVisible] = useState(BATCH);
  const rows = legacyHistoryRows(query.data ?? []);
  // The plan list uses the same query and already owns its retry notice.
  if (query.error) return null;
  return (
    <HistoryContent
      rows={rows.slice(0, visible)}
      loading={query.isPending}
      error={query.error}
      more={visible < rows.length}
      expanded={visible > BATCH && rows.length > BATCH}
      onRetry={() => void query.refetch()}
      onMore={() => setVisible((value) => value + BATCH)}
      onCollapse={() => setVisible(BATCH)}
    />
  );
}

function HistoryContent({
  rows,
  loading,
  error,
  loadingMore,
  more,
  expanded,
  onRetry,
  onMore,
  onCollapse,
}: {
  rows: HistoryRow[];
  loading: boolean;
  error: Error | null;
  loadingMore?: boolean;
  more: boolean;
  expanded: boolean;
  onRetry: () => void;
  onMore: () => void;
  onCollapse: () => void;
}) {
  const theme = useAppTheme();
  const today = useAppToday();
  const router = useRouter();
  const [focusedKey, setFocusedKey] = useState<string | null>(null);
  if (!loading && !error && !rows.length) return null;
  return (
    <View style={styles.section}>
      <AppText variant="sectionTitle" weight="semibold" accessibilityRole="header">
        최근 기록
      </AppText>
      {loading ? (
        <ActivityIndicator accessibilityLabel="기록을 불러오는 중" color={theme.colors.primary} />
      ) : null}
      {!error &&
        rows.map((row) => {
          const date = row.date
            ? formatDateLabel(row.date, {
                ...(row.date.slice(0, 4) !== today.slice(0, 4) ? { year: 'numeric' } : {}),
                month: 'long',
                day: 'numeric',
              })
            : '날짜 미확인';
          const contents = (
            <>
              <ItemLeading>
                <AppIcon name="check" size="meta" color={theme.colors.textSecondary} />
              </ItemLeading>
              <View style={styles.copy}>
                <ItemCopy title={row.title} metadata={row.detail} />
              </View>
              <AppText variant="caption" tone="secondary">
                {date}
              </AppText>
              {row.taskId !== null ? (
                <AppIcon name="chevron-right" size="meta" color={theme.colors.textSecondary} />
              ) : null}
            </>
          );
          const audit = uiAuditProps({
            uiRow: 'goal-history',
            uiAlign: 'text-block',
            ...(row.taskId !== null ? { uiTouch: '44' } : {}),
          });
          return row.taskId !== null ? (
            <Pressable
              key={row.key}
              {...audit}
              accessibilityRole="button"
              accessibilityLabel={`${row.title}, ${date}, 상세 보기`}
              onFocus={() => setFocusedKey(row.key)}
              onBlur={() => setFocusedKey(null)}
              onPress={() =>
                router.push({ pathname: '/tasks/[taskId]', params: { taskId: String(row.taskId) } })
              }
              style={({ pressed }) => [
                styles.row,
                {
                  backgroundColor: pressed ? theme.colors.surfaceMuted : 'transparent',
                  borderColor: focusedKey === row.key ? theme.colors.primary : 'transparent',
                },
              ]}
            >
              {contents}
            </Pressable>
          ) : (
            <View key={row.key} {...audit} style={styles.row}>
              {contents}
            </View>
          );
        })}
      {error ? (
        <InlineNotice
          tone="warning"
          message="기록을 불러오지 못했어요. 다시 불러와 주세요."
          action={
            <Button size="compact" variant="ghost" onPress={onRetry}>
              다시 불러오기
            </Button>
          }
        />
      ) : more || expanded ? (
        <View style={styles.more}>
          <Button
            variant="ghost"
            size="medium"
            accessibilityLabel={more ? '이전 기록 더 보기' : '기록 접기'}
            loading={loadingMore}
            onPress={more ? onMore : onCollapse}
          >
            <View
              {...uiAuditProps({ uiRow: 'goal-history-more', uiAlign: 'text-block' })}
              style={styles.moreLabel}
            >
              <AppText
                {...uiAuditProps({ uiText: 'block' })}
                variant="body"
                tone="primary"
                weight="semibold"
              >
                {more ? '이전 기록 더 보기' : '기록 접기'}
              </AppText>
              <AppIcon
                name={more ? 'chevron-down' : 'chevron-up'}
                size="meta"
                color={theme.colors.primary}
              />
            </View>
          </Button>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing[2], paddingTop: spacing[3] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    minHeight: 48,
    paddingVertical: spacing[1],
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 8,
  },
  copy: { flex: 1, minWidth: 0 },
  more: { alignItems: 'flex-start' },
  moreLabel: { flexDirection: 'row', alignItems: 'center', gap: spacing[1] },
});
