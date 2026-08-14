import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, TextInput, View } from 'react-native';

import {
  AppText,
  Button,
  Card,
  EmptyState,
  IconButton,
  InlineNotice,
  PageHeader,
  Screen,
  SectionHeader,
} from '@/components/ui';
import { radii, spacing, useAppTheme } from '@/theme';
import type { TaskTemplateResponse } from '@/types';
import { toApiLocalDate } from '@/utils';

import {
  useCreateTaskFromTemplate,
  useCreateTaskTemplate,
  useDeleteTaskTemplate,
  useUpdateTaskTemplate,
} from './use-task-template-mutations';
import { useTaskTemplates } from './use-task-templates';
import { TaskTemplateSettingsFields } from './task-template-settings-fields';
import {
  buildTaskTemplateSettingsRequest,
  getTaskTemplateSettingsValues,
} from './task-template-settings';

type Feedback = { message: string; tone: 'success' | 'danger' };

export function TaskTemplateOverview() {
  const router = useRouter();
  const theme = useAppTheme();
  const templatesQuery = useTaskTemplates();
  const createTask = useCreateTaskFromTemplate();
  const deleteTemplate = useDeleteTaskTemplate();
  const [isCreating, setIsCreating] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const templates = templatesQuery.data ?? [];

  const applyTemplate = (template: TaskTemplateResponse) => {
    setFeedback(null);
    createTask.mutate(
      { templateId: template.id, request: { targetDate: toApiLocalDate() } },
      {
        onError: (error) => setFeedback({ message: error.message, tone: 'danger' }),
        onSuccess: () =>
          setFeedback({
            message: `“${template.title}”을 오늘 할 일에 추가했어요.`,
            tone: 'success',
          }),
      },
    );
  };

  const removeTemplate = (template: TaskTemplateResponse) => {
    setFeedback(null);
    deleteTemplate.mutate(template.id, {
      onError: (error) => setFeedback({ message: error.message, tone: 'danger' }),
      onSuccess: () => {
        setConfirmingDeleteId(null);
        setEditingTemplateId(null);
        setFeedback({ message: `“${template.title}” 템플릿을 삭제했어요.`, tone: 'success' });
      },
    });
  };

  return (
    <Screen scroll contentContainerStyle={styles.screen}>
      <PageHeader
        title="Task 템플릿"
        leading={
          <IconButton accessibilityLabel="더보기 화면으로 돌아가기" onPress={router.back}>
            <SymbolView
              name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
              size={20}
              tintColor={theme.colors.text}
            />
          </IconButton>
        }
        action={
          isCreating ? undefined : (
            <Button size="compact" variant="secondary" onPress={() => setIsCreating(true)}>
              새 템플릿
            </Button>
          )
        }
      />

      <AppText tone="secondary">
        자주 하는 일을 저장해 두고 오늘 할 일로 빠르게 추가할 수 있어요.
      </AppText>

      {feedback ? <InlineNotice message={feedback.message} tone={feedback.tone} /> : null}

      {isCreating ? <TaskTemplateCreateForm onClose={() => setIsCreating(false)} /> : null}

      {templatesQuery.isPending ? (
        <View accessibilityLabel="Task 템플릿을 불러오는 중" style={styles.stateRow}>
          <ActivityIndicator color={theme.colors.primary} />
          <AppText tone="secondary" variant="label">
            템플릿을 불러오고 있어요.
          </AppText>
        </View>
      ) : templatesQuery.error ? (
        <InlineNotice
          title="템플릿을 불러오지 못했어요"
          message={templatesQuery.error.message}
          tone="danger"
          action={
            <Button size="compact" variant="ghost" onPress={() => void templatesQuery.refetch()}>
              다시 시도
            </Button>
          }
        />
      ) : templates.length === 0 ? (
        <EmptyState
          title="아직 저장한 템플릿이 없어요"
          description="상단의 새 템플릿 버튼으로 자주 하는 일을 저장해 보세요."
        />
      ) : (
        <View style={styles.list}>
          <SectionHeader count={templates.length} title="나의 템플릿" />
          {templates.map((template) => (
            <Card key={template.id} style={styles.card}>
              {editingTemplateId === template.id ? (
                <TaskTemplateEditForm
                  template={template}
                  onClose={() => setEditingTemplateId(null)}
                  onUpdated={() => {
                    setEditingTemplateId(null);
                    setFeedback({ message: '템플릿을 수정했어요.', tone: 'success' });
                  }}
                />
              ) : (
                <View style={styles.copy}>
                  <AppText numberOfLines={2} weight="semibold">
                    {template.title}
                  </AppText>
                  {template.description ? (
                    <AppText numberOfLines={3} tone="secondary" variant="caption">
                      {template.description}
                    </AppText>
                  ) : null}
                  <AppText tone="muted" variant="caption">
                    {template.type === 'SCHEDULE' ? '일정' : '할 일'}
                    {template.category ? ` · ${template.category}` : ''}
                  </AppText>
                </View>
              )}

              {editingTemplateId === template.id ? null : confirmingDeleteId === template.id ? (
                <View style={styles.confirmation}>
                  <AppText tone="secondary" variant="caption">
                    이 템플릿을 삭제할까요? 이미 만든 Task는 그대로 남아요.
                  </AppText>
                  <View style={styles.actions}>
                    <Button
                      size="compact"
                      variant="ghost"
                      onPress={() => setConfirmingDeleteId(null)}
                    >
                      취소
                    </Button>
                    <Button
                      loading={deleteTemplate.isPending}
                      size="compact"
                      variant="danger"
                      onPress={() => removeTemplate(template)}
                    >
                      삭제
                    </Button>
                  </View>
                </View>
              ) : (
                <View style={styles.actions}>
                  <Button
                    accessibilityLabel={`${template.title} 템플릿 편집`}
                    size="compact"
                    variant="ghost"
                    onPress={() => {
                      setConfirmingDeleteId(null);
                      setEditingTemplateId(template.id);
                    }}
                  >
                    편집
                  </Button>
                  <Button
                    accessibilityLabel={`${template.title} 템플릿 삭제`}
                    size="compact"
                    variant="ghost"
                    onPress={() => setConfirmingDeleteId(template.id)}
                  >
                    삭제
                  </Button>
                  <Button
                    accessibilityLabel={`${template.title} 템플릿을 오늘 할 일로 추가`}
                    loading={
                      createTask.isPending && createTask.variables?.templateId === template.id
                    }
                    size="compact"
                    onPress={() => applyTemplate(template)}
                  >
                    오늘 추가
                  </Button>
                </View>
              )}
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}

function TaskTemplateEditForm({
  template,
  onClose,
  onUpdated,
}: {
  template: TaskTemplateResponse;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const theme = useAppTheme();
  const updateTemplate = useUpdateTaskTemplate();
  const [title, setTitle] = useState(template.title);
  const [description, setDescription] = useState(template.description ?? '');
  const [category, setCategory] = useState(template.category ?? '');
  const [settings, setSettings] = useState(() => getTaskTemplateSettingsValues(template));
  const [titleError, setTitleError] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  const submit = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setTitleError('템플릿 이름을 입력해 주세요.');
      return;
    }

    const settingsResult = buildTaskTemplateSettingsRequest(settings);
    if (!settingsResult.ok) {
      setSettingsError(settingsResult.message);
      return;
    }

    updateTemplate.mutate(
      {
        templateId: template.id,
        request: {
          title: trimmedTitle,
          description: description.trim() || null,
          category: category.trim() || null,
          ...settingsResult.request,
        },
      },
      { onSuccess: onUpdated },
    );
  };

  const resetError = () => {
    setTitleError(null);
    updateTemplate.reset();
  };

  return (
    <View style={styles.form}>
      <View style={styles.copy}>
        <AppText variant="bodyLarge" weight="bold">
          템플릿 편집
        </AppText>
        <AppText tone="secondary" variant="caption">
          이름과 설명, 분류를 수정할 수 있어요.
        </AppText>
      </View>
      <View style={styles.field}>
        <View style={styles.labelRow}>
          <AppText variant="label" weight="bold">
            이름
          </AppText>
          <AppText tone="muted" variant="caption">
            {title.length}/30
          </AppText>
        </View>
        <TextInput
          accessibilityLabel="Task 템플릿 이름 편집"
          editable={!updateTemplate.isPending}
          maxLength={30}
          onChangeText={(value) => {
            setTitle(value);
            resetError();
          }}
          placeholderTextColor={theme.colors.textMuted}
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.surfaceMuted,
              borderColor: titleError ? theme.colors.danger : theme.colors.border,
              color: theme.colors.text,
            },
          ]}
          value={title}
        />
        {titleError ? (
          <AppText tone="danger" variant="caption">
            {titleError}
          </AppText>
        ) : null}
      </View>
      <View style={styles.field}>
        <View style={styles.labelRow}>
          <AppText variant="label" weight="bold">
            설명
          </AppText>
          <AppText tone="muted" variant="caption">
            {description.length}/300
          </AppText>
        </View>
        <TextInput
          accessibilityLabel="Task 템플릿 설명 편집"
          editable={!updateTemplate.isPending}
          maxLength={300}
          multiline
          onChangeText={(value) => {
            setDescription(value);
            updateTemplate.reset();
          }}
          placeholder="설명 없음"
          placeholderTextColor={theme.colors.textMuted}
          style={[
            styles.input,
            styles.multilineInput,
            {
              backgroundColor: theme.colors.surfaceMuted,
              borderColor: theme.colors.border,
              color: theme.colors.text,
            },
          ]}
          textAlignVertical="top"
          value={description}
        />
      </View>
      <View style={styles.field}>
        <View style={styles.labelRow}>
          <AppText variant="label" weight="bold">
            분류
          </AppText>
          <AppText tone="muted" variant="caption">
            {category.length}/30
          </AppText>
        </View>
        <TextInput
          accessibilityLabel="Task 템플릿 분류 편집"
          editable={!updateTemplate.isPending}
          maxLength={30}
          onChangeText={(value) => {
            setCategory(value);
            updateTemplate.reset();
          }}
          placeholder="예: 업무, 집안일"
          placeholderTextColor={theme.colors.textMuted}
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.surfaceMuted,
              borderColor: theme.colors.border,
              color: theme.colors.text,
            },
          ]}
          value={category}
        />
      </View>
      <TaskTemplateSettingsFields
        disabled={updateTemplate.isPending}
        onChange={(values) => {
          setSettings(values);
          setSettingsError(null);
          updateTemplate.reset();
        }}
        values={settings}
      />
      {settingsError ? <InlineNotice message={settingsError} tone="warning" /> : null}
      {updateTemplate.error ? (
        <InlineNotice message={updateTemplate.error.message} tone="danger" />
      ) : null}
      <View style={styles.formActions}>
        <Button disabled={updateTemplate.isPending} fullWidth variant="secondary" onPress={onClose}>
          취소
        </Button>
        <Button fullWidth loading={updateTemplate.isPending} onPress={submit}>
          변경 저장
        </Button>
      </View>
    </View>
  );
}

