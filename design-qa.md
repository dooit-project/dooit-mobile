# 한 가지 실행하기 Design QA

**Source visual truth**

- [`docs/audits/today-focus-2026-09-01/reference-selected.png`](./docs/audits/today-focus-2026-09-01/reference-selected.png)
- Product Design 시각안 3개 중 사용자가 선택한 2번

**Implementation evidence**

- [`docs/audits/today-focus-2026-09-01/focus-active-final.png`](./docs/audits/today-focus-2026-09-01/focus-active-final.png)
- source pixels: 853×1856
- implementation pixels/CSS viewport: 390×844
- density normalization: source와 implementation을 같은 390×844 mobile composition 기준으로 비교
- state: Today Task `회의 자료 정리` 집중 중, light theme

## Full-view comparison

- 선택 시안처럼 기존 Today navigation과 목록을 숨긴 full-screen 집중 상태를 구현했다.
- 상단 dooit·close, 날짜·집중 제목, 중앙 Task, 하단 완료·상세·나가기 순서를 유지했다.
- 넓은 여백과 단일 primary action으로 dashboard가 아닌 조용한 실행 화면을 만든다.

## Focused region comparison

- Header: dooit identity와 44px close target을 확인했다.
- Center: 72px muted icon, 34px Task title과 보조 문구의 중앙 정렬을 확인했다.
- Actions: 60px primary button, 16px label, 두 개의 secondary action과 divider를 확인했다.

## Required fidelity surfaces

- Typography: 기존 AppText weight를 유지하되 집중 제목 24px, Task 34px로 선택 시안의 위계를 재현했다.
- Spacing/layout: intro, flexible center와 bottom actions의 세 영역으로 나눠 390×844에서 겹침이 없다.
- Colors/tokens: background, primary, primarySoft, border와 semantic text token만 사용한다.
- Image quality/assets: 별도 raster asset은 없으며 Expo 호환 Material Community icon과 native Symbol을 사용한다.
- Copy/content: 시안의 추상적 `한 가지 실행하기` 대신 실제 Task 제목을 hero로 사용했다. 집중 목적을 더 직접 전달하는 의도적 차이다.

## Comparison history

- 초기 P2: primary 완료 button이 48px와 13px label로 시안보다 약해 보였다.
- 수정: 선택적으로 label variant를 지정할 수 있게 하고 이 화면만 60px·16px로 강화했다.
- 초기 P2: 집중 제목과 Task 제목의 차이가 작았다.
- 수정: 집중 제목 24px, 실제 Task hero 34px로 위계를 분리했다.
- 사후 근거: 최종 390×844 implementation capture와 browser console error 0.

## Findings

- P3: close button은 기존 IconButton의 muted surface를 사용해 시안의 plain icon보다 배경이 조금 더 분명하다. keyboard focus와 touch affordance를 위해 유지한다.
- P3: source는 generic feature title을 중앙에 두지만 구현은 실제 Task 제목을 보여 준다. 제품 목적에 맞는 의도적 차이로 판정한다.

## Primary interactions tested

- Today Task에서 집중 진입
- 집중 모드 나가기
- Task 완료와 성공 state
- Task 상세 진입점 존재
- browser console errors checked

## Follow-up polish

- Native font scale 1.5에서 긴 Task 제목 3줄과 하단 actions를 확인한다.
- dark mode에서 hero icon과 primary button 대비를 실제 캡처한다.

final result: passed
