import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Href } from 'expo-router';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { AppText, Button, InlineNotice, Screen } from '@/components/ui';
import { replaceUserQueryCache } from '@/features/auth/auth-query-cache';
import { shouldShowFirstUseReturn } from '@/features/auth/auth-return-navigation';
import { getAuthSubmissionErrorMessage } from '@/features/auth/auth-submission-error';
import { createGuestMergeRouteParams } from '@/features/auth/guest-merge-result';
import { useAuthState } from '@/features/auth/use-auth-state';
import { authApi } from '@/services/api';
import { radii, spacing, typography, useAppTheme } from '@/theme';

export function LoginOverview() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    email?: string;
    expired?: string;
    guestExpired?: string;
    registered?: string;
  }>();
  const queryClient = useQueryClient();
  const authState = useAuthState();
  const theme = useAppTheme();
  const passwordInputRef = useRef<TextInput>(null);
  const [email, setEmail] = useState(() => params.email ?? '');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const login = useMutation({
    mutationFn: () => authApi.login({ email: email.trim(), password }),
    onSuccess: async (response) => {
      setValidationMessage(null);
      await replaceUserQueryCache(queryClient, response.user);
      router.replace(
        authState.status === 'guest'
          ? ({ pathname: '/', params: createGuestMergeRouteParams(response.mergeResult) } as Href)
          : ('/' as Href),
      );
    },
  });
  const errorMessage =
    validationMessage ??
    (login.error ? getAuthSubmissionErrorMessage(login.error, authState.status === 'guest') : null);

  const submit = () => {
    const normalizedEmail = email.trim();
    if (!normalizedEmail || !password) {
      setValidationMessage('이메일과 비밀번호를 입력해 주세요.');
      return;
    }

    setValidationMessage(null);
    login.mutate();
  };

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
              T
            </AppText>
          </View>
          <AppText variant="label" weight="bold">
            ToDoLab
          </AppText>
        </View>
        <View style={styles.heroCopy}>
          <AppText accessibilityRole="header" variant="display" weight="heavy">
            오늘의 흐름을
            {'\n'}
            다시 이어가요
          </AppText>
          <AppText tone="secondary" variant="body">
            로그인하면 일정, 할 일, 완료 기록이 안전하게 동기화돼요.
          </AppText>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[
          styles.formCard,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        ]}
      >
        <View style={styles.fields}>
          <View style={styles.field}>
            <AppText variant="label" weight="bold">
              이메일
            </AppText>
            <TextInput
              accessibilityLabel="이메일"
              autoCapitalize="none"
              autoComplete="email"
              editable={!login.isPending}
              inputMode="email"
              onChangeText={setEmail}
              onSubmitEditing={() => passwordInputRef.current?.focus()}
              placeholder="you@example.com"
              placeholderTextColor={theme.colors.textMuted}
              returnKeyType="next"
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

          <View style={styles.field}>
            <AppText variant="label" weight="bold">
              비밀번호
            </AppText>
            <View
              style={[
                styles.passwordField,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <TextInput
                ref={passwordInputRef}
                accessibilityLabel="비밀번호"
                autoCapitalize="none"
                autoComplete="password"
                editable={!login.isPending}
                onChangeText={setPassword}
                onSubmitEditing={submit}
                placeholder="비밀번호"
                placeholderTextColor={theme.colors.textMuted}
                returnKeyType="done"
                secureTextEntry={!passwordVisible}
                style={[styles.passwordInput, { color: theme.colors.text }]}
                textContentType="password"
                value={password}
              />
              <Pressable
                accessibilityLabel={passwordVisible ? '비밀번호 숨기기' : '비밀번호 보기'}
                accessibilityRole="button"
                disabled={login.isPending}
                onPress={() => setPasswordVisible((visible) => !visible)}
                style={styles.passwordToggle}
              >
                <AppText tone="secondary" variant="caption" weight="bold">
                  {passwordVisible ? '숨김' : '보기'}
                </AppText>
              </Pressable>
            </View>
            <Pressable
              accessibilityRole="link"
              disabled={login.isPending}
              onPress={() => router.push('/password-reset' as Href)}
              style={styles.forgotPasswordLink}
            >
              <AppText tone="secondary" variant="caption" weight="bold">
                비밀번호를 잊으셨나요?
              </AppText>
            </Pressable>
          </View>
        </View>

        {params.registered === '1' ? (
          <InlineNotice
            tone="success"
            title="계정 생성 완료"
            message="이제 로그인하면 ToDoLab을 바로 사용할 수 있어요."
          />
        ) : null}
        {params.expired === '1' ? (
          <InlineNotice
            tone="warning"
            title="다시 로그인해 주세요"
            message="보안을 위해 이전 로그인 세션이 종료됐어요."
          />
        ) : null}
        {params.guestExpired === '1' ? (
          <InlineNotice
            tone="warning"
            title="게스트 사용 기간이 만료됐어요"
            message="기존 데이터를 보호하기 위해 새 게스트 계정을 자동으로 만들지 않았어요. 기존 계정이 있다면 로그인해 주세요."
          />
        ) : null}
        {errorMessage ? <InlineNotice tone="danger" message={errorMessage} /> : null}

        <Button fullWidth loading={login.isPending} onPress={submit} size="large">
          로그인하고 동기화하기
        </Button>
      </KeyboardAvoidingView>

      <View style={styles.secondaryAction}>
        <AppText tone="secondary" variant="label">
          처음 사용하시나요?
        </AppText>
        <Button
          disabled={login.isPending}
          onPress={() => router.push('/register' as Href)}
          variant="ghost"
        >
          계정 만들기
        </Button>
      </View>
      {authState.status === 'guest' ? (
        <View style={styles.secondaryAction}>
          <AppText tone="secondary" variant="label">
            지금 연결하지 않아도 작성한 내용은 유지돼요.
          </AppText>
          <Button
            disabled={login.isPending}
            onPress={() => router.replace('/' as Href)}
            variant="ghost"
          >
            게스트로 계속 사용
          </Button>
        </View>
      ) : null}
      {shouldShowFirstUseReturn(authState.status, params) ? (
        <Button onPress={() => router.navigate('/start' as Href)} variant="ghost">
          시작 화면으로 돌아가기
        </Button>
      ) : null}
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
  hero: {
    gap: spacing[5],
  },
  brandRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[2],
  },
  brandMark: {
    alignItems: 'center',
    borderRadius: radii.full,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  heroCopy: {
    gap: spacing[2],
  },
  formCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    gap: spacing[4],
    padding: spacing[4],
  },
  fields: {
    gap: spacing[4],
  },
  field: {
    gap: spacing[2],
  },
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
  forgotPasswordLink: {
    alignSelf: 'flex-end',
    minHeight: 32,
    justifyContent: 'center',
  },
  secondaryAction: {
    alignItems: 'center',
    gap: spacing[1],
  },
});
