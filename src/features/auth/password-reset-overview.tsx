import { useMutation, useQuery } from '@tanstack/react-query';
import type { Href } from 'expo-router';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { forwardRef, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText, Button, InlineNotice, Screen } from '@/components/ui';
import { authApi, getUserFacingApiErrorMessage } from '@/services/api';
import { radii, spacing, typography, useAppTheme } from '@/theme';

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function tokenFingerprint(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export function PasswordResetOverview() {
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const token = firstParam(params.token)?.trim() ?? '';

  return token ? <ConfirmPasswordReset token={token} /> : <RequestPasswordReset />;
}

function RequestPasswordReset() {
  const router = useRouter();
  const theme = useAppTheme();
  const [email, setEmail] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const requestReset = useMutation({
    mutationFn: (normalizedEmail: string) =>
      authApi.requestPasswordReset({ email: normalizedEmail }),
    onSuccess: (_, normalizedEmail) => {
      setValidationMessage(null);
      setSubmittedEmail(normalizedEmail);
    },
  });

  const submit = () => {
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setValidationMessage('이메일을 입력해 주세요.');
      return;
    }

    setValidationMessage(null);
    requestReset.mutate(normalizedEmail);
  };

  return (
    <PasswordResetShell
      title="비밀번호를 다시 설정해요"
      description="가입한 이메일로 30분 동안 사용할 수 있는 재설정 링크를 보내드려요."
    >
      <View style={styles.field}>
        <AppText variant="label" weight="bold">
          이메일
        </AppText>
        <TextInput
          accessibilityLabel="비밀번호 재설정 이메일"
          autoCapitalize="none"
          autoComplete="email"
          editable={!requestReset.isPending}
          inputMode="email"
          onChangeText={(value) => {
            setEmail(value);
            setSubmittedEmail(null);
          }}
          onSubmitEditing={submit}
          placeholder="you@example.com"
          placeholderTextColor={theme.colors.textMuted}
          returnKeyType="send"
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              color: theme.colors.text,
            },
          ]}
          textContentType="username"
          value={email}
        />
      </View>

      {submittedEmail ? (
        <InlineNotice
          tone="success"
          title="메일을 확인해 주세요"
          message={`${submittedEmail} 계정이 있다면 재설정 링크를 보냈어요. 받은편지함과 스팸함을 확인해 주세요.`}
        />
      ) : null}
      {validationMessage ? <InlineNotice tone="danger" message={validationMessage} /> : null}
      {requestReset.error ? (
        <InlineNotice tone="danger" message={getUserFacingApiErrorMessage(requestReset.error)} />
      ) : null}

      <Button fullWidth loading={requestReset.isPending} onPress={submit} size="large">
        {submittedEmail ? '재설정 메일 다시 보내기' : '재설정 메일 보내기'}
      </Button>
      <Button onPress={() => router.replace('/login' as Href)} variant="ghost">
        로그인으로 돌아가기
      </Button>
    </PasswordResetShell>
  );
}

function ConfirmPasswordReset({ token }: { token: string }) {
  const router = useRouter();
  const theme = useAppTheme();
  const confirmInputRef = useRef<TextInput>(null);
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const verification = useQuery({
    queryKey: ['password-reset-token', tokenFingerprint(token)],
    queryFn: () => authApi.verifyPasswordResetToken({ token }),
    retry: false,
  });
  const confirmReset = useMutation({
    mutationFn: () => authApi.confirmPasswordReset({ token, newPassword: password }),
    onSuccess: () => {
      router.replace({ pathname: '/login', params: { reset: '1' } } as Href);
    },
  });

  const submit = () => {
    if (password.length < 8 || password.length > 72) {
      setValidationMessage('비밀번호는 8자 이상 72자 이하로 입력해 주세요.');
      return;
    }
    if (password !== passwordConfirmation) {
      setValidationMessage('새 비밀번호가 서로 일치하지 않아요.');
      return;
    }

    setValidationMessage(null);
    confirmReset.mutate();
  };

  if (verification.isPending) {
    return (
      <PasswordResetShell title="재설정 링크를 확인하고 있어요" description="잠시만 기다려 주세요.">
        <View accessibilityLabel="비밀번호 재설정 링크 확인 중" style={styles.loadingState}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      </PasswordResetShell>
    );
  }

  if (verification.error || !verification.data?.valid) {
    return (
      <PasswordResetShell
        title="이 링크를 사용할 수 없어요"
        description="재설정 링크가 만료됐거나 이미 사용됐을 수 있어요."
      >
        <InlineNotice
          tone="warning"
          message={
            verification.error
              ? getUserFacingApiErrorMessage(verification.error)
              : '새 재설정 링크를 요청해 주세요.'
          }
        />
        <Button fullWidth onPress={() => router.replace('/password-reset' as Href)} size="large">
          새 링크 요청하기
        </Button>
        <Button onPress={() => router.replace('/login' as Href)} variant="ghost">
          로그인으로 돌아가기
        </Button>
      </PasswordResetShell>
    );
  }

  return (
    <PasswordResetShell
      title="새 비밀번호를 입력해요"
      description={
        verification.data.maskedEmail
          ? `${verification.data.maskedEmail} 계정에 사용할 새 비밀번호를 설정해 주세요.`
          : '계정에 사용할 새 비밀번호를 설정해 주세요.'
      }
    >
      <PasswordField
        label="새 비밀번호"
        value={password}
        visible={passwordVisible}
        editable={!confirmReset.isPending}
        onChangeText={setPassword}
        onSubmitEditing={() => confirmInputRef.current?.focus()}
        onToggleVisibility={() => setPasswordVisible((visible) => !visible)}
      />
      <PasswordField
        ref={confirmInputRef}
        label="새 비밀번호 확인"
        value={passwordConfirmation}
        visible={passwordVisible}
        editable={!confirmReset.isPending}
        onChangeText={setPasswordConfirmation}
        onSubmitEditing={submit}
        onToggleVisibility={() => setPasswordVisible((visible) => !visible)}
      />
      <AppText tone="secondary" variant="caption">
        8자 이상 72자 이하로 입력해 주세요.
      </AppText>

      {validationMessage ? <InlineNotice tone="danger" message={validationMessage} /> : null}
      {confirmReset.error ? (
        <InlineNotice tone="danger" message={getUserFacingApiErrorMessage(confirmReset.error)} />
      ) : null}

      <Button fullWidth loading={confirmReset.isPending} onPress={submit} size="large">
        새 비밀번호 저장하기
      </Button>
    </PasswordResetShell>
  );
}

