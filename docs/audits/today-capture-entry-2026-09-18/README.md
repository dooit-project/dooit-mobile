# Today 유형별 작성 진입 감사

- 기준 날짜: 2026-09-18
- 기준 commit: `affcee2c4cc4fb11879bd6de94bac12d727c95e6` + 작업 트리 변경
- 환경: Expo Web, mock API, 신규 게스트, Chrome extension
- viewport: 390×844, 320×844
- 브라우저 선택: 내장 브라우저가 연결되지 않아 저장소 정책에 따라 Chrome extension 사용

## 확인한 흐름

1. Today 첫 화면에서 날짜와 `오늘` 제목, 일정·할 일·아이디어 작성 진입이 보인다.
2. `일정`은 오늘 날짜가 선택된 `새 일정` 화면을 연다.
3. `할 일`은 기존 빠른 기록 composer를 연다.
4. `아이디어`는 아이디어 유형이 선택된 `새 아이디어` 화면을 연다.
5. 320px에서도 세 작성 진입의 라벨이 잘리지 않는다.

저장 동작은 실행하지 않았다. 추천 Task, 자동 우선순위와 새로운 실행 기능은 추가하지 않았다.

## 캡처

- `reference-selected.png`: 선택된 수정 시안
- `01-today-empty-390x844.jpg`: 빈 상태 390px
- `02-today-empty-320x844.jpg`: 빈 상태 320px
- `03-label-fit-320x844.jpg`: 라벨 수정 확인
- `04-comparison-full.png`: 시안과 390px 구현 전체 비교
- `05-comparison-header.png`: 상단 영역 집중 비교

## 판정

- 상단 위계, 타이포그래피, 색상과 유형별 진입 배치는 선택 시안과 같은 방향이다.
- 실제 빈 상태는 시안의 데이터가 있는 상태와 달라 목록 밀도를 직접 비교하지 않았다. 기존 EmptyState를 유지했다.
- 버튼은 기존 theme token과 `SymbolView`를 사용한다. 새 raster asset이나 임의 SVG는 없다.
- 320px에서 발견한 `아이디어` 라벨 잘림은 아이콘·간격·글자 크기 조정 후 해결했다.
- Chrome console error는 0개다. 기존 React Native Web `shadow*` deprecation warning만 확인됐다.

## 남은 검증

- Android/iOS 실제 기기, TalkBack/VoiceOver, font scale 1.5
- dark theme와 항목이 많은 상태
- 저장 성공·실패·복구 상태

final result: passed
