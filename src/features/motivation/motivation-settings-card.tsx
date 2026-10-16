import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { AppText, Button, Card, InlineNotice } from '@/components/ui';
import { spacing, useAppTheme } from '@/theme';

import { motivationalLines } from './motivational-lines';
import type { MotivationMode } from './motivation-preferences';
import { initializeMotivation, setMotivationMode } from './motivation-preferences-store';
import { useMotivationPreferences } from './use-motivation-preferences';

const modes: { value: MotivationMode; label: string; description: string }[] = [
  { value: 'standard', label: '기본', description: '새날이나 4시간 뒤 재방문할 때 바꿔요.' },
  { value: 'daily', label: '덜 보기', description: '자동 교체는 하루에 한 번만 해요.' },
  { value: 'hidden', label: '숨기기', description: '로고 옆 문구를 표시하지 않아요.' },
];

export function MotivationSettingsCard() {
  const preferences = useMotivationPreferences();
  return <ScopedMotivationSettingsCard key={preferences.scope ?? 'pending'} {...preferences} />;
}

function ScopedMotivationSettingsCard({
  scope,
  state,
  accountError,
}: ReturnType<typeof useMotivationPreferences>) {
  const theme = useAppTheme();
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [showSources, setShowSources] = useState(false);
  const [linkError, setLinkError] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const disabled = !scope || !state.ready || state.loadError || status === 'saving';

  const chooseMode = async (mode: MotivationMode) => {
    if (!scope || disabled || state.value.mode === mode) return;
    setStatus('saving');
    try {
      await setMotivationMode(scope, mode);
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  return (
    <Card variant="outlined" style={styles.section}>
      <AppText variant="bodyLarge" weight="bold">
        동기부여 문구
      </AppText>
      <AppText tone="secondary" variant="caption">
        로고 옆 문구의 자동 교체 빈도를 정해요. 이 기기의 현재 계정에 저장돼요.
      </AppText>
      {accountError ? (
        <InlineNotice message={accountError} tone="danger" />
      ) : !state.ready ? (
        <AppText tone="secondary">설정을 불러오고 있어요.</AppText>
      ) : state.loadError ? (
        <InlineNotice
          title="문구 설정을 불러오지 못했어요"
          message="잠시 후 다시 시도해 주세요."
          tone="danger"
          action={
            <Button
              size="compact"
              variant="ghost"
              loading={isReloading}
              onPress={() => {
                if (!scope) return;
                setIsReloading(true);
                void initializeMotivation(scope, true).finally(() => setIsReloading(false));
              }}
            >
              다시 시도
            </Button>
          }
        />
      ) : null}
      <View accessibilityRole="radiogroup" accessibilityLabel="동기부여 문구 노출 설정">
        {modes.map((mode) => (
          <Pressable
            key={mode.value}
            accessibilityRole="radio"
            accessibilityLabel={`${mode.label}, ${mode.description}`}
            accessibilityState={{
              checked: state.ready && !state.loadError && state.value.mode === mode.value,
              disabled,
            }}
            disabled={disabled}
            onPress={() => void chooseMode(mode.value)}
            style={({ pressed }) => [
              styles.option,
              {
                backgroundColor: pressed ? theme.colors.surfaceMuted : 'transparent',
                opacity: disabled ? 0.5 : 1,
              },
            ]}
          >
            <View style={styles.copy}>
              <AppText weight="semibold">{mode.label}</AppText>
              <AppText variant="caption" tone="secondary">
                {mode.description}
              </AppText>
            </View>
            <MaterialCommunityIcons
              name={
                state.ready && !state.loadError && state.value.mode === mode.value
                  ? 'radiobox-marked'
                  : 'radiobox-blank'
              }
              size={22}
              color={theme.colors.textSecondary}
            />
          </Pressable>
        ))}
      </View>
      {status === 'success' ? (
        <InlineNotice message="문구 설정을 저장했어요." tone="success" />
      ) : null}
      {status === 'error' ? (
        <InlineNotice
          message="설정을 저장하지 못했어요. 기존 설정을 유지했어요. 다시 선택해 주세요."
          tone="danger"
        />
      ) : null}
      {state.historySaveFailed ? (
        <InlineNotice
          message="최근 문구 이력을 저장하지 못했어요. 다음 문장을 볼 때 다시 저장해요."
          tone="warning"
        />
      ) : null}
      <AppText tone="secondary" variant="caption">
        보이는 문구를 누르면 직접 다른 문장을 볼 수도 있어요.
      </AppText>
      <Button
        size="compact"
        variant="ghost"
        accessibilityState={{ expanded: showSources }}
        onPress={() => setShowSources(!showSources)}
      >
        {showSources ? '명언과 출처 접기' : '명언과 출처 보기'}
      </Button>
      {showSources ? (
        <View style={styles.sources}>
          {motivationalLines.map((line) =>
            line.kind === 'quote' ? (
              <View key={line.id} style={styles.source}>
                <AppText>{line.text}</AppText>
                <AppText variant="caption" tone="secondary">
                  {line.author} · 한국어 의역
                </AppText>
                <AppText variant="caption" tone="secondary">
                  {line.source.title} · {line.source.locator}
                </AppText>
                <Button
                  size="compact"
                  variant="ghost"
                  accessibilityLabel={`${line.author} 명언의 원문 출처 열기`}
                  onPress={() => {
                    setLinkError(false);
                    void Linking.openURL(line.source.url).catch(() => setLinkError(true));
                  }}
                >
                  원문 출처 열기
                </Button>
              </View>
            ) : null,
          )}
          <AppText variant="caption" tone="secondary">
            그 밖의 문장은 dooit의 자체 문구예요. 실제 실천 기록을 평가하는 문장은 아니에요.
          </AppText>
          {linkError ? (
            <InlineNotice
              message="출처 페이지를 열지 못했어요. 다시 시도해 주세요."
              tone="danger"
            />
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing[3] },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    gap: spacing[3],
    paddingVertical: spacing[2],
  },
  copy: { flex: 1, minWidth: 0, gap: spacing[1] },
  sources: { gap: spacing[5] },
  source: { gap: spacing[2] },
});
