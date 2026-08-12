import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useDeferredValue, useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

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
} from '@/components/ui';
import { getUserFacingApiErrorMessage } from '@/services/api';
import { radii, spacing, useAppTheme } from '@/theme';
import type {
  LocalDateString,
  TaskSearchItem,
  TaskSearchQuery,
  TaskSearchSort,
  TaskType,
} from '@/types';
import { formatDateLabel, shiftLocalDate, toApiLocalDate } from '@/utils';

import { useTaskSearch } from './use-task-search';

type SearchFilter = 'ALL' | 'PLANNED' | 'DONE' | 'SCHEDULE';
type DateRangeFilter = 'ALL' | '7D' | '30D' | 'MONTH';
type DdayFilter = 'ALL' | 'LINKED' | 'UNLINKED';
type CategoryFilter = 'ALL' | 'UI/UX' | 'API' | '일정' | 'D-Day';
type SortFilter = 'RELEVANT_DATE_DESC' | 'RELEVANT_DATE_ASC';

const searchFilters: { value: SearchFilter; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'PLANNED', label: '예정' },
  { value: 'DONE', label: '완료' },
  { value: 'SCHEDULE', label: '일정' },
];

const dateRangeFilters: { value: DateRangeFilter; label: string }[] = [
  { value: 'ALL', label: '전체 기간' },
  { value: '7D', label: '최근 7일' },
  { value: '30D', label: '최근 30일' },
  { value: 'MONTH', label: '이번 달' },
];

const ddayFilters: { value: DdayFilter; label: string }[] = [
  { value: 'ALL', label: 'D-Day 전체' },
  { value: 'LINKED', label: 'D-Day 연결' },
  { value: 'UNLINKED', label: 'D-Day 없음' },
];

const categoryFilters: { value: CategoryFilter; label: string }[] = [
  { value: 'ALL', label: '카테고리 전체' },
  { value: 'UI/UX', label: 'UI/UX' },
  { value: 'API', label: 'API' },
  { value: '일정', label: '일정' },
  { value: 'D-Day', label: 'D-Day' },
];

const sortFilters: { value: SortFilter; label: string; query: TaskSearchSort }[] = [
  { value: 'RELEVANT_DATE_DESC', label: '최신순', query: 'RELEVANT_DATE_DESC' },
  { value: 'RELEVANT_DATE_ASC', label: '오래된순', query: 'RELEVANT_DATE_ASC' },
];

const SEARCH_PAGE_SIZE = 5;

const dateSourceLabels: Record<TaskSearchItem['dateSource'], string> = {
  TARGET_DATE: '목표일',
  START_AT: '일정',
  COMPLETED_AT: '완료',
  CREATED_AT: '생성',
  UPDATED_AT: '수정',
  NONE: '날짜 없음',
};