type PasswordFieldProps = {
  label: string;
  value: string;
  visible: boolean;
  editable: boolean;
  onChangeText: (value: string) => void;
  onSubmitEditing: () => void;
  onToggleVisibility: () => void;
};

const PasswordField = forwardRef<TextInput, PasswordFieldProps>(function PasswordField(
  { label, value, visible, editable, onChangeText, onSubmitEditing, onToggleVisibility },
  ref,
) {
  const theme = useAppTheme();

  return (
    <View style={styles.field}>
      <AppText variant="label" weight="bold">
        {label}
      </AppText>
      <View
        style={[
          styles.passwordField,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        ]}
      >
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          autoCapitalize="none"
          autoComplete="password-new"
          editable={editable}
          maxLength={72}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmitEditing}
          placeholder="8자 이상"
          placeholderTextColor={theme.colors.textMuted}
          returnKeyType={label === '새 비밀번호' ? 'next' : 'done'}
          secureTextEntry={!visible}
          style={[styles.passwordInput, { color: theme.colors.text }]}
          textContentType="newPassword"
          value={value}
        />
        <Pressable
          accessibilityLabel={visible ? `${label} 숨기기` : `${label} 보기`}
          accessibilityRole="button"
          disabled={!editable}
          onPress={onToggleVisibility}
          style={styles.passwordToggle}
        >
          <AppText tone="secondary" variant="caption" weight="bold">
            {visible ? '숨김' : '보기'}
          </AppText>
        </Pressable>
      </View>
    </View>
  );
});

function PasswordResetShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  const theme = useAppTheme();

  return (
    <Screen scroll contentContainerStyle={styles.screen}>
      <View style={styles.hero}>
        <View style={styles.brandRow}>
          <View
            accessibilityElementsHidden
            importantForAccessibility="no"
            style={[styles.brandMark, { backgroundColor: theme.colors.primarySoft }]}
          >
            <AppText tone="primary" variant="bodyLarge" weight="heavy">
              D
            </AppText>
          </View>
          <AppText variant="label" weight="bold">
            Dooit
          </AppText>
        </View>
        <View style={styles.heroCopy}>
          <AppText accessibilityRole="header" variant="display" weight="heavy">
            {title}
          </AppText>
          <AppText tone="secondary" variant="body">
            {description}
          </AppText>
        </View>
      </View>

      <View
        style={[
          styles.formCard,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        ]}
      >
        {children}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    gap: spacing[5],
    justifyContent: 'center',
    paddingBottom: spacing[8],
    paddingTop: spacing[8],
  },
  hero: { gap: spacing[5] },
  brandRow: { alignItems: 'center', flexDirection: 'row', gap: spacing[2] },
  brandMark: {
    alignItems: 'center',
    borderRadius: radii.full,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  heroCopy: { gap: spacing[2] },
  formCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    gap: spacing[4],
    padding: spacing[4],
  },
  field: { gap: spacing[2] },
  input: {
    borderRadius: radii.lg,
    borderWidth: 1,
    fontSize: typography.size.body,
    minHeight: 52,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
  passwordField: {
    alignItems: 'center',
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 52,
    paddingLeft: spacing[4],
    paddingRight: spacing[2],
  },
  passwordInput: {
    flex: 1,
    fontSize: typography.size.body,
    paddingVertical: spacing[2],
  },
  passwordToggle: {
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing[2],
  },
  loadingState: { alignItems: 'center', minHeight: 96, justifyContent: 'center' },
});