function TaskTemplateCreateForm({ onClose }: { onClose: () => void }) {
  const theme = useAppTheme();
  const createTemplate = useCreateTaskTemplate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [titleError, setTitleError] = useState<string | null>(null);

  const submit = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setTitleError('템플릿 이름을 입력해 주세요.');
      return;
    }

    createTemplate.mutate(
      {
        title: trimmedTitle,
        description: description.trim() || null,
        type: 'TODO',
        allDay: false,
      },
      { onSuccess: onClose },
    );
  };

  return (
    <Card style={styles.form}>
      <View style={styles.copy}>
        <AppText variant="bodyLarge" weight="bold">
          새 템플릿
        </AppText>
        <AppText tone="secondary" variant="caption">
          이름과 설명을 저장해 기본 할 일로 반복해서 사용할 수 있어요.
        </AppText>
      </View>
      <View style={styles.field}>
        <View style={styles.labelRow}>
          <AppText variant="label" weight="bold">
            이름
          </AppText>
          <AppText tone="muted" variant="caption">
            {title.length}/30
          </AppText>
        </View>
        <TextInput
          accessibilityLabel="Task 템플릿 이름"
          editable={!createTemplate.isPending}
          maxLength={30}
          onChangeText={(value) => {
            setTitle(value);
            setTitleError(null);
            createTemplate.reset();
          }}
          placeholder="예: 매일 아침 계획"
          placeholderTextColor={theme.colors.textMuted}
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.surfaceMuted,
              borderColor: titleError ? theme.colors.danger : theme.colors.border,
              color: theme.colors.text,
            },
          ]}
          value={title}
        />
        {titleError ? (
          <AppText tone="danger" variant="caption">
            {titleError}
          </AppText>
        ) : null}
      </View>
      <View style={styles.field}>
        <View style={styles.labelRow}>
          <AppText variant="label" weight="bold">
            설명
          </AppText>
          <AppText tone="muted" variant="caption">
            {description.length}/300
          </AppText>
        </View>
        <TextInput
          accessibilityLabel="Task 템플릿 설명"
          editable={!createTemplate.isPending}
          maxLength={300}
          multiline
          onChangeText={(value) => {
            setDescription(value);
            createTemplate.reset();
          }}
          placeholder="이 일을 할 때 필요한 내용을 적어 두세요."
          placeholderTextColor={theme.colors.textMuted}
          style={[
            styles.input,
            styles.multilineInput,
            {
              backgroundColor: theme.colors.surfaceMuted,
              borderColor: theme.colors.border,
              color: theme.colors.text,
            },
          ]}
          textAlignVertical="top"
          value={description}
        />
      </View>
      {createTemplate.error ? (
        <InlineNotice message={createTemplate.error.message} tone="danger" />
      ) : null}
      <View style={styles.formActions}>
        <Button disabled={createTemplate.isPending} fullWidth variant="secondary" onPress={onClose}>
          취소
        </Button>
        <Button fullWidth loading={createTemplate.isPending} onPress={submit}>
          저장
        </Button>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: spacing[4],
    paddingBottom: spacing[8],
    paddingTop: spacing[3],
  },
  stateRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[2],
    paddingVertical: spacing[5],
  },
  list: {
    gap: spacing[3],
  },
  card: {
    gap: spacing[3],
  },
  copy: {
    gap: spacing[1],
  },
  confirmation: {
    gap: spacing[2],
  },
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[2],
    justifyContent: 'flex-end',
  },
  form: {
    gap: spacing[4],
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
  multilineInput: {
    minHeight: 96,
  },
  formActions: {
    gap: spacing[2],
  },
});
