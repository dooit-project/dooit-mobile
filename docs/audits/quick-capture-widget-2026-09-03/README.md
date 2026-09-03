# iOS 빠른 기록 widget prototype 검토

Last updated: 2026-09-03

## 범위

- iOS `systemSmall` 홈 화면 widget 하나
- widget 전체 tap → `dooit://tasks/new?quickCapture=1`
- 새 할 일 composer의 제목 입력에 자동 focus
- light·dark·tinted rendering 대응 코드

## 선택한 방향

3개 시안 중 1번 텍스트 위계 중심 안을 선택했다.

![선택 시안](./reference-selected.png)

구현에서는 선택 시안의 `dooit` brand, `빠른 기록` heading, 짧은 안내, 큰 `+` 동작 순서를 유지했다. 실제 작은 widget에 맞게 배경 장식과 그림자를 제거하고 Dooit의 muted blue와 neutral text로 단순화했다.

## build 격리

- 기본·production·preview app config: `expo-widgets` plugin 제외
- `quick-capture-widget` EAS profile: `EXPO_PUBLIC_ENABLE_QUICK_CAPTURE_WIDGET=true`
- 전용 profile에서만 `QuickCaptureWidget`, `pj.dooit.ExpoWidgetsTarget`, `group.pj.dooit` 생성
- Android widget은 활성화하지 않음

## 검증 상태

- TypeScript typecheck: 통과
- iOS Expo bundle export: 통과
- 기본 app config의 widget plugin 제외: 통과
- 전용 prebuild config의 widget target·App Group: 통과
- `quickCapture=1` 파라미터 판별 test: 통과
- iOS simulator/device의 light·dark·tinted 실제 캡처: 미검증
- app 종료 상태 deep link → auth bootstrap → composer focus: 미검증

## 현재 제약

현재 개발 환경은 Xcode Command Line Tools만 선택되어 있고 `xcodebuild`·`simctl`을 사용할 수 없다. WidgetKit 홈 화면은 web browser로 대체 캡처할 수 없으므로, 시각 판정과 cold-start 동작 판정은 Xcode가 설치된 iOS simulator 또는 전용 EAS development build의 실기기 검증 후 완료한다.

최종 시각 판정은 저장소 루트 [`design-qa.md`](../../../design-qa.md)를 따른다.
