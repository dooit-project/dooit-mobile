import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { Keyboard, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Button, Card, IconButton, InlineNotice } from '@/components/ui';
import { getQuickCaptureResultMessage, useQuickCaptureTask } from '@/features/tasks';
import { radii, sizes, spacing, useAppTheme, useMobileLayout } from '@/theme';
import type { TaskQuickCaptureResponse } from '@/types';
import { APP_TIME_ZONE, toApiLocalDate } from '@/utils';

type QuickCaptureProps = {
  isExpanded: boolean;
  onExpandedChange: (isExpanded: boolean) => void;
};

export function QuickCapture({ isExpanded, onExpandedChange }: QuickCaptureProps) {
  const theme = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { screenPadding } = useMobileLayout();
  const containerInsets = {
    paddingBottom: screenPadding + spacing[3],
    paddingLeft: Math.max(screenPadding, insets.left),
    paddingRight: Math.max(screenPadding, insets.right),
    paddingTop: screenPadding,
  };
  const inputRef = useRef<TextInput>(null);
  const quickCapture = useQuickCaptureTask();
  const [title, setTitle] = useState('');
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [result, setResult] = useState<TaskQuickCaptureResponse | null>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const canSubmit = title.trim().length > 0 && !quickCapture.isPending;

  const handleChange = (value: string) => {
    setTitle(value);
    setValidationMessage(null);
    setResult(null);
    quickCapture.reset();
  };

  const handleSubmit = () => {
    const normalizedTitle = title.trim();

    if (!normalizedTitle) {
      setValidationMessage('기록할 내용을 입력해 주세요.');
      inputRef.current?.focus();
      return;
    }

    quickCapture.mutate(
      {
        text: normalizedTitle,
        referenceDate: toApiLocalDate(),
        timeZone: APP_TIME_ZONE,
      },
      {
        onSuccess: (response) => {
          setTitle('');
          setResult(response);
          Keyboard.dismiss();
        },
      },
    );
  };

  const openComposer = () => {
    onExpandedChange(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  };
  const closeComposer = () => {
    onExpandedChange(false);
    setValidationMessage(null);
    setResult(null);
    Keyboard.dismiss();
  };

  useEffect(() => {
    if (isExpanded) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isExpanded]);

  return (
    <View style={[styles.container, containerInsets]}>
      {isExpanded ? (
        <Card
          style={[
            styles.composerCard,
            {
              borderColor: theme.colors.borderStrong,
              shadowColor: theme.colors.shadow,
            },
          ]}
        >
          <View style={styles.composerRow}>
            <IconButton
              accessibilityLabel="빠른 기록 닫기"
              disabled={quickCapture.isPending}
              onPress={closeComposer}
              style={styles.closeButton}
            >
              <AppText tone="secondary" variant="bodyLarge">
                ×
              </AppText>
            </IconButton>
            <TextInput
              ref={inputRef}
              accessibilityLabel="빠르게 할 일 기록"
              accessibilityHint="날짜와 시간을 해석해 할 일이나 일정으로 저장합니다."
              editable={!quickCapture.isPending}
              enterKeyHint="done"
              maxLength={100}
              onBlur={() => setIsInputFocused(false)}
              onChangeText={handleChange}
              onFocus={() => setIsInputFocused(true)}
              onSubmitEditing={handleSubmit}
              placeholder="오늘 할 일"
              placeholderTextColor={theme.colors.textMuted}
              returnKeyType="done"
              style={[
                styles.input,
                {
                  backgroundColor: isInputFocused
                    ? theme.colors.surface
                    : theme.colors.surfaceMuted,
                  borderColor: validationMessage
                    ? theme.colors.danger
                    : isInputFocused
                      ? theme.colors.primarySoft
                      : theme.colors.border,
                  borderWidth: 1,
                  color: theme.colors.text,
                },
              ]}
              value={title}
            />
            <Button
              disabled={!canSubmit}
              loading={quickCapture.isPending}
              size="compact"
              onPress={handleSubmit}
              style={styles.submitButton}
            >
              추가
            </Button>
          </View>

          {validationMessage ? (
            <AppText accessibilityLiveRegion="polite" tone="danger" variant="caption">
              {validationMessage}
            </AppText>
          ) : null}

          {quickCapture.error ? (
            <InlineNotice message={quickCapture.error.message} tone="danger" />
          ) : null}

          {result ? (
            <InlineNotice
              message={getQuickCaptureResultMessage(result)}
              tone="success"
              action={
                <Button
                  size="compact"
                  variant="ghost"
                  onPress={() =>
                    router.push({
                      pathname: '/tasks/[taskId]',
                      params: { taskId: String(result.task.id) },
                    })
                  }
                >
                  확인·수정
                </Button>
              }
            />
          ) : null}
        </Card>
      ) : (
        <Pressable
          accessibilityHint="하단 입력창을 열어 기록함에 할 일을 추가합니다."
          accessibilityLabel="빠르게 기록 열기"
          accessibilityRole="button"
          accessibilityState={{ expanded: false }}
          onPress={openComposer}
          style={({ pressed }) => [
            styles.quickBar,
            {
              backgroundColor: pressed ? theme.colors.surfaceMuted : theme.colors.surface,
              borderColor: theme.colors.borderStrong,
              shadowColor: theme.colors.shadow,
            },
          ]}
        >
          <AppText tone="primary" variant="bodyLarge" weight="bold">
            +
          </AppText>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
    alignSelf: 'center',
    maxWidth: sizes.contentMaxWidth,
    width: '100%',
  },
  composerCard: {
    gap: spacing[1],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[2],
    borderRadius: radii.xl,
    elevation: 10,
    shadowOffset: {
      height: 8,
      width: 0,
    },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    width: '100%',
  },
  composerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[2],
  },
  input: {
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    fontSize: 15,
    minHeight: 40,
    minWidth: 0,
    outlineColor: 'transparent',
    outlineWidth: 0,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
  },
  closeButton: {
    borderRadius: radii.full,
  },
  submitButton: {
    borderRadius: radii.full,
    minWidth: 52,
  },
  quickBar: {
    alignItems: 'center',
    borderRadius: radii.full,
    borderWidth: 1,
    elevation: 8,
    height: 54,
    justifyContent: 'center',
    shadowOffset: {
      height: 8,
      width: 0,
    },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    width: 54,
  },
});
