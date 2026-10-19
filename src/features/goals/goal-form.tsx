import { useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText, Button, Card, InlineNotice } from '@/components/ui';
import { ddayGoalColors, type DdayGoalColor } from '@/features/dday/dday-goal-colors';
import { formatDdayTargetDateInput } from '@/features/dday/dday-validation';
import { shiftMonth } from '@/features/calendar/calendar-date';
import { getUserFacingApiErrorMessage } from '@/services/api';
import { useAppToday } from '@/services/time/use-app-today';
import { radii, spacing, useAppTheme } from '@/theme';
import type { GoalResponse } from '@/types';
import { goalLimits } from '@/types';
import { formatDateLabel, isLocalDateString } from '@/utils';

import { useSaveGoal } from './use-goals';

type Props = {
  goal?: GoalResponse;
  color: DdayGoalColor;
  onCancel: () => void;
  onSaved: (goal: GoalResponse, color: DdayGoalColor) => Promise<void>;
};

export function GoalForm({ goal, color, onCancel, onSaved }: Props) {
  const theme = useAppTheme();
  const today = useAppToday();
  const mutation = useSaveGoal();
  const [title, setTitle] = useState(goal?.title ?? '');
  const [date, setDate] = useState(goal?.targetDate ?? '');
  const [outcome, setOutcome] = useState(goal?.desiredOutcome ?? '');
  const [motivation, setMotivation] = useState(goal?.motivationText ?? '');
  const [selectedColor, setColor] = useState(color);
  const [details, setDetails] = useState(Boolean(goal?.desiredOutcome || goal?.motivationText));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const submitting = useRef(false);
  const inputStyle = (field: string) => [
    styles.input,
    {
      color: theme.colors.text,
      backgroundColor: theme.colors.surfaceMuted,
      borderColor: focused === field ? theme.colors.primary : theme.colors.border,
    },
  ];
  async function submit() {
    if (submitting.current) return;
    if (!title.trim() || title.trim().length > goalLimits.title) {
      setError('목표 이름을 120자 이내로 입력해 주세요.');
      return;
    }
    if (date && !isLocalDateString(date)) {
      setError('목표일을 올바른 연도·월·일로 입력하거나 비워 주세요.');
      return;
    }
    submitting.current = true;
    setBusy(true);
    setError(null);
    try {
      const request = {
        title: title.trim(),
        targetDate: date || null,
        desiredOutcome: outcome.trim() || null,
        motivationText: motivation.trim() || null,
        linkedDdayGoalId: goal?.linkedDdayGoalId ?? null,
      };
      const saved = await mutation.mutateAsync(goal ? { goalId: goal.id, request } : { request });
      // Preference failures are handled by the parent; never turn a successful create into another POST.
      await onSaved(saved, selectedColor);
    } catch (failure) {
      setError(getUserFacingApiErrorMessage(failure));
      submitting.current = false;
      setBusy(false);
    }
  }
  return (
    <Card style={styles.form}>
      <AppText weight="bold" variant="bodyLarge">
        {goal ? '목표 수정' : '새 목표'}
      </AppText>
      <AppText tone="secondary" variant="caption">
        해보고 싶은 일을 적어보세요. 날짜는 나중에 정해도 괜찮아요.
      </AppText>
      <AppText weight="semibold" variant="label">
        목표 이름
      </AppText>
      <TextInput
        accessibilityLabel="목표 이름"
        value={title}
        onChangeText={setTitle}
        editable={!busy}
        maxLength={goalLimits.title}
        placeholder="예: 토익 900점 받기"
        placeholderTextColor={theme.colors.textMuted}
        onFocus={() => setFocused('title')}
        onBlur={() => setFocused(null)}
        style={inputStyle('title')}
      />
      <AppText weight="semibold" variant="label">
        목표일 · 선택
      </AppText>
      <View style={styles.row}>
        {[1, 3, 6].map((months) => (
          <Button
            key={months}
            size="compact"
            variant="ghost"
            disabled={busy}
            onPress={() => setDate(shiftMonth(today, months) ?? '')}
          >
            {months}개월 후
          </Button>
        ))}
        {date ? (
          <Button size="compact" variant="ghost" disabled={busy} onPress={() => setDate('')}>
            날짜 지우기
          </Button>
        ) : null}
      </View>
      <TextInput
        accessibilityLabel="목표일 선택 입력"
        accessibilityHint="연도 월 일 순서로 숫자 8자리. 입력하지 않아도 됩니다."
        value={date}
        onChangeText={(value) => setDate(formatDdayTargetDateInput(value))}
        editable={!busy}
        maxLength={10}
        keyboardType="number-pad"
        inputMode="numeric"
        placeholder="예: 20261130"
        placeholderTextColor={theme.colors.textMuted}
        onFocus={() => setFocused('date')}
        onBlur={() => setFocused(null)}
        style={inputStyle('date')}
      />
      {isLocalDateString(date) ? (
        <AppText variant="caption" tone="secondary">
          {formatDateLabel(date, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long',
          })}
        </AppText>
      ) : null}
      <AppText weight="semibold" variant="label">
        목표 색상
      </AppText>
      <View accessibilityRole="radiogroup" style={styles.row}>
        {ddayGoalColors.map((option) => (
          <Pressable
            key={option.id}
            accessibilityRole="radio"
            accessibilityLabel={`${option.label} 색상`}
            accessibilityState={{ checked: selectedColor === option.value, disabled: busy }}
            disabled={busy}
            onPress={() => setColor(option.value)}
            style={[
              styles.color,
              { borderColor: selectedColor === option.value ? theme.colors.text : 'transparent' },
            ]}
          >
            <View style={[styles.swatch, { backgroundColor: option.value }]} />
          </Pressable>
        ))}
      </View>
      <Button
        size="compact"
        variant="ghost"
        disabled={busy}
        accessibilityState={{ expanded: details }}
        onPress={() => setDetails(!details)}
      >
        바라는 변화와 이유 {details ? '접기' : '추가하기'}
      </Button>
      {details ? (
        <>
          <AppText variant="label">어떤 변화가 생기면 좋을까요? · 선택</AppText>
          <TextInput
            accessibilityLabel="바라는 변화 선택 입력"
            value={outcome}
            onChangeText={setOutcome}
            editable={!busy}
            multiline
            maxLength={goalLimits.desiredOutcome}
            onFocus={() => setFocused('outcome')}
            onBlur={() => setFocused(null)}
            style={inputStyle('outcome')}
          />
          <AppText variant="label">나에게 중요한 이유 · 선택</AppText>
          <TextInput
            accessibilityLabel="목표가 중요한 이유 선택 입력"
            value={motivation}
            onChangeText={setMotivation}
            editable={!busy}
            multiline
            maxLength={goalLimits.motivationText}
            onFocus={() => setFocused('motivation')}
            onBlur={() => setFocused(null)}
            style={inputStyle('motivation')}
          />
        </>
      ) : null}
      {error ? <InlineNotice tone="danger" message={error} /> : null}
      <Button loading={busy} onPress={() => void submit()}>
        {goal ? '수정 저장' : '목표 만들기'}
      </Button>
      <Button variant="secondary" disabled={busy} onPress={onCancel}>
        취소
      </Button>
    </Card>
  );
}
const styles = StyleSheet.create({
  form: { gap: spacing[3] },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  input: {
    fontSize: 16,
    minHeight: 48,
    padding: spacing[3],
    borderWidth: 1,
    borderRadius: radii.md,
  },
  color: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatch: { width: 26, height: 26, borderRadius: 13 },
});
