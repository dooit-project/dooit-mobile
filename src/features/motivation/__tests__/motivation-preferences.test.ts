import {
  normalizeMotivationPreferences,
  refreshMotivationPreferences,
} from '../motivation-preferences';

describe('header motivation rotation', () => {
  const now = new Date(2026, 9, 22, 10);

  it('replaces a previously stored long quote without losing the exposure preference', () => {
    const restored = normalizeMotivationPreferences({
      mode: 'daily',
      rotation: {
        lineId: 'keller-optimism',
        shownAt: now.getTime(),
        day: '2026-10-22',
        recentIds: ['keller-optimism'],
      },
    });

    const refreshed = refreshMotivationPreferences(restored, false, now);

    expect(refreshed.mode).toBe('daily');
    expect(refreshed.rotation?.lineId).toBeTruthy();
    expect(refreshed.rotation?.lineId).not.toBe('keller-optimism');
    expect(refreshed.rotation?.lineId).not.toBe('emerson-enthusiasm');
  });

  it('keeps hidden mode when a retired header quote was stored', () => {
    const restored = normalizeMotivationPreferences({
      mode: 'hidden',
      rotation: {
        lineId: 'emerson-enthusiasm',
        shownAt: now.getTime(),
        day: '2026-10-22',
        recentIds: ['emerson-enthusiasm'],
      },
    });

    expect(refreshMotivationPreferences(restored, false, now)).toEqual({
      mode: 'hidden',
      rotation: null,
    });
  });
});
