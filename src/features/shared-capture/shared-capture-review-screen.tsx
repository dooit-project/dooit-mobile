import { useMemo, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Linking, StyleSheet, TextInput, View } from 'react-native';

import { AppText, Button, IconButton, InlineNotice, Screen } from '@/components/ui';
import { useCreateInboxTask } from '@/features/tasks';
import { radii, sizes, spacing, typography, useAppTheme } from '@/theme';

import { getSharedCaptureDomain, getSharedCaptureDraft } from './shared-capture-presentation';
import { useSharedCaptureIncomingShare } from './shared-capture-incoming-share';

export function SharedCaptureReviewScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ text?: string; url?: string }>();
  const inputRef = useRef<TextInput>(null);
  const incomingShare = useSharedCaptureIncomingShare();
  const createTask = useCreateInboxTask();
  const payloadValues = useMemo(
    () => [
      params.text,
      params.url,
      ...incomingShare.sharedPayloads.map((payload) => payload.value),
    ],
    [incomingShare.sharedPayloads, params.text, params.url],
  );
  const draft = useMemo(
    () => getSharedCaptureDraft(payloadValues.filter(Boolean) as string[]),
    [payloadValues],
  );
  const [title, setTitle] = useState(draft.title);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  const close = () => {
    incomingShare.clearSharedPayloads();
    router.replace('/');
  };

  const save = () => {
    const normalizedTitle = title.trim();
    if (!normalizedTitle) {
      setValidationMessage('기록할 제목을 입력해 주세요.');
      inputRef.current?.focus();
      return;
    }

    createTask.mutate(
      {
        title: normalizedTitle,
        description: draft.url,
        type: 'TODO',
        allDay: false,
        startAt: null,
        endAt: null,
        category: null,
        recurrence: null,
        notificationEnabled: false,
        notifyAt: null,
      },
      {
        onSuccess: (task) => {
          incomingShare.clearSharedPayloads();
          router.replace({ pathname: '/tasks/[taskId]', params: { taskId: String(task.id) } });
        },
      },
    );
  };

  return (
    <Screen scroll contentContainerStyle={styles.screen}>
      <View style={styles.header}>
        <AppText variant="title" weight="heavy">
          dooit
        </AppText>
        <IconButton
          accessibilityLabel="공유 내용 기록 취소"
          disabled={createTask.isPending}
          onPress={close}
        >
          <SymbolView
            name={{ ios: 'xmark', android: 'close', web: 'close' }}
            size={22}
            tintColor={theme.colors.text}
          />
        </IconButton>
      </View>

      <View style={styles.intro}>
        <View style={[styles.sourceLabel, { backgroundColor: theme.colors.highlightBlue }]}>
          <AppText tone="primary" variant="label" weight="bold">
            {draft.url ? '링크에서 가져옴' : '공유한 내용'}
          </AppText>
        </View>
        <AppText style={styles.heading} weight="heavy">
          무엇을 기록할까요?
        </AppText>
      </View>

      {draft.url ? (
        <View style={[styles.linkPreview, { borderColor: theme.colors.border }]}>
          <View style={[styles.linkIcon, { backgroundColor: theme.colors.surfaceMuted }]}>
            <SymbolView
              name={{ ios: 'link', android: 'link', web: 'link' }}
              size={28}
              tintColor={theme.colors.primary}
            />
          </View>
          <View style={styles.linkCopy}>
            <AppText tone="secondary" variant="bodyLarge">
              {getSharedCaptureDomain(draft.url)}
            </AppText>
            <AppText numberOfLines={2} variant="bodyLarge" weight="bold">
              {title || '제목을 입력해 주세요'}
            </AppText>
            <AppText numberOfLines={2} tone="primary" variant="body">
              {draft.url}
            </AppText>
          </View>
        </View>
      ) : null}

      <View style={styles.field}>
        <AppText variant="bodyLarge" weight="bold">
          할 일 제목
        </AppText>
        <TextInput
          ref={inputRef}
          accessibilityLabel="공유한 내용의 할 일 제목"
          autoFocus
          editable={!createTask.isPending}
          maxLength={100}
          onBlur={() => setIsFocused(false)}
          onChangeText={(value) => {
            setTitle(value);
            setValidationMessage(null);
          }}
          onFocus={() => setIsFocused(true)}
          onSubmitEditing={save}
          placeholder="기록할 내용을 입력하세요"
          placeholderTextColor={theme.colors.textMuted}
          returnKeyType="done"
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.surface,
              borderColor: validationMessage
                ? theme.colors.danger
                : isFocused
                  ? theme.colors.primary
                  : theme.colors.border,
              borderWidth: isFocused || validationMessage ? 2 : 1,
              color: theme.colors.text,
            },
          ]}
          value={title}
        />
        {validationMessage ? (
          <AppText accessibilityLiveRegion="polite" tone="danger" variant="caption">
            {validationMessage}
          </AppText>
        ) : null}
      </View>

      <View style={styles.destination}>
        <View style={[styles.destinationIcon, { backgroundColor: theme.colors.surfaceMuted }]}>
          <SymbolView
            name={{ ios: 'tray', android: 'inbox', web: 'inbox' }}
            size={26}
            tintColor={theme.colors.primary}
          />
        </View>
        <View>
          <AppText variant="label" weight="bold">
            저장될 위치
          </AppText>
          <AppText variant="bodyLarge">기록함</AppText>
        </View>
      </View>

      <View style={styles.pendingStatus}>
        <SymbolView
          name={{ ios: 'clock', android: 'schedule', web: 'schedule' }}
          size={18}
          tintColor={theme.colors.warning}
        />
        <AppText tone="secondary" variant="label">
          아직 저장 전이에요
        </AppText>
      </View>

      {createTask.error ? <InlineNotice message={createTask.error.message} tone="danger" /> : null}

      <View style={styles.actions}>
        <Button
          fullWidth
          disabled={!title.trim()}
          labelVariant="bodyLarge"
          loading={createTask.isPending}
          onPress={save}
          style={styles.saveButton}
        >
          이 내용으로 저장
        </Button>
        {draft.url ? (
          <Button
            accessibilityHint="공유한 원문 링크를 외부 앱에서 엽니다."
            disabled={createTask.isPending}
            onPress={() => void Linking.openURL(draft.url!)}
            variant="ghost"
          >
            원문 열기
          </Button>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    gap: spacing[6],
    paddingBottom: spacing[6],
    paddingTop: spacing[4],
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  intro: {
    alignItems: 'flex-start',
    gap: spacing[3],
    paddingTop: spacing[4],
  },
  sourceLabel: {
    borderRadius: radii.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  heading: {
    fontSize: typography.size.display,
    lineHeight: typography.lineHeight.display,
  },
  linkPreview: {
    alignItems: 'center',
    borderRadius: radii.xl,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing[4],
    padding: spacing[4],
  },
  linkIcon: {
    alignItems: 'center',
    borderRadius: radii.full,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  linkCopy: {
    flex: 1,
    gap: spacing[1],
    minWidth: 0,
  },
  field: {
    gap: spacing[3],
  },
  input: {
    borderRadius: radii.xl,
    fontSize: typography.size.bodyLarge,
    lineHeight: typography.lineHeight.bodyLarge,
    minHeight: 64,
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
  },
  destination: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[4],
  },
  destinationIcon: {
    alignItems: 'center',
    borderRadius: radii.full,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  pendingStatus: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[2],
    minHeight: sizes.touchTarget,
  },
  actions: {
    gap: spacing[2],
    marginTop: spacing[6],
  },
  saveButton: {
    minHeight: 60,
  },
});