export function SearchOverview() {
  const router = useRouter();
  const theme = useAppTheme();
  const [keyword, setKeyword] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<SearchFilter>('ALL');
  const [selectedDateRange, setSelectedDateRange] = useState<DateRangeFilter>('ALL');
  const [selectedDdayFilter, setSelectedDdayFilter] = useState<DdayFilter>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('ALL');
  const [selectedSort, setSelectedSort] = useState<SortFilter>('RELEVANT_DATE_DESC');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [focusedElement, setFocusedElement] = useState<string | null>(null);
  const deferredKeyword = useDeferredValue(keyword.trim());
  const hasKeyword = keyword.trim().length > 0;
  const hasActiveSearchConditions =
    hasKeyword ||
    selectedFilter !== 'ALL' ||
    selectedDateRange !== 'ALL' ||
    selectedDdayFilter !== 'ALL' ||
    selectedCategory !== 'ALL' ||
    selectedSort !== 'RELEVANT_DATE_DESC';
  const today = toApiLocalDate();
  const dateRangeQuery = useMemo(
    () => getDateRangeQuery(selectedDateRange, today),
    [selectedDateRange, today],
  );
  const ddayQuery = useMemo(() => getDdayQuery(selectedDdayFilter), [selectedDdayFilter]);
  const categoryQuery = useMemo(() => getCategoryQuery(selectedCategory), [selectedCategory]);
  const searchQuery = useMemo<TaskSearchQuery>(() => {
    const baseQuery = {
      q: deferredKeyword || undefined,
      ...dateRangeQuery,
      ...ddayQuery,
      ...categoryQuery,
      sort: sortFilters.find((filter) => filter.value === selectedSort)?.query,
      limit: SEARCH_PAGE_SIZE,
    };

    if (selectedFilter === 'PLANNED') {
      return {
        ...baseQuery,
        statuses: ['INBOX', 'TODAY'],
      };
    }

    if (selectedFilter === 'DONE') {
      return {
        ...baseQuery,
        statuses: ['DONE'],
      };
    }

    if (selectedFilter === 'SCHEDULE') {
      return {
        ...baseQuery,
        taskTypes: ['SCHEDULE'],
      };
    }

    return baseQuery;
  }, [categoryQuery, dateRangeQuery, ddayQuery, deferredKeyword, selectedFilter, selectedSort]);
  const search = useTaskSearch(searchQuery, { enabled: hasActiveSearchConditions });
  const results = search.data?.pages.flatMap((page) => page.items) ?? [];
  const selectedFilterLabel =
    searchFilters.find((filter) => filter.value === selectedFilter)?.label ?? '전체';
  const selectedDateRangeLabel =
    dateRangeFilters.find((filter) => filter.value === selectedDateRange)?.label ?? '전체 기간';
  const selectedDdayFilterLabel =
    ddayFilters.find((filter) => filter.value === selectedDdayFilter)?.label ?? 'D-Day 전체';
  const selectedCategoryLabel =
    categoryFilters.find((filter) => filter.value === selectedCategory)?.label ?? '카테고리 전체';
  const selectedSortLabel =
    sortFilters.find((filter) => filter.value === selectedSort)?.label ?? '최신순';
  const baseSummary = hasKeyword
    ? `“${keyword.trim()}” · ${selectedFilterLabel}`
    : `${selectedFilterLabel} 기록`;
  const activeExtraFilters = [
    selectedDateRange === 'ALL' ? null : selectedDateRangeLabel,
    selectedDdayFilter === 'ALL' ? null : selectedDdayFilterLabel,
    selectedCategory === 'ALL' ? null : selectedCategoryLabel,
    selectedSort === 'RELEVANT_DATE_DESC' ? null : selectedSortLabel,
  ].filter((value): value is string => Boolean(value));
  const activeExtraFilterCount = activeExtraFilters.length;
  const searchSummary =
    activeExtraFilters.length > 0
      ? `${baseSummary} · ${activeExtraFilters.join(' · ')}`
      : baseSummary;
  const resultDescription = !hasActiveSearchConditions
    ? '검색어나 필터를 선택하면 결과를 보여줘요.'
    : search.isFetching
      ? '검색 결과를 업데이트하고 있어요.'
      : hasKeyword
        ? `${searchSummary}에서 찾은 항목이에요.`
        : `${searchSummary}을 최근 관련 날짜 순으로 보여줘요.`;
  const resetSearchConditions = () => {
    setKeyword('');
    setSelectedFilter('ALL');
    setSelectedDateRange('ALL');
    setSelectedDdayFilter('ALL');
    setSelectedCategory('ALL');
    setSelectedSort('RELEVANT_DATE_DESC');
    setFocusedElement(null);
  };

  return (
    <Screen scroll contentContainerStyle={styles.screen}>
      <PageHeader
        title="검색"
        leading={
          <IconButton accessibilityLabel="프로필 화면으로 돌아가기" onPress={router.back}>
            <SymbolView
              name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
              size={20}
              tintColor={theme.colors.text}
            />
          </IconButton>
        }
      />

      <Card variant="sheet" style={styles.searchCard}>
        <View
          style={[
            styles.inputFrame,
            {
              backgroundColor: theme.colors.surfaceMuted,
              borderColor: focusedElement === 'input' ? theme.colors.primary : theme.colors.border,
              borderWidth: focusedElement === 'input' ? 2 : StyleSheet.hairlineWidth,
            },
          ]}
        >
          <SymbolView
            name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
            size={18}
            tintColor={theme.colors.textMuted}
          />
          <TextInput
            accessibilityLabel="Task, 일정, 완료 기록 검색어"
            accessibilityHint="키워드로 과거 Task, 일정, 완료 기록을 찾습니다."
            autoCapitalize="none"
            onBlur={() => setFocusedElement(null)}
            onChangeText={setKeyword}
            onFocus={() => setFocusedElement('input')}
            placeholder="키워드나 날짜로 찾아보기"
            placeholderTextColor={theme.colors.textMuted}
            style={[styles.input, { color: theme.colors.text }]}
            value={keyword}
          />
          {hasKeyword ? (
            <Pressable
              accessibilityLabel="검색어 지우기"
              accessibilityRole="button"
              hitSlop={4}
              onBlur={() => setFocusedElement(null)}
              onFocus={() => setFocusedElement('clear')}
              onPress={() => setKeyword('')}
              style={[
                styles.clearButton,
                {
                  backgroundColor:
                    focusedElement === 'clear' ? theme.colors.primarySoft : 'transparent',
                  borderColor: focusedElement === 'clear' ? theme.colors.primary : 'transparent',
                },
              ]}
            >
              <AppText tone="secondary" variant="label" weight="bold">
                ×
              </AppText>
            </Pressable>
          ) : null}
        </View>

        <View accessibilityLabel="검색 필터" style={styles.filters}>
          {searchFilters.map((filter) => {
            const selected = selectedFilter === filter.value;

            return (
              <Pressable
                key={filter.value}
                accessibilityLabel={`${filter.label} 검색 필터`}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onBlur={() => setFocusedElement(null)}
                onFocus={() => setFocusedElement(filter.value)}
                onPress={() => setSelectedFilter(filter.value)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: selected ? theme.colors.highlightBlue : 'transparent',
                    borderColor:
                      focusedElement === filter.value || selected
                        ? theme.colors.primary
                        : theme.colors.border,
                    borderWidth: focusedElement === filter.value ? 2 : StyleSheet.hairlineWidth,
                  },
                ]}
              >
                <AppText tone={selected ? 'primary' : 'secondary'} variant="caption">
                  {filter.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          accessibilityLabel={`상세 검색 필터 ${showAdvancedFilters ? '접기' : '펼치기'}`}
          accessibilityRole="button"
          accessibilityState={{ expanded: showAdvancedFilters }}
          onBlur={() => setFocusedElement(null)}
          onFocus={() => setFocusedElement('advanced-toggle')}
          onPress={() => setShowAdvancedFilters((current) => !current)}
          style={({ pressed }) => [
            styles.advancedToggle,
            {
              backgroundColor: pressed ? theme.colors.surfaceMuted : theme.colors.surface,
              borderColor:
                focusedElement === 'advanced-toggle' ? theme.colors.primary : theme.colors.border,
              borderWidth: focusedElement === 'advanced-toggle' ? 2 : StyleSheet.hairlineWidth,
            },
          ]}
        >
          <View style={styles.advancedToggleCopy}>
            <AppText variant="caption" weight="semibold">
              상세 필터
            </AppText>
            <AppText numberOfLines={1} tone="secondary" variant="caption">
              {activeExtraFilterCount > 0
                ? `${activeExtraFilterCount}개 적용 · ${activeExtraFilters.join(' · ')}`
                : '기간 · D-Day · 카테고리 · 정렬'}
            </AppText>
          </View>
          <SymbolView
            name={{
              ios: showAdvancedFilters ? 'chevron.up' : 'chevron.down',
              android: showAdvancedFilters ? 'keyboard_arrow_up' : 'keyboard_arrow_down',
              web: showAdvancedFilters ? 'keyboard_arrow_up' : 'keyboard_arrow_down',
            }}
            size={18}
            tintColor={theme.colors.textMuted}
          />
        </Pressable>

        {showAdvancedFilters ? (
          <View style={styles.advancedFilters}>
            <View style={styles.filterGroup}>
              <AppText tone="secondary" variant="caption" weight="semibold">
                기간
              </AppText>
              <View accessibilityLabel="검색 날짜 범위" style={styles.filters}>
                {dateRangeFilters.map((filter) => {
                  const selected = selectedDateRange === filter.value;
                  const focusKey = `date-${filter.value}`;

                  return (
                    <Pressable
                      key={filter.value}
                      accessibilityLabel={`${filter.label} 검색 기간`}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onBlur={() => setFocusedElement(null)}
                      onFocus={() => setFocusedElement(focusKey)}
                      onPress={() => setSelectedDateRange(filter.value)}
                      style={[
                        styles.filterChip,
                        {
                          backgroundColor: selected ? theme.colors.highlightAmber : 'transparent',
                          borderColor:
                            focusedElement === focusKey || selected
                              ? theme.colors.warning
                              : theme.colors.border,
                          borderWidth: focusedElement === focusKey ? 2 : StyleSheet.hairlineWidth,
                        },
                      ]}
                    >
                      <AppText tone={selected ? 'warning' : 'secondary'} variant="caption">
                        {filter.label}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.filterGroup}>
              <AppText tone="secondary" variant="caption" weight="semibold">
                D-Day
              </AppText>
              <View accessibilityLabel="D-Day 연결 검색 필터" style={styles.filters}>
                {ddayFilters.map((filter) => {
                  const selected = selectedDdayFilter === filter.value;
                  const focusKey = `dday-${filter.value}`;

                  return (
                    <Pressable
                      key={filter.value}
                      accessibilityLabel={`${filter.label} 검색 필터`}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onBlur={() => setFocusedElement(null)}
                      onFocus={() => setFocusedElement(focusKey)}
                      onPress={() => setSelectedDdayFilter(filter.value)}
                      style={[
                        styles.filterChip,
                        {
                          backgroundColor: selected ? theme.colors.highlightSage : 'transparent',
                          borderColor:
                            focusedElement === focusKey || selected
                              ? theme.colors.success
                              : theme.colors.border,
                          borderWidth: focusedElement === focusKey ? 2 : StyleSheet.hairlineWidth,
                        },
                      ]}
                    >
                      <AppText tone={selected ? 'success' : 'secondary'} variant="caption">
                        {filter.label}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.filterGroup}>
              <AppText tone="secondary" variant="caption" weight="semibold">
                카테고리
              </AppText>
              <View accessibilityLabel="카테고리 검색 필터" style={styles.filters}>
                {categoryFilters.map((filter) => {
                  const selected = selectedCategory === filter.value;
                  const focusKey = `category-${filter.value}`;

                  return (
                    <Pressable
                      key={filter.value}
                      accessibilityLabel={`${filter.label} 검색 필터`}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onBlur={() => setFocusedElement(null)}
                      onFocus={() => setFocusedElement(focusKey)}
                      onPress={() => setSelectedCategory(filter.value)}
                      style={[
                        styles.filterChip,
                        {
                          backgroundColor: selected ? theme.colors.highlightBlue : 'transparent',
                          borderColor:
                            focusedElement === focusKey || selected
                              ? theme.colors.primary
                              : theme.colors.border,
                          borderWidth: focusedElement === focusKey ? 2 : StyleSheet.hairlineWidth,
                        },
                      ]}
                    >
                      <AppText tone={selected ? 'primary' : 'secondary'} variant="caption">
                        {filter.label}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.filterGroup}>
              <AppText tone="secondary" variant="caption" weight="semibold">
                정렬
              </AppText>
              <View accessibilityLabel="검색 결과 정렬" style={styles.filters}>
                {sortFilters.map((filter) => {
                  const selected = selectedSort === filter.value;
                  const focusKey = `sort-${filter.value}`;

                  return (
                    <Pressable
                      key={filter.value}
                      accessibilityLabel={`${filter.label} 검색 정렬`}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onBlur={() => setFocusedElement(null)}
                      onFocus={() => setFocusedElement(focusKey)}
                      onPress={() => setSelectedSort(filter.value)}
                      style={[
                        styles.filterChip,
                        {
                          backgroundColor: selected ? theme.colors.highlightAmber : 'transparent',
                          borderColor:
                            focusedElement === focusKey || selected
                              ? theme.colors.warning
                              : theme.colors.border,
                          borderWidth: focusedElement === focusKey ? 2 : StyleSheet.hairlineWidth,
                        },
                      ]}
                    >
                      <AppText tone={selected ? 'warning' : 'secondary'} variant="caption">
                        {filter.label}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        ) : null}

        <View style={styles.searchMetaRow}>
          <View style={[styles.searchMetaPill, { backgroundColor: theme.colors.highlightSage }]}>
            <AppText tone="success" variant="caption" weight="semibold">
              {searchSummary}
            </AppText>
          </View>
          {hasActiveSearchConditions ? (
            <Button size="compact" variant="ghost" onPress={resetSearchConditions}>
              초기화
            </Button>
          ) : (
            <AppText tone="secondary" variant="caption">
              통합 검색
            </AppText>
          )}
        </View>
      </Card>

      {hasActiveSearchConditions && search.error ? (
        <InlineNotice
          tone="danger"
          message={getUserFacingApiErrorMessage(search.error)}
          action={
            <Button size="compact" variant="ghost" onPress={() => void search.refetch()}>
              재시도
            </Button>
          }
        />
      ) : null}

      <Card variant="outlined" style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <AppText variant="bodyLarge" weight="bold">
              검색 결과
            </AppText>
            <AppText tone="secondary" variant="caption">
              {results.length}개
            </AppText>
          </View>
          <AppText tone="secondary" variant="caption">
            {resultDescription}
          </AppText>
        </View>

        {!hasActiveSearchConditions ? (
          <EmptyState
            icon={
              <View style={[styles.emptyIcon, { backgroundColor: theme.colors.primarySoft }]}>
                <SymbolView
                  name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
                  size={22}
                  tintColor={theme.colors.primary}
                />
              </View>
            }
            title="무엇을 찾고 있나요?"
            description="검색어를 입력하거나 필터로 기록을 둘러보세요."
          />
        ) : search.isLoading ? (
          <ListSkeleton accessibilityLabel="검색 결과를 불러오는 중" count={3} />
        ) : results.length === 0 ? (
          <EmptyState
            title="찾은 항목이 없어요"
            description="검색어를 줄이거나 전체 필터로 다시 확인해 보세요."
            secondaryAction={
              <Button variant="secondary" onPress={resetSearchConditions}>
                검색 조건 초기화
              </Button>
            }
          />
        ) : (
          <View style={styles.resultList}>
            {results.map((item) => (
              <SearchResultRow
                key={item.task.id}
                item={item}
                focused={focusedElement === `result-${item.task.id}`}
                onBlur={() => setFocusedElement(null)}
                onFocus={() => setFocusedElement(`result-${item.task.id}`)}
                onPress={() =>
                  router.push({
                    pathname: '/tasks/[taskId]',
                    params: { taskId: String(item.task.id) },
                  })
                }
              />
            ))}
            {search.hasNextPage ? (
              <Button
                fullWidth
                loading={search.isFetchingNextPage}
                size="compact"
                variant="secondary"
                onPress={() => void search.fetchNextPage()}
              >
                더 보기
              </Button>
            ) : null}
          </View>
        )}
      </Card>
    </Screen>
  );
}

type SearchResultRowProps = {
  item: TaskSearchItem;
  focused: boolean;
  onBlur: () => void;
  onFocus: () => void;
  onPress: () => void;
};

function SearchResultRow({ item, focused, onBlur, onFocus, onPress }: SearchResultRowProps) {
  const theme = useAppTheme();
  const typeLabel = getTaskTypeLabel(item.task.type);

  return (
    <Pressable
      accessibilityLabel={`${item.task.title}, ${dateSourceLabels[item.dateSource]} ${formatDateLabel(
        item.relevantDate,
      )}, 상세 보기`}
      accessibilityRole="button"
      onBlur={onBlur}
      onFocus={onFocus}
      onPress={onPress}
      style={({ pressed }) => [
        styles.resultRow,
        {
          backgroundColor: pressed ? theme.colors.surfaceMuted : theme.colors.surface,
          borderColor: focused ? theme.colors.primary : theme.colors.border,
          borderWidth: focused ? 2 : StyleSheet.hairlineWidth,
        },
      ]}
    >
      <View style={styles.resultCopy}>
        <AppText numberOfLines={2} weight="medium">
          {item.task.title}
        </AppText>
        <AppText numberOfLines={1} tone="secondary" variant="caption">
          {dateSourceLabels[item.dateSource]} ·{' '}
          {formatDateLabel(item.relevantDate, { month: 'long', day: 'numeric', weekday: 'short' })}{' '}
          · {typeLabel}
          {item.task.category ? ` · ${item.task.category}` : ''}
        </AppText>
      </View>
      <AppText tone="muted" variant="bodyLarge">
        ›
      </AppText>
    </Pressable>
  );
}

function getTaskTypeLabel(type: TaskType) {
  if (type === 'SCHEDULE') return '일정';
  if (type === 'IDEA') return '아이디어';

  return 'Task';
}

function getDateRangeQuery(
  filter: DateRangeFilter,
  today: LocalDateString,
): Pick<TaskSearchQuery, 'dateField' | 'dateFrom' | 'dateTo'> {
  if (filter === '7D') {
    return {
      dateField: 'TARGET',
      dateFrom: shiftLocalDate(today, -6) ?? today,
      dateTo: today,
    };
  }

  if (filter === '30D') {
    return {
      dateField: 'TARGET',
      dateFrom: shiftLocalDate(today, -29) ?? today,
      dateTo: today,
    };
  }

  if (filter === 'MONTH') {
    return {
      dateField: 'TARGET',
      dateFrom: `${today.slice(0, 7)}-01` as LocalDateString,
      dateTo: today,
    };
  }

  return {};
}

function getDdayQuery(filter: DdayFilter): Pick<TaskSearchQuery, 'hasDday'> {
  if (filter === 'LINKED') {
    return { hasDday: true };
  }

  if (filter === 'UNLINKED') {
    return { hasDday: false };
  }

  return {};
}

function getCategoryQuery(filter: CategoryFilter): Pick<TaskSearchQuery, 'category'> {
  if (filter === 'ALL') {
    return {};
  }

  return { category: filter };
}

const styles = StyleSheet.create({
  screen: {
    gap: spacing[3],
    paddingTop: spacing[3],
  },
  emptyIcon: {
    alignItems: 'center',
    borderRadius: radii.full,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  searchCard: {
    gap: spacing[2],
  },
  inputFrame: {
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing[2],
    minHeight: 48,
    paddingHorizontal: spacing[3],
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: spacing[2],
  },
  clearButton: {
    alignItems: 'center',
    borderRadius: radii.full,
    borderWidth: 1,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  filterGroup: {
    gap: spacing[2],
  },
  advancedToggle: {
    alignItems: 'center',
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing[2],
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  advancedToggleCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  advancedFilters: {
    gap: spacing[3],
  },
  filterChip: {
    alignItems: 'center',
    borderRadius: radii.full,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    minHeight: 36,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
  },
  searchMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[2],
    justifyContent: 'space-between',
  },
  searchMetaPill: {
    borderRadius: radii.full,
    flexShrink: 1,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
  },
  section: {
    gap: spacing[4],
  },
  sectionHeader: {
    gap: spacing[1],
  },
  sectionTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  resultList: {
    gap: spacing[1],
  },
  resultRow: {
    alignItems: 'center',
    borderRadius: radii.md,
    flexDirection: 'row',
    gap: spacing[3],
    minHeight: 60,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  resultCopy: {
    flex: 1,
    gap: spacing[1],
    minWidth: 0,
  },
});
