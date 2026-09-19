# Today 하단 작성 진입·브랜드 크기 감사

- 기준 날짜: 2026-09-18
- 기준 commit: `86449d9` + 작업 트리 변경
- 환경: Expo Web, mock API, 신규 게스트, Chrome extension
- viewport: 390×844, 320×844
- 브라우저 선택: 내장 브라우저가 연결되지 않아 저장소 정책에 따라 Chrome extension 사용

## 목표

- 상단의 독립된 `오늘` 화면명을 제거한다.
- 일정·할 일·아이디어 작성 진입을 하단 tab 가까이 옮긴다.
- 앱 header와 drawer의 `dooit` wordmark를 더 분명하게 보이게 한다.

## 확인한 흐름

1. Today 상단에는 누를 수 없는 날짜만 남는다.
2. `무엇을 남길까요?`와 세 작성 진입은 하단 tab 바로 위에 고정된다.
3. 320px에서도 일정·할 일·아이디어 label이 모두 보인다.
4. 할 일 선택 시 같은 위치에서 기존 빠른 기록 composer로 전환된다.
5. drawer를 열었을 때 확대된 wordmark와 닫기 버튼, 첫 navigation 항목이 겹치지 않는다.

## 캡처

- `reference-before-390x844.jpg`: 이전 Today 구현
- `01-today-dock-390x844.jpg`: 하단 작성 진입 390px
- `02-today-dock-320x844.jpg`: 하단 작성 진입 320px
- `03-composer-320x844.jpg`: 빠른 기록 전환
- `04-drawer-390x844.jpg`: 확대된 drawer wordmark
- `05-comparison.png`: 변경 전·후 전체 비교

## 판정

- 작성 진입이 화면 하단에 있어 상단 배치보다 한 손 접근 거리가 짧다.
- scroll content의 하단 padding을 144px로 늘려 마지막 항목이 고정 영역에 가려지지 않게 했다.
- 앱 header wordmark는 `title`, drawer wordmark는 `display` scale을 사용한다.
- 기존 theme token과 `SymbolView`를 유지해 새로운 이미지 asset이나 임의 SVG가 없다.
- Chrome console error는 0개다. 기존 React Native Web `shadow*` deprecation warning만 확인됐다.

## 남은 검증

- Android/iOS 실제 키보드와 safe area
- TalkBack/VoiceOver, font scale 1.5, dark theme
- 항목이 많은 상태에서 마지막 row의 scroll 노출

final result: passed
