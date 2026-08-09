import { getPendingFeatureTipIds } from '../contextual-feature-tip';

describe('contextual feature tip', () => {
  it('아직 확인하지 않은 안내만 반환한다', () => {
    expect(
      getPendingFeatureTipIds(
        {
          onboardingVersion: 1,
          completedFeatureTips: ['today.quickCapture'],
        },
        ['today.quickCapture', 'today.completeTask', 'calendar.overview'],
      ),
    ).toEqual(['today.completeTask', 'calendar.overview']);
  });

  it('모든 안내를 확인했으면 빈 목록을 반환한다', () => {
    expect(
      getPendingFeatureTipIds(
        {
          onboardingVersion: 1,
          completedFeatureTips: ['dday.linkedTasks'],
        },
        ['dday.linkedTasks'],
      ),
    ).toEqual([]);
  });
});
