# 좌측 탐색 메뉴 Design QA

**Source visual truth**

- 현재 대화의 사용자 첨부 이미지 2장
- 선택: 1안의 `dooit / 나의 플래너` header + 2안의 단일 목록형 menu

**Implementation evidence**

- [`docs/audits/navigation-drawer-2026-08-31/implementation-open-final.png`](./docs/audits/navigation-drawer-2026-08-31/implementation-open-final.png)
- viewport/CSS size: 390×844
- source density: 첨부 이미지가 고밀도 raster이며 CSS density를 알 수 없어 구성·위계 기준으로 정규화
- implementation pixels: 390×844, browser viewport 390×844
- state: guest Today 위에서 drawer open, light theme

## Full-view comparison

- 1안의 작은 wordmark, 큰 `나의 플래너`, 우측 close 구조를 유지했다.
- 2안처럼 menu를 한 줄 목적지 목록으로 정리하고 계정 card와 section 제목은 제외했다.
- reference보다 작은 390px 실제 viewport에서도 설정까지 접근 가능하고, 넘치면 drawer 내부 scroll을 사용한다.

## Focused region comparison

- header: wordmark → title → close의 위계와 좌우 여백을 확인했다.
- menu rows: 60px touch row, 40px icon surface, 16px label, active tint를 확인했다.
- 별도 raster image asset은 없고 표준 Material Community icon과 text UI만 사용했다.

## Required fidelity surfaces

- Typography: 기존 AppText font·weight 체계를 유지하며 header는 title/display, row는 bodyLarge를 사용한다.
- Spacing/layout: 86% drawer, 최대 380px, 60px row와 section divider로 390px 구성에 맞췄다.
- Colors/tokens: 기존 surface, overlay, primarySoft, highlightBlue와 semantic text token만 사용한다.
- Image quality/assets: 별도 image asset 없음. icon font는 Expo SDK 56 호환 패키지를 사용한다.
- Copy/content: 사용자가 선택한 `dooit`, `나의 플래너`와 기존 IA의 목적지 이름을 유지한다.

## Comparison history

- 초기 P1: tab마다 custom header가 만들어져 접근성 opener가 2개로 노출됨.
- 수정: header를 Tabs navigator 밖의 공통 component 하나로 이동.
- 사후 근거: opener count 1, Calendar 이동 후 dialog 0, backdrop 닫기 후 dialog 0, console error 0.
- 초기 P2: 첫 group에도 divider가 적용되어 header 아래에 강한 선이 생김.
- 수정: divider를 두 번째 group부터 적용하고 row label을 bodyLarge로 조정.
- 사후 근거: 최종 구현 캡처에서 header와 첫 menu 사이의 불필요한 선이 제거됨.

## Findings

- P3: reference의 계정 count와 drawer 하단 고정 action은 현재 데이터 계약과 중복 navigation을 피하기 위해 의도적으로 제외했다.
- P3: reference보다 row density가 약간 높다. 390px 실제 화면에서 주요 목적지를 한 번에 훑는 목표를 우선했다.

## Primary interactions tested

- menu open
- Calendar navigation and automatic close
- backdrop close
- browser console errors checked

## Follow-up polish

- 기록함·오래 미룬 일 direct focus를 구현한 뒤 selected state를 각각 표시한다.
- 320px, font scale 1.5와 dark에서 row wrapping과 마지막 설정 접근성을 재검증한다.

final result: passed
