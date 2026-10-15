import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText, Button, Card, InlineNotice } from '@/components/ui';
import { radii, spacing, useAppTheme } from '@/theme';
import { ddayGoalLimits } from '@/types';
import type { DdayGoalRequest, DdayGoalResponse } from '@/types';

import { useCreateDdayGoal } from './use-create-dday-goal';
import { type DdayGoalFormValues, validateDdayGoal } from './dday-validation';
import { ddayGoalColors, setDdayGoalColor, type DdayGoalColor } from './dday-goal-colors';

type DdayCreateFormProps = {
  onCancel: () => void;
  onCreated: (goal: DdayGoalResponse) => void;
};

type DdayFormField = 'title' | 'targetDate';

const initialValues: DdayGoalFormValues = {
  title: '',
  targetDate: '',
};

export function DdayCreateForm({ onCancel, onCreated }: DdayCreateFormProps) {
  const theme = useAppTheme();
  const createGoal = useCreateDdayGoal();
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<ReturnType<typeof validateDdayGoal>>({});
  const [focusedField, setFocusedField] = useState<DdayFormField | null>(null);
  const [selectedColor, setSelectedColor] = useState<DdayGoalColor>(ddayGoalColors[0].value);

  const updateField = (field: keyof DdayGoalFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    createGoal.reset();
  };

  const handleSubmit = () => {
    const nextErrors = validateDdayGoal(values);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const request: DdayGoalRequest = {
      title: values.title.trim(),
      targetDate: values.targetDate.trim() as DdayGoalRequest['targetDate'],
    };

    createGoal.mutate(request, {
      onSuccess: async (createdGoal) => {
        try {
          await setDdayGoalColor(createdGoal.id, selectedColor);
        } catch {
          // The goal itself was created. Today can still use its deterministic fallback color.
        }
        setValues(initialValues);
        onCreated(createdGoal);
      },
    });
  };

  return (
    <Card style={styles.card}>
      <View style={styles.heading}>
        <AppText variant="bodyLarge" weight="bold">
          새 목표
        </AppText>
        <AppText tone="secondary" variant="caption">
          이루고 싶은 것과 기준이 될 날짜를 정해보세요.
        </AppText>
      </View>

      <View style={styles.field}>
        <View style={styles.labelRow}>
          <AppText variant="label" weight="bold">
            목표 이름
          </AppText>
          <AppText tone="muted" variant="caption">
            {values.title.length}/{ddayGoalLimits.title}
          </AppText>
        </View>
        <TextInput
          accessibilityLabel="목표 이름"
          editable={!createGoal.isPending}
          maxLength={ddayGoalLimits.title}
          onBlur={() => setFocusedField(null)}
          onChangeText={(value) => updateField('title', value)}
          onFocus={() => setFocusedField('title')}
          placeholder="예: 앱 정식 출시"
          placeholderTextColor={theme.colors.textMuted}
          returnKeyType="next"
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.surfaceMuted,
              borderColor: errors.title
                ? theme.colors.danger
                : focusedField === 'title'
                  ? theme.colors.primary
                  : theme.colors.border,
              borderWidth: focusedField === 'title' ? 2 : 1,
              color: theme.colors.text,
            },
          ]}
          value={values.title}
        />
        {errors.title ? (
          <AppText tone="danger" variant="caption">
            {errors.title}
          </AppText>
        ) : null}
      </View>

      <View style={styles.field}>
        <AppText variant="label" weight="bold">
          목표 색상
        </AppText>
        <View accessibilityRole="radiogroup" style={styles.colorOptions}>
          {ddayGoalColors.map((color) => {
            const selected = selectedColor === color.value;
            return (
              <Pressable
                accessibilityLabel={`${color.label} 색상`}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                key={color.id}
                onPress={() => setSelectedColor(color.value)}
                style={({ pressed }) => [
                  styles.colorButton,
                  {
                    borderColor: selected ? theme.colors.text : 'transparent',
                    opacity: pressed ? 0.72 : 1,
                  },
                ]}
              >
                <View style={[styles.colorSwatch, { backgroundColor: color.value }]} />
              </Pressable>
            );
          })}
        </View>
        <AppText tone="secondary" variant="caption">
          오늘 목록에서 목표를 구분할 때 사용해요.
        </AppText>
      </View>

      <View style={styles.field}>
        <AppText variant="label" weight="bold">
          목표 날짜
        </AppText>
        <TextInput
          accessibilityLabel="목표 날짜"
          autoCapitalize="none"
          editable={!createGoal.isPending}
          maxLength={10}
          onBlur={() => setFocusedField(null)}
          onChangeText={(value) => updateField('targetDate', value)}
          onFocus={() => setFocusedField('targetDate')}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={theme.colors.textMuted}
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.surfaceMuted,
              borderColor: errors.targetDate
                ? theme.colors.danger
                : focusedField === 'targetDate'
                  ? theme.colors.primary
                  : theme.colors.border,
              borderWidth: focusedField === 'targetDate' ? 2 : 1,
              color: theme.colors.text,
            },
          ]}
          value={values.targetDate}
        />
        {errors.targetDate ? (
          <AppText tone="danger" variant="caption">
            {errors.targetDate}
          </AppText>
        ) : (
          <AppText tone="secondary" variant="caption">
            예: 2026-12-31
          </AppText>
        )}
      </View>

      {createGoal.error ? <InlineNotice message={createGoal.error.message} tone="danger" /> : null}

      <View style={styles.actions}>
        <Button disabled={createGoal.isPending} fullWidth variant="secondary" onPress={onCancel}>
          취소
        </Button>
        <Button fullWidth loading={createGoal.isPending} onPress={handleSubmit}>
          목표 만들기
        </Button>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing[4],
  },
  heading: {
    gap: spacing[1],
  },
  field: {
    gap: spacing[2],
  },
  labelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  input: {
    borderRadius: radii.md,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
  },
  actions: {
    gap: spacing[2],
  },
  colorOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  colorButton: {
    alignItems: 'center',
    borderRadius: radii.full,
    borderWidth: 2,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  colorSwatch: {
    borderRadius: radii.full,
    height: 26,
    width: 26,
  },
});
