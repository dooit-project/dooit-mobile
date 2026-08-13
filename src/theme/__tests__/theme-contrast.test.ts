import { darkTheme, lightTheme } from '../theme';

function luminance(hex: string) {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)
    ?.map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) =>
      channel <= 0.04045 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4),
    );

  if (!channels) throw new Error(`올바르지 않은 색상 값: ${hex}`);

  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrastRatio(foreground: string, background: string) {
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

describe.each([
  ['light', lightTheme],
  ['dark', darkTheme],
] as const)('%s theme contrast', (_, theme) => {
  it.each(['textSecondary', 'textMuted'] as const)('%s가 surface에서 4.5:1 이상이다', (tone) => {
    expect(contrastRatio(theme.colors[tone], theme.colors.surface)).toBeGreaterThanOrEqual(4.5);
  });

  it('primary button text가 4.5:1 이상이다', () => {
    expect(contrastRatio(theme.colors.textOnPrimary, theme.colors.primary)).toBeGreaterThanOrEqual(
      4.5,
    );
  });

  it('secondary button text가 4.5:1 이상이다', () => {
    expect(contrastRatio(theme.colors.primary, theme.colors.primarySoft)).toBeGreaterThanOrEqual(
      4.5,
    );
  });

  it('기본 text가 muted surface에서 4.5:1 이상이다', () => {
    expect(contrastRatio(theme.colors.text, theme.colors.surfaceMuted)).toBeGreaterThanOrEqual(4.5);
  });

  it('기본 ink text가 paper background에서 4.5:1 이상이다', () => {
    expect(contrastRatio(theme.colors.text, theme.colors.background)).toBeGreaterThanOrEqual(4.5);
  });

  it.each([
    ['success', 'successSoft'],
    ['warning', 'warningSoft'],
    ['danger', 'dangerSoft'],
  ] as const)('%s text가 highlighter surface에서 4.5:1 이상이다', (tone, surface) => {
    expect(contrastRatio(theme.colors[tone], theme.colors[surface])).toBeGreaterThanOrEqual(4.5);
  });

  it('rule과 highlighter token이 theme에 정의되어 있다', () => {
    expect(theme.colors.rule).toBeTruthy();
    expect(theme.colors.highlightSage).toBeTruthy();
    expect(theme.colors.highlightAmber).toBeTruthy();
    expect(theme.colors.highlightBlue).toBeTruthy();
  });
});
