# ToDoLab Mobile Roadmap

Last updated: 2026-08-02

## 1. 문서 목적

이 문서는 ToDoLab 백엔드의 제품 방향, 서버 렌더링 화면, API를 기준으로 모바일 앱을 단계적으로 구현하기 위한 기준 문서다.

모바일은 백엔드 화면을 그대로 축소해서 옮기지 않는다. 핵심 개념과 정보 구조는 유지하되, 한 손 조작, 빠른 입력, 짧은 이동 경로, 네이티브 피드백을 우선한다.

각 단계는 사용자에게 의미 있는 하나의 변화가 되도록 작게 나누고, 수정 또는 코드 추가 한 단위를 원칙적으로 하나의 커밋으로 관리한다.

## 2. 제품 방향

ToDoLab은 할 일을 많이 저장하는 앱이 아니라, 사용자가 오늘 실제로 끝낼 일을 고르고 실행하도록 돕는 앱이다.

핵심 흐름은 다음과 같다.

```text
빠르게 기록
→ 오늘 할 일로 선별
→ 실행 가능한 순서로 정리
→ 완료
→ 완료 로그로 성취 확인
→ 미완료 항목 재판단
```

제품 원칙:

- 입력은 어느 주요 화면에서도 빠르게 시작할 수 있어야 한다.
- Today는 앱을 열었을 때 가장 먼저 만나는 중심 화면이다.
- 캘린더 일정과 실행할 TODO는 시각적으로 구분한다.
- 지난 미완료 항목은 자동으로 쌓지 않고 사용자가 다시 판단하게 한다.
- 완료 경험은 분명하되 과도한 게임화는 피한다.
- 중요한 행동은 한 손 엄지 범위 안에 배치하고 터치 영역은 최소 44pt를 유지한다.
- 로딩, 오류, 빈 상태, 오프라인 상태도 정상 흐름의 일부로 설계한다.
- Android, iOS, Web에서 핵심 기능은 같게 유지하고 플랫폼 관습이 다른 부분만 분기한다.

## 3. 참고 제품에서 채택할 패턴

기능을 그대로 복제하지 않고 ToDoLab의 흐름에 맞는 패턴만 채택한다.

| 참고 제품       | 참고할 패턴                                              | ToDoLab 적용 방향                                             |
| --------------- | -------------------------------------------------------- | ------------------------------------------------------------- |
| Todoist         | 목록 중심 Today, 빠른 추가, 모바일 추가 버튼             | 큰 상시 입력 카드 대신 하단 추가 버튼과 가벼운 composer 사용  |
| Microsoft To Do | My Day와 추천을 통한 하루 단위 선별                      | 기록함과 추천에서 Today로 직접 추가                           |
| Things          | Today 중심 실행 순서, 일정과 할 일 분리, Inbox와 Logbook | Today에서 일정/실행/완료를 구획하고 기록함과 완료 로그 제공   |
| TickTick        | Today smart list, 추천 진입점, 목록과 캘린더 결합        | 추천은 기본 목록 밖 진입점으로 줄이고 날짜별 Task 탐색에 집중 |
| MyTurn          | 오늘 행동을 한 화면에 모으고 한 단계씩 완료하는 경험     | 게임화 외형은 복제하지 않고 현재 행동과 가벼운 진행감만 참고  |

공식 참고 자료:

- [Todoist Quick Add](https://www.todoist.com/help/articles/use-task-quick-add-in-todoist-va4Lhpzz)
- [Todoist Dynamic Add Button](https://www.todoist.com/en/help/articles/use-the-dynamic-add-button-in-todoist-ysybl2M1)
- [Microsoft To Do My Day and Suggestions](https://support.microsoft.com/en-us/todo/my-day-and-suggestions)
- [Things Today, Upcoming, Inbox, Logbook](https://culturedcode.com/things/support/articles/4001304/)
- [TickTick Smart Lists](https://help.ticktick.com/articles/7055782283059396608)
- [TickTick List Calendar View](https://help.ticktick.com/articles/7055782110086299648)
- [MyTurn 공식 소개](https://myturn.kr/)

### Today 목표 구조

Today는 설명보다 실행 목록이 먼저 보이는 화면이어야 한다. 참고 제품에서 채택할 핵심은 다음 세 가지다.

- Todoist처럼 바로 추가하고 바로 완료할 수 있는 목록 중심 구조
- TickTick처럼 추천과 미완료 정리는 별도 진입점으로 낮추는 smart list 구조
- MyTurn처럼 “지금 할 하나”를 고르기 쉬운 낮은 인지 부하

목표 정보 순서:

```text
compact top bar: Today · 날짜 · 보조 메뉴
→ 일정이 있을 때만 일정 요약
→ 오늘 실행 Task
→ 미완료·추천 compact entry
→ 접힌 완료 목록
→ 하단 고정 추가 버튼 또는 필요할 때 펼치는 composer
```

우선순위:

1. 오늘의 시간 제약을 보여 주는 일정
2. 오늘 실행 Task와 완료
3. 하단 빠른 추가
4. 지난 미완료 재판단
5. 추천, 기록함, 완료 기록

첫 화면의 성공 기준은 “앱을 열자마자 오늘 할 일을 보고 바로 완료하거나 추가할 수 있는가”다.

## 4. 백엔드 기준 현재 계약과 연동 상태

모바일은 현재 다음 백엔드 기능과 계약을 기준으로 동작한다.

- 할 일 생성, 단건 조회, 수정, 삭제
- Today, 지난 미완료, 완료, 기록함 조회
- 주간 및 월간 범위 조회
- Today 추천
- Today 이동, 기록함 이동, 완료, 완료 취소, 이월
- 미룬 이유 저장 및 해제
- D-Day 목표 생성, 목록, 삭제, 연결된 할 일 조회
- 할 일과 D-Day 연결 및 해제
- 카테고리별 그룹 조회
- Task·일정·완료 기록 통합 검색

공통 응답 형태:

```ts
type ApiResponse<T> = {
  status: 'success' | 'fail';
  data?: T;
  error?: {
    code: number;
    message: string;
  };
  timestamp: string;
};
```

최신 real API smoke test 결과는 [`SMOKE_TEST_LOG.md`](../qa/SMOKE_TEST_LOG.md)에 최신 기준선만 유지한다.

백엔드 최신 원본 계약은 `todolab-backend`의 다음 문서를 기준으로 대조한다.

- [`API_V1_FRONTEND.md`](../../../backend/docs/api/API_V1_FRONTEND.md): 모바일 v1 API endpoint와 응답 envelope
- [`ENVIRONMENT_INTEGRATION.md`](../../../backend/docs/ops/ENVIRONMENT_INTEGRATION.md): local, staging, production API URL과 CORS origin
- [`AUTH_CONTRACT.md`](../../../backend/docs/api/AUTH_CONTRACT.md): JWT access token, 401/403, refresh token 미도입 정책
- [`API_ERROR_CODES.md`](../../../backend/docs/api/API_ERROR_CODES.md): 오류 코드, retry 가능 여부, 안전한 사용자 문구
- [`RECURRENCE_MODEL.md`](../../../backend/docs/api/RECURRENCE_MODEL.md): 반복 series/occurrence 저장 모델과 현재 API 상태
- [`NOTIFICATION_CONTRACT.md`](../../../backend/docs/api/NOTIFICATION_CONTRACT.md): 로컬 알림과 향후 server push 책임 분리
- [`TIMEZONE_CONTRACT.md`](../../../backend/docs/api/TIMEZONE_CONTRACT.md): `Asia/Seoul` 기준과 사용자 timezone 도입 조건
- [`DATA_MODEL_GLOSSARY.md`](../../../backend/docs/api/DATA_MODEL_GLOSSARY.md): Task 상태, 날짜 필드, owner scope 의미
- [`MOBILE_INTEGRATION_RUNBOOK.md`](../../../backend/docs/mobile/MOBILE_INTEGRATION_RUNBOOK.md): 백엔드 기준 real-mode smoke test 절차
- [`MOBILE_API_BACKEND_STATUS.md`](../../../backend/docs/mobile/MOBILE_API_BACKEND_STATUS.md): 모바일 요구 항목의 백엔드 구현/확인 상태

현재 통과 기준:

- Auth, Task, Today, Done, Schedule, Search, D-Day, Stale 주요 API smoke test 통과
- Today와 Calendar의 여러 날 일정 포함 범위, Calendar 원본 ID 1회 반환 확인
- Search의 검색어, 상태 filter, 종류 filter, cursor pagination, 빈 결과 확인
- D-Day 목표 생성, 조회, 연결, 해제, 삭제 응답 확인
- 401 세션 만료, network/timeout/5xx retry, Calendar/Search 조회 전환 중 기존 데이터 유지 기준 반영
- 서비스 기준 시간대 `Asia/Seoul` 계약 확인

백엔드에서 계속 확인하거나 보완할 항목:

- staging, production API URL 확정
- 네트워크 재시도와 중복 생성 방지를 위한 idempotency 또는 client request id 정책
- 반복 Task·일정은 생성, occurrence 조회, 완료, 미룸, 건너뛰기, 알림 후보 제외까지 real smoke가 통과했다. 이후 회귀는 `npm run smoke:recurrence:real`과 `npm run smoke:recurrence-actions:real`로 확인한다.
- 로컬 알림은 백엔드 [`NOTIFICATION_CONTRACT.md`](../../../backend/docs/api/NOTIFICATION_CONTRACT.md)에 따라 가까운 미래 occurrence만 모바일에서 best-effort로 예약
- real API 화면 smoke에서 검색 cursor 정렬, 기간 filter, timezone 경계는 계속 회귀 확인

백엔드 연동을 다시 진행할 때는 [`BACKEND_INTEGRATION_RUNBOOK.md`](../integration/BACKEND_INTEGRATION_RUNBOOK.md)를 기준으로 mock 검증 → real API 검증 → smoke log 기록 순서로 진행한다. 이 저장소에는 필요한 계약과 모바일 변경만 문서화하고 백엔드 코드는 추가하지 않는다.

## 5. 모바일 정보 구조

하단 탭은 모바일의 실제 사용 빈도를 기준으로 `오늘`, `달력`, `프로필` 세 개로 구성한다. 날짜 없는 기록은 Today의 `정리할 항목`에서 처리한다.

### Today

- 오늘 날짜와 짧은 인사
- 빠른 추가
- 지난 미완료 정리
- 오늘의 추천
- 캘린더 일정
- 오늘 실행할 일
- 완료한 일

정보가 많아질 수 있으므로 모든 섹션을 한꺼번에 강조하지 않는다. 지난 미완료와 추천은 요약 카드에서 펼치고, 오늘 실행할 일을 가장 강하게 보여준다.

### Calendar

- 주간/월간 전환
- 오늘로 돌아가기
- 선택 날짜의 일정과 할 일
- 일정, 완료, 미룸, D-Day 표시
- 빠른 날짜 변경

작은 화면에서는 월간 칸 안에 제목을 억지로 넣지 않고 상태 점과 개수만 보여준 뒤 선택 날짜의 목록을 아래에 표시한다.

### D-Day

- 목표 목록과 남은 날짜
- 목표 추가 및 삭제
- 연결된 Today 할 일
- 목표에서 바로 오늘 할 일 만들기

### Profile

- 로그인 상태와 사용자 정보
- 검색과 과거 기록 확인
- 완료 로그
- D-Day와 설정
- 앱 정보와 개발/진단 정보

### 전역 흐름

- 하단 추가 버튼: 어느 탭에서든 새 항목 작성
- Task 상세: 전체 화면 또는 바텀시트
- 날짜/시간 선택: 네이티브 선택기 우선
- 성공 피드백: 가벼운 햅틱과 토스트
- 파괴적 행동: 삭제 확인과 실행 취소 가능 여부 검토

## 6. UI/UX 방향

백엔드의 기능 구조는 유지하되 모바일은 네이버 모바일 앱처럼 사용자가 매일 열어도 피로하지 않은 가볍고 단정한 화면을 지향한다. 특정 서비스를 그대로 복제하지 않고, 한국 사용자가 익숙하게 느끼는 정보 밀도, 검색/탐색 진입점, 카드 간 간격, 읽기 쉬운 한글 위계를 ToDoLab의 실행 흐름에 맞게 적용한다.

색상 토큰, 타이포그래피, 간격, 컴포넌트와 상호작용의 상세 규칙은 [DESIGN.md](../design/DESIGN.md)에서 관리한다. 이 절은 제품 로드맵에 영향을 주는 상위 방향만 요약한다.

### 시각 체계

- 배경: 따뜻한 off-white 또는 아주 옅은 회색을 기본으로 하고, surface는 흰색 또는 미세한 tint만 사용한다.
- 주색: 네이버식 초록을 그대로 쓰기보다 ToDoLab의 일정/실행 맥락에 맞는 차분한 blue-green 계열을 검토한다.
- 보조색: 일정, 오늘 할 일, 완료, D-Day를 파스텔톤으로 구분하되 배경과 충분한 대비를 유지한다.
- 카드: 약한 테두리 또는 그림자 중 하나만 사용해 시각적 소음을 줄이고, 카드 내부 모서리의 흰색 끼임이 보이지 않게 배경과 radius를 정리한다.
- 모서리: 카드 14~18, 입력/버튼 12~16 수준의 일관된 radius
- 타이포그래피: 제목, 본문, 보조 정보의 3단계 위계를 명확히 유지하되 한글 본문은 과하게 크지 않게 한다.
- 상단 제목: Today, Calendar, Profile 모두 같은 방식으로 페이지 정체성을 보여 주거나 모두 제거한다. Today만 제목이 없는 상태를 만들지 않는다.
- 다크 모드: 초기 토큰부터 고려하고 핵심 기능 완료 후 정식 지원

### 네이버 모바일 앱에서 참고할 UX 감각

- 홈에서 너무 많은 설명을 밀어 넣기보다 사용자가 바로 행동할 수 있는 핵심 entry를 먼저 보여 준다.
- 검색, 프로필, 설정처럼 익숙한 전역 행동은 위치와 역할을 예측 가능하게 유지한다.
- 카드와 list item은 충분히 분리하되 과한 그림자, 진한 테두리, 큰 장식 색을 피한다.
- 한 화면의 글자 크기와 굵기를 많이 섞지 않고, 제목/본문/메타 정보의 리듬을 안정적으로 유지한다.
- 한국어 label은 짧고 직관적으로 쓴다. 예: `생각난 할 일 기록`처럼 긴 placeholder는 `할 일 입력`, `빠른 기록` 등으로 줄인다.

ToDoLab 적용 방향:

- Today는 미니 달력, 일정, 오늘 할 일, 완료 목록의 위계를 분명히 하되 첫 viewport에서 실제 할 일을 바로 볼 수 있게 한다.
- Calendar는 3주 planner grid의 칸, 세로/가로 구분선, 일정 bar가 일 단위 구간 안에 정확히 정렬되도록 우선 정리한다.
- Profile은 설정/기록/검색 진입점이 서비스 홈의 shortcut처럼 보이게 card spacing과 icon treatment를 통일한다.
- 정리할 항목 화면은 버튼 나열보다 `지난 미완료`, `추천`, `기록함`을 각각 명확한 list/card section으로 정리한다.

### 조작 원칙

- 주요 CTA는 화면 하단에 가깝게 배치한다.
- 완료 체크는 카드 전체 탐색과 충돌하지 않게 분리한다.
- 카드의 보조 액션은 스와이프보다 명시적 메뉴를 기본으로 하고, 스와이프는 보조 수단으로 검토한다.
- Today 정렬은 긴 누르기 드래그를 우선하고 VoiceOver·TalkBack custom action과 Web keyboard 동선을 제공하되, 위/아래 버튼을 카드에 노출하지 않는다.
- 키보드가 열린 상태에서도 저장 버튼과 입력 내용이 가려지지 않게 한다.
- 긴 제목, 큰 글꼴, VoiceOver/TalkBack을 기본 검증 항목에 포함한다.

### 화면 상태

모든 데이터 화면은 다음 상태를 구현해야 완료로 본다.

- 초기 로딩 skeleton
- 당겨서 새로고침
- 빈 상태와 다음 행동 CTA
- 인라인 오류와 재시도
- 변경 중 중복 입력 방지
- 성공 피드백
- 연결 끊김 또는 타임아웃 안내

## 7. 구현 로드맵

완료된 세부 구현 체크리스트는 git history와 개별 문서에 남긴다. 이 섹션은 앞으로 관리해야 할 작업과 완료 기준만 유지한다.

### 현재 기준선

- Expo, React Native, TypeScript 기반 앱 구조와 공통 API client가 구성되어 있다.
- `EXPO_PUBLIC_API_MODE=mock | real`로 로컬 UI 개발과 실제 백엔드 연동을 분리하고, 임시 real smoke는 `EXPO_PUBLIC_API_MODE_OVERRIDE` / `EXPO_PUBLIC_API_URL_OVERRIDE`로 `.env.local`보다 우선 적용한다.
- Today, Calendar, Profile 3탭 구조를 기준으로 한다.
- Today는 주간 strip, 일정, 오늘 할 일, 정리할 항목, 접힌 완료 목록을 중심으로 구성한다.
- Calendar는 선택일 기준 3주 planner grid와 일정 bar 중심으로 구성한다.
- 인증, Task, 일정, D-Day, 검색 mock/real 주요 흐름은 모바일 계약 기준으로 동작한다.
- real API smoke test는 [`SMOKE_TEST_LOG.md`](../qa/SMOKE_TEST_LOG.md)에 기록하고, 반복 실행 기준은 [`BACKEND_INTEGRATION_RUNBOOK.md`](../integration/BACKEND_INTEGRATION_RUNBOOK.md)를 따른다.

### A. 네이버 모바일 앱 수준의 UI/UX 마감

목표: 기능은 이미 어느 정도 연결되었으므로, 이제 매일 열어도 부담 없는 가볍고 단정한 모바일 앱으로 다듬는다.

- [x] [`UX_REVIEW_LOG.md`](../design/UX_REVIEW_LOG.md)를 만들고 현재 화면별 결정과 다음 검토 항목을 기록한다.
- [x] Today 미니 달력은 외부 card를 제거하고 grid 자체의 얇은 경계, 내부 세로선, 조용한 일정 label로 정리한다.
- [x] 일정, 오늘 할 일, 오늘 완료한 일 section 색을 파스텔톤으로 유지하되 배경과 대비를 다시 맞춘다.
- [x] 빠른 입력 placeholder와 input inset을 더 짧고 자연스럽게 정리한다.
- [x] Profile shortcut card의 좌우 간격, radius, icon treatment를 Today Task row와 같은 문법으로 맞춘다.
- [x] 정리할 항목 화면의 버튼 중심 UI를 section/list 중심 UI로 계속 다듬는다.
- [x] 탭 루트의 중복 page title을 제거하고 첫 콘텐츠 노출을 앞당긴다.
- [x] light theme을 흰 배경과 쿨그레이 border 중심으로 조정한다.
- [x] Section marker 원형 badge를 제거하고 제목·count·카드 간격 중심으로 정리한다.
- [x] Calendar grid를 선택일 기준 이전 1주, 현재 주, 다음 1주의 3주 범위로 정리한다.
- [x] Calendar header를 큰 월 제목과 양옆 작은 chevron으로 정리하고, 선택 날짜 목록의 중복 날짜 제목을 제거한다.
- [x] Today 미니 달력 높이와 날짜 cell 밀도를 줄인다.
- [x] Calendar와 Today의 일정 label 시각적 무게를 낮추고, Calendar 하단 filter chip은 기본 노출하지 않게 정리한다.
- [x] Calendar 좌우 이동을 선택 날짜 기준 1주 이동으로 바꾸고, 월 제목에서 같은 폭의 월 선택 panel을 열 수 있게 한다.
- [x] 하단 탭 active 상태가 선명한 blue로 보이게 조정한다.
- [x] Calendar 월 선택 panel의 버튼 높이와 간격을 줄여 달력과 목록을 덜 밀게 한다.
- [x] Calendar 좁은 날짜 cell의 하루 일정 label은 시간만이 아니라 제목을 가능한 만큼 보여 주고, 시간은 예정 목록과 접근성 label에서 보완한다.
- [x] Search 화면은 기본 필터와 상세 필터를 분리해 첫 화면 밀도를 낮춘다.
- [x] Completed 화면은 완료 Task를 compact card로 맞추고 중복 `다시 열기` 버튼을 줄인다.
- [x] D-Day 목표 메뉴는 작은 화면에서 읽기 쉬운 세로 액션으로 정리한다.
- [x] Calendar 3주 grid는 compact 폭과 짧은 화면에서 주 높이와 label lane을 줄인다.
- [x] mock Web 320px, 375px, 430px, 720px에서 Today와 Calendar horizontal overflow와 첫 viewport 노출을 실제 화면으로 확인했다.
- [x] Today 미니 달력의 하루 일정 label도 Calendar와 동일하게 시간 badge가 아니라 제목 중심 pill로 표시한다.
- [x] 빠른 기록 composer를 하단 tab과 분리된 bottom sheet형 입력 surface로 정리한다.
- [x] Calendar grid의 테두리와 내부 rule 대비를 낮추고 선택 날짜 중심으로 시선을 정리한다.
- [x] 정리할 항목 section별 성격 차이를 낮은 강조의 tint, icon, copy로 보강한다.
- [x] 하단 tab과 shortcut icon의 Web glyph 중복 노출 흔적을 점검하고 필요하면 정리한다.
- [x] Product Design audit 기준 Calendar 일정 bar의 최소 크기, 텍스트 생략, column overflow, touch target을 다시 마감한다.
- [x] Today section별 카드·border 무게를 낮추고 일정/오늘 할 일/정리할 항목/완료의 역할 차이를 더 명확히 만든다.
- [x] Quick Capture 열린 상태의 기본 파란 focus border를 앱 primary soft border와 bottom sheet형 composer visual로 교체한다.
- [x] Product Design audit 기준 Today 접힌 Quick Capture FAB가 완료 section과 겹치지 않도록 icon-only 54px FAB로 줄인다.
- [x] 하단 tab active icon·label의 선택 상태와 실제 스크린샷을 갱신해 Today/Calendar/Profile의 현재 위치가 분명히 보이는지 확인한다.
- [x] Profile 상단 로그인 card와 shortcut row를 “나의 플래너 공간”처럼 보이도록 여백, 동기화 상태 copy, icon 리듬을 다듬는다.
- [x] 320px, 짧은 viewport, font scale 1.5에서는 Today와 Calendar 달력이 dense grid로 전환되도록 공통 responsive 기준을 추가했다.
- [ ] iOS/Android font scale 1.5, safe area, light/dark에서 Today와 Calendar가 깨지지 않는지 실제 기기 또는 simulator로 확인한다.

완료 기준:

- 첫 viewport에서 사용자가 오늘의 일정 또는 오늘 할 일을 바로 볼 수 있다.
- 같은 역할의 row, card, button이 화면마다 다르게 보이지 않는다.
- 색상은 예쁘지만 의미와 대비를 해치지 않는다.

### B. 백엔드 real API 연동 안정화

목표: mock에서 예쁜 화면이 아니라 실제 데이터로 매일 사용할 수 있는 상태를 만든다.

- [x] 검색 API의 키워드, 상태 filter, 종류 filter, 빈 상태, cursor pagination을 real API로 smoke test하고 [`SMOKE_TEST_LOG.md`](../qa/SMOKE_TEST_LOG.md)에 기록했다. 기간 filter와 timezone은 실제 화면 회귀에서 계속 확인한다.
- [x] Today와 Calendar의 여러 날 일정 겹침 기준, 원본 일정 ID, 월간 범위 조회 응답을 실제 데이터로 재검증했다. 2026-07-28 real API smoke에서 2026-07-28–2026-07-30 기간 일정이 해당 날짜 Today에만 포함되고 Calendar 월간 조회에는 원본 ID 1회로 반환됨을 확인했다.
- [x] D-Day 삭제 성공 응답 형식은 백엔드 v1 기준 `data: null`로 확정했고, 모바일 타입도 `null` 기준으로 맞췄다.
- [x] 반복 Task·일정은 백엔드 저장 모델과 occurrence 조회 계약을 정리했고, real smoke 통과 계약 안에서 실제 저장 UI를 제공하는 기준을 확정했다.
- [x] 401 응답 시 access token을 삭제하고 로그인 화면으로 이동해 세션 만료 안내를 표시한다. refresh token 흐름은 현재 백엔드 계약상 미도입으로 유지한다.
- [x] access token 없이 받은 401은 첫 설치/첫 진입 세션 만료 안내로 처리하지 않고, 기존 token이 있었던 401에서만 세션 만료 안내를 표시한다.
- [x] 계정 만들기 화면은 로그인 화면과 같은 brand/headline/form card 구조로 정리하고, 직접 진입 상태에서도 `/login`으로 돌아가도록 했다.
- [x] 이메일/비밀번호 기반 실사용을 위해 비밀번호 찾기/재설정 API 계약과 모바일 화면 진입을 추가했다. 실제 메일 발송/토큰 검증/새 비밀번호 저장은 백엔드 API 준비 후 연결한다.
- [x] network, timeout, 5xx 오류는 Query retry 정책으로 최대 2회 재시도하고, Calendar/Search 조회 전환은 기존 데이터를 유지한다. real API 화면 smoke는 위 항목에서 별도 확인한다.
- [x] `.env.local` mock 기본값과 real smoke 실행값이 섞이지 않도록 `EXPO_PUBLIC_API_MODE_OVERRIDE` / `EXPO_PUBLIC_API_URL_OVERRIDE`와 `npm run web:real`을 추가한다.
- [x] 반복 일정 real smoke를 2026-08-01 재실행했고, 백엔드 수정 후 Today/Calendar occurrence materialize 조회와 cleanup까지 통과했다.

완료 기준:

- `EXPO_PUBLIC_API_MODE=real`에서 Auth, Today, Calendar, D-Day, Search 주요 흐름이 smoke test를 통과한다.
- 모바일에서 발견한 API 이슈는 백엔드 저장소와 문서에 분리해 추적한다.

#### B1. 비회원 게스트 계정과 정식 계정 연동

목표: 처음 앱을 연 사용자가 로그인 없이 바로 Task와 일정을 만들고, 이후 로그인하거나 회원가입해도 게스트 데이터를 잃지 않고 정식 계정에 연결한다.

백엔드와 확정한 게스트 인증·병합 계약을 기준으로 연동한다. IP 주소나 OS 단말 식별자를 사용자 ID로 사용하지 않고, 서버가 생성한 게스트 사용자와 서명된 access token을 인증 주체로 사용한다.

- [x] 게스트 계정의 보존 기간, 기능 제한, 앱 삭제 시 복구 불가 안내, 기존 계정 로그인 시 데이터 병합 정책을 확정한다. 아래 제품 정책을 모바일과 백엔드의 공통 기준으로 사용한다.
- [x] 백엔드에 게스트 사용자 생성 API와 `GUEST | REGISTERED` 계정 유형을 요청하고 원본 API 계약 문서에 반영한다. 백엔드 `AUTH_CONTRACT.md`와 `API_V1_FRONTEND.md`의 `POST /api/v1/auth/guest`, `accountType`, 게스트 token TTL 계약을 확인했다.
- [ ] 게스트 access token 만료 전에 같은 guest user id를 유지해 token을 갱신하거나 재발급하는 백엔드 계약을 확정한다. 만료 시 `POST /auth/guest`로 새 사용자를 만드는 방식은 기존 게스트 데이터에 접근할 수 없게 되므로 복구 방식으로 사용하지 않는다.
- [ ] 기존 계정 로그인은 유효한 게스트 token을 함께 받아 Task, 일정, 완료 기록, 반복 occurrence, D-Day 관계를 하나의 트랜잭션으로 병합하도록 요청한다.
- [ ] 게스트 상태의 신규 회원가입은 같은 user id를 정식 계정으로 승격하고, 기존 이메일 계정과의 충돌 및 실패 rollback 정책을 확정한다. 모바일과 mock API는 승격 `TokenResponse`를 받으면 추가 로그인 없이 정식 token·cache로 전환하고 연결 완료 안내를 표시하도록 준비했다. 실제 rollback은 백엔드 검증 후 완료한다.
- [ ] 병합 API 재시도 시 중복 이전이 발생하지 않도록 멱등성과 동시 요청 잠금 정책을 백엔드와 검증한다.
- [x] 모바일 인증 bootstrap을 `저장 token 복원 → /auth/me 확인` 또는 `token 없음 → 게스트 생성` 흐름으로 변경하고, bootstrap 완료 전 사용자 데이터 query를 막는다. 백엔드 `POST /api/v1/auth/guest` 계약과 mock API를 함께 반영했다.
- [x] 모바일 인증 상태를 `bootstrapping | guest | registered | error`로 구분하고 `/auth/me`와 token 응답에 `accountType`을 반영한다. 프로필은 게스트 token을 정식 로그인으로 오인하지 않고 별도 상태와 복구 제한을 표시한다.
- [ ] 로그인·회원가입 성공 후 정식 token으로 교체하기 전에 서버 병합 성공을 확인하고, 성공 시 사용자 범위 Query cache를 초기화해 다시 조회한다. 모바일 로그인은 성공 응답 이후에만 정식 token과 인증 cache를 교체하며, 실패 시 기존 게스트 token을 유지하도록 테스트를 추가했다. 회원가입 승격은 백엔드 계약 이후 반영한다.
- [ ] 게스트 생성 또는 병합 실패 시 기존 게스트 token과 데이터를 유지하고 사용자가 재시도할 수 있는 오류 UI를 제공한다. 게스트 생성과 저장 token 확인 실패는 데이터 화면을 열지 않고 앱 시작 단계에서 재시도하도록 구현했으며, 병합 실패 처리는 백엔드 계약 이후 추가한다.
- [x] 프로필에 `게스트로 사용 중`, 로그인 유도, 앱 삭제 시 복구 제한을 안내하고 게스트 로그인·회원가입 성공 후 Today에 데이터 연결 완료 결과를 보여준다. 실제 병합 정확성은 real API smoke에서 별도로 검증한다.
- [x] 정식 회원 로그아웃 후에는 새 게스트 계정을 생성하고 이전 게스트 계정으로 돌아가지 않는 정책을 적용한다. 로그아웃 성공 직후 새 게스트 token과 인증 cache로 교체하며, 발급 실패 시 정식 사용자 cache를 제거하고 재로그인 안내를 표시한다.
- [x] mock API에 게스트 발급, 게스트 `/auth/me`, 같은 user id를 유지하는 회원가입 승격, 기존 계정 로그인 후 mock 데이터 유지 동작을 추가한다. Web 새로고침에서도 저장된 mock guest token의 account type과 user id를 복원한다.
- [ ] 최초 실행, 앱 재실행, token 만료, 신규 회원가입 승격, 기존 계정 병합, 병합 재시도, 앱 삭제 후 재설치 시나리오를 Android, iOS, Web에서 검증한다. 단위 테스트에서는 저장된 게스트 token으로 같은 사용자를 복원하고, 저장 token 확인 실패 시 새 게스트를 만들지 않는 데이터 보존 기준을 확인한다.
- [ ] 게스트 생성·병합 real API smoke test를 추가하고 데이터 소유권, 관계 무결성, 중복 미발생 결과를 [`SMOKE_TEST_LOG.md`](../qa/SMOKE_TEST_LOG.md)에 기록한다. 게스트 발급과 동일 user id의 `/auth/me` 계약을 token 출력 없이 확인하는 `npm run smoke:guest:real`을 추가했으며, 실제 병합 검증은 백엔드 구현 이후 확장한다.

확정 제품 정책:

- 게스트는 로그인 회원과 동일하게 Task, 일정, 완료 기록, 반복 일정, D-Day, 검색을 사용할 수 있다. 이메일 인증, 비밀번호 변경, 여러 기기 동기화처럼 정식 계정이 필요한 기능만 제한한다.
- 현재 백엔드 계약의 게스트 token TTL은 31일이다. 같은 guest user id를 유지하는 갱신 계약이 준비되기 전에는 새 게스트 발급을 기존 계정 복구로 사용하지 않는다.
- 앱 삭제, 앱 데이터 초기화 또는 보안 저장소 유실 시 게스트 계정은 복구할 수 없다. 프로필에서 로그인 전 데이터의 복구 제한을 안내한다.
- 신규 회원가입은 게스트 user id를 유지한 채 `REGISTERED`로 승격한다.
- 기존 계정 로그인은 게스트의 모든 사용자 생성 데이터를 대상 계정에 추가하고, 제목이나 날짜가 같다는 이유로 자동 중복 제거하지 않는다.
- 기존 정식 계정의 계정 설정을 우선하며 게스트 설정은 정식 설정을 덮어쓰지 않는다. Task와 D-Day 관계, 반복 series와 occurrence, 완료 이력은 참조 무결성을 유지해 함께 이전한다.
- 병합은 정확히 한 번만 적용하며 실패 시 전체 rollback하고 기존 게스트 token과 데이터 접근을 유지한다.
- 정식 회원 로그아웃은 이전 게스트로 돌아가지 않고 새로운 게스트 계정을 시작한다.

완료 기준:

- 첫 설치 사용자는 별도 로그인 없이 서버 데이터 기능을 사용할 수 있다.
- 로그인 또는 회원가입 전 작성한 데이터가 정식 계정에 정확히 한 번 연결된다.
- 병합 실패나 네트워크 중단 시 게스트 인증과 데이터가 유실되지 않는다.
- 임의 guest id, IP 주소, 광고 ID, 하드웨어 식별자만으로 사용자 데이터에 접근할 수 없다.

### C. 반복 Task와 일정

목표: 매주 화요일 09:00 회의처럼 반복되는 실행 항목과 일정을 occurrence별로 계획하고 완료한다.

- [x] 백엔드 반복 생성 계약, 상태 문서, real smoke 결과를 2026-08-01 재확인했다. 생성, Today/Calendar occurrence materialize, cleanup이 통과했다.
- [x] 모바일 타입/API는 nested `recurrence` 응답, `TaskUpsertRequest.recurrence`, `recurrenceScope` 수정·삭제 query를 받을 수 있게 맞춘다.
- [x] Task 작성 화면에 반복 없음, 매일, 매주, 매월, 사용자 지정 선택을 추가한다.
- [x] Task 작성 화면에서 일정 날짜와 시작·종료 시간을 입력할 수 있게 해 Calendar real smoke data를 앱 흐름으로 만들 수 있게 한다.
- [x] 수정·삭제 시 `이번만 / 이후 모두 / 전체` 범위 선택 UI를 제공한다.
- [x] Today와 Calendar 범위 조회에 occurrence를 표시한다.
- [x] occurrence별 완료, 미룸과 완료 기록을 연결한다. 2026-08-02 real smoke에서 materialize된 occurrence의 `/done`, `/defer-reason`, 완료 처리일 기준 done list 조회가 통과했다.
- [x] occurrence별 건너뛰기 계약을 확정하고 모바일 smoke에 연결한다. 2026-08-02 real smoke에서 `DELETE recurrenceScope=THIS`가 해당 occurrence만 숨기고 이후 occurrence를 유지하는 것을 확인했다.
- [x] 모바일 API client는 `GET /api/v1/tasks/notification-candidates` 응답 타입과 조회 method를 제공한다.
- [x] 반복 일정과 로컬 알림의 예약·취소 책임을 실제 API 후보 기준으로 검증한다. 2026-08-02 real smoke에서 완료·건너뛴 occurrence가 notification candidates에서 제외되고 이후 occurrence가 유지되는 것을 확인했다. 실제 OS 알림 예약·취소는 native 실기기 QA에서 확인한다.

완료 기준:

- 반복 원본과 개별 occurrence를 사용자가 혼동하지 않는다.
- 한 occurrence의 완료나 수정이 다른 반복 일정에 의도치 않게 영향을 주지 않는다.

### D. 출시 준비와 품질 마감

목표: 개발용 데모가 아니라 Android, iOS, Web에서 실제 사용 가능한 앱으로 마감한다.

- [x] [`RELEASE_CHECKLIST.md`](../qa/RELEASE_CHECKLIST.md)를 만들고 배포 전 확인 항목을 한 곳에서 관리한다.
- [x] 앱 아이콘, splash, 상태바, safe area의 현재 설정과 남은 실기기 확인 항목을 문서화한다.
- [x] 화면 가이드와 마켓 이미지 구성 문서는 최신 화면 구조 기준으로 정리했고, mock Web 390×844 기준 실제 PNG 캡쳐를 `docs/screenshots/`에 생성했다.
- [x] 마켓·소개용 1080×1920 편집 PNG 초안을 실제 화면 캡쳐 기반으로 `docs/marketing/`에 생성했다.
- [x] Google Play와 App Store Connect screenshot 규격을 공식 문서로 확인하고 [`APP_STORE_ASSETS.md`](../marketing/APP_STORE_ASSETS.md)에 반영했다.
- [x] route 기준 전체 화면 screenshot과 Product Design audit 전수 확인을 완료했다. 상태별 추가 확인 범위는 [`SCREEN_GUIDE.md`](../design/SCREEN_GUIDE.md)의 화면 점검 범위 표를 기준으로 관리한다.
- [x] Search 상세 필터/빈 상태, Task 작성 일정·추가 정보 확장, D-Day 생성/menu/삭제/연결 Task 상태를 Product Design audit으로 확인하고 즉시 수정 포인트를 반영했다.
- [x] Android package, iOS bundle identifier, EAS profile을 개인 APK 기준으로 설정했다. Play Store 또는 Apple Team 배포 전에는 계정 정책 기준으로 재검토한다.
- [x] Web mock responsive smoke와 real auth API smoke를 반복 실행하고 결과를 [`SMOKE_TEST_LOG.md`](../qa/SMOKE_TEST_LOG.md)에 기록했다.
- [x] Web 새 버전 배포 시 사용자가 캐시를 직접 지우지 않아도 되도록 `index.html` 재검증과 hashed asset 장기 캐시 기준을 [`WEB_DEPLOYMENT_CACHE.md`](../integration/WEB_DEPLOYMENT_CACHE.md)에 정리했다.
- [ ] Android/iOS에서 mock/real 화면 smoke test를 반복한다. 반복 occurrence real API smoke는 Web/Node 기준 통과했고, native 화면 smoke는 simulator 또는 실기기 준비 후 확인한다.
- [x] Web mock에서 Today와 Calendar의 focusable label, 읽기 순서, keyboard focus smoke를 점검하고 [`SMOKE_TEST_LOG.md`](../qa/SMOKE_TEST_LOG.md)에 기록했다.
- [ ] iOS VoiceOver와 Android TalkBack에서 일정 bar, checkbox, tab, 빠른 기록 동선을 [`ACCESSIBILITY_CHECKLIST.md`](../qa/ACCESSIBILITY_CHECKLIST.md)의 최소 smoke 순서와 기록 양식으로 최종 점검한다.
- [x] Web mock에서 Today와 Calendar의 초기 진입, DOM 크기, horizontal overflow 기준 렌더링 smoke를 점검하고 [`SMOKE_TEST_LOG.md`](../qa/SMOKE_TEST_LOG.md)에 기록했다.
- [ ] Android/iOS 실기기에서 초기 진입, 긴 목록, Calendar 렌더링 성능을 실제 API 지연과 큰 글꼴 기준으로 점검한다.

완료 기준:

- 주요 흐름을 실제 기기에서 막힘 없이 수행할 수 있다.
- 배포 환경별 API 설정과 앱 식별자가 분리되어 있다.
- 비밀 값이 앱 번들이나 저장소에 포함되지 않는다.

### E. Android 개인 production APK

목표: Expo Go나 Metro 개발 서버 없이 단독 실행되는 ToDoLab APK를 Android 기기에 설치하고, 이 PC의 Docker production API에 Tailscale HTTPS로 접속해 매일 사용한다. APK 설치 자체에는 Tailscale이 필요하지 않으며, 설치된 앱이 집 밖에서 production API에 접속할 때 Tailscale이 필요하다.

#### E1. 앱 식별자와 내부 배포 빌드

- [x] Android package를 `com.todolab.mobile`로 정하고 `app.json`의 `expo.android.package`에 설정한다.
- [x] iOS bundle identifier를 Android와 같은 기준인 `com.todolab.mobile`로 설정한다. iOS 배포 전 Apple Team 기준으로 재검토한다.
- [x] Expo project owner와 project id를 확정하고 EAS project를 연결한다. 현재 owner는 `hyunseung2`, project id는 `f49103dc-1d93-47a9-8972-4b5a4cc9e395`다.
- [x] `eas.json`에 Android `development`, `preview`, `production` profile을 구분한다.
- [x] `preview` profile은 `distribution: internal`과 `android.buildType: apk`로 직접 설치 가능한 APK를 생성하도록 설정한다.
- [x] production API 빌드는 `EXPO_PUBLIC_API_MODE=real`을 사용하고 mock fallback이 일어나지 않게 한다.
- [x] 앱 version은 `1.0.0`, Android versionCode는 `1`로 시작한다.
- [x] Android APK 빌드 전 공개 환경값과 local URL 혼입을 확인하는 `npm run check:android-apk`를 추가한다.
- [x] EAS CLI와 project id 연결 여부를 확인하는 `npm run check:eas-setup` preflight를 추가한다.
- [x] Android signing credential은 EAS managed를 기본으로 사용하고, keystore/password는 저장소에 넣지 않는 운영 기준을 문서화한다.
- [x] 앱 이름, scheme, icon/splash/favicon 파일 존재와 PNG 크기를 확인하는 `npm run check:release-assets`를 추가한다.
- [x] `npm run validate`에 EAS 계정 없이 통과 가능한 release static 검사(`check:release-static`)를 포함한다.
- [x] EAS project 연결 후 실제 Android signing credential 생성과 접근 권한을 확인한다. preview profile에서 EAS managed JKS credential과 SHA1/SHA256 fingerprint를 확인했다.
- [ ] 생성한 APK를 실제 기기에 설치하고 Expo Go와 Metro 없이 cold start 되는지 확인한다.

완료 기준:

- 홈 화면에 독립된 ToDoLab 아이콘이 설치된다.
- PC에서 `expo start`를 실행하지 않아도 앱이 시작된다.
- 같은 package의 다음 APK가 기존 앱 데이터와 로그인 상태를 유지한 채 update install 된다.

#### E2. Tailscale production API 연동

- [ ] PC와 Android에 Tailscale을 설치하고 동일 tailnet 로그인을 확인한다.
- [x] 백엔드에서 확정한 Tailscale HTTPS 주소 `https://macmini.tail68d2d1.ts.net`을 production `EXPO_PUBLIC_API_URL`로 사용한다.
- [x] production APK에 `localhost`, `10.0.2.2`, LAN IP가 남지 않는지 빌드 전 정적 검사한다.
- [x] 앱 번들의 `EXPO_PUBLIC_*` 값은 공개 정보로 간주하고 secret, token, password를 넣지 않는다.
- [ ] Android에서 Tailscale 연결 전·후의 network error와 재시도 UX를 확인한다.
- [ ] Wi-Fi와 모바일 데이터 전환 뒤 Auth, Today, Calendar query가 정상 복구되는지 확인한다.
- [ ] Tailscale이 꺼져 있을 때 사용자가 이해할 수 있는 연결 오류와 재시도 동선을 제공한다.
- [x] HTTPS production 경로를 기본으로 하고 Android cleartext HTTP 허용을 production APK config에서 켜지 않는 기준을 정적 검사에 반영한다.

완료 기준:

- 같은 Wi-Fi와 외부 모바일 데이터 환경에서 동일한 production URL로 접속한다.
- LAN IP 변경이나 PC 재부팅 때문에 APK를 다시 빌드하지 않는다.
- Tailscale이 끊겼다가 복구되어도 앱 재설치나 로그인 초기화 없이 다시 동기화된다.

#### E3. Android 실기기 release smoke

- [x] `npm run validate`를 통과한다. 2026-08-06 기준 비밀번호 재설정 API 계약 추가 후 typecheck, lint, format, docs link, release static check, test가 모두 통과했다.
- [ ] 회원가입/로그인, access token SecureStore 복원, 로그아웃을 실제 APK에서 확인한다.
- [ ] Today 조회·추가·수정·완료·재정렬을 실제 production DB로 확인한다.
- [ ] Calendar 일정 생성·수정, 반복 occurrence, D-Day, Search를 실제 production DB로 확인한다.
- [ ] 앱 강제 종료, 백그라운드 복귀, 기기 재부팅 후 상태 복원을 확인한다.
- [ ] Android back 버튼, 키보드, navigation bar, safe area, font scale 1.5, TalkBack을 확인한다.
- [ ] 긴 목록과 Calendar 렌더링, Wi-Fi/모바일 데이터 전환, API timeout을 확인한다.
- [ ] release 후보의 앱 commit, 백엔드 commit/image, API URL, 기기, 결과를 [`SMOKE_TEST_LOG.md`](../qa/SMOKE_TEST_LOG.md)에 기록한다.

완료 기준:

- [`RELEASE_CHECKLIST.md`](../qa/RELEASE_CHECKLIST.md)의 Android/real 항목이 통과한다.
- 최소 하루 실제 사용 후 데이터 유실, 중복 생성, 날짜 경계, 세션 복원 문제가 없다.

#### E4. 설치와 업데이트 운영

- [x] APK 저장 위치와 기기로 전달하는 방법을 정한다.
- [x] 출처를 알 수 없는 앱 설치 권한은 APK 설치 직후 다시 제한하는 운영 방식을 정한다.
- [x] release note에 version, API 호환 범위, 필수 migration 여부를 남기는 형식을 정한다.
- [x] 백엔드 API breaking change가 있으면 호환 APK 설치 완료 전 기존 API를 제거하지 않는 운영 기준을 정한다.
- [x] APK rollback이 필요할 때 Android versionCode와 앱 데이터 호환성을 확인하는 기준을 정한다.
- [x] Play Store 배포는 개인 APK 사용이 안정된 뒤 별도 결정으로 남긴다.

완료 기준:

- 새 APK 배포, update install, 문제 발생 시 이전 호환 버전 복구 절차가 문서화되어 있다.
- APK 파일이나 다운로드 링크가 없어져도 같은 commit과 credential로 다시 빌드할 수 있다.

### 현재 미완료 항목의 보류 조건

모바일 저장소에서 바로 끝낼 수 있는 Web mock/real 검증과 문서 정리는 완료했다. 남은 체크박스는 아래 조건이 충족되면 커밋 단위로 이어서 진행한다.

| 보류 조건                                   | 연결 항목                                                                                  | 다음 행동                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Android/iOS simulator 또는 실기기 실행 가능 | font scale, safe area, light/dark, mock/real 화면 smoke, VoiceOver/TalkBack, 네이티브 성능 | 2026-08-02 재확인 기준으로 `xcrun`은 있으나 `simctl` utility를 찾을 수 없고 `adb`도 없어 iOS/Android simulator 또는 Android device 목록을 확인할 수 없다. Xcode Command Line Tools의 simulator runtime 또는 Android Platform Tools/실기기가 준비되면 [`ACCESSIBILITY_CHECKLIST.md`](../qa/ACCESSIBILITY_CHECKLIST.md), [`PERFORMANCE_CHECKLIST.md`](../qa/PERFORMANCE_CHECKLIST.md), [`PLATFORM_QUALITY_CHECKLIST.md`](../qa/PLATFORM_QUALITY_CHECKLIST.md)에 맞춰 기록한다. |
| EAS Android signing credential 확인         | Android signing credential, preview APK build                                              | `npm run check:eas-setup`은 통과했고, 2026-08-08 재확인 기준 2026-08-03 preview build `684720b7-aa78-4a55-920d-d34995dd7a86`은 `FINISHED`다. 다만 해당 APK는 frontend commit `987c90d13216efddab3c70127f5d543704437bd8` 기준이라 이후 인증 UI 변경은 포함하지 않는다. 최신 UI APK가 필요하면 현재 `main` 기준으로 preview build를 다시 생성한다.                                                                                                                             |
| Web production host 결정                    | `index.html`/hashed asset cache header, CDN invalidation, service worker 도입 여부         | Web host 또는 CDN이 정해지면 [`WEB_DEPLOYMENT_CACHE.md`](../integration/WEB_DEPLOYMENT_CACHE.md)의 header 기준으로 실제 응답을 확인하고 release checklist에 기록한다.                                                                                                                                                                                                                                                                                                        |

## 8. 커밋 운영 기준

브랜치 이름:

- 기본 작업은 `main`에서 진행한다.
- 규모가 크거나 실험적이거나 병렬 작업이 필요한 경우에만 브랜치를 만든다.
- 기능: `feat/<topic>`
- 버그: `fix/<topic>`
- 설정·문서: `chore/<topic>`

커밋 원칙:

- 하나의 커밋은 하나의 사용자 변화 또는 하나의 기반 변경만 담는다.
- 구현과 그 변경을 설명하는 ROADMAP·DESIGN 갱신은 같은 완결 단위에 포함할 수 있다.
- 리팩터링과 기능 추가를 가능하면 분리한다.
- 백엔드 변경은 모바일 커밋에 섞지 않는다.
- API 변경이 필요하면 모바일 요구 계약을 먼저 문서화하고 백엔드 저장소에서 별도 브랜치와 커밋으로 처리한다.
- 커밋 메시지는 `feat:`, `fix:`, `chore:` 같은 prefix 없이 변경 결과를 나타내는 짧은 한국어 명사형으로 작성한다.
- 변경 후와 커밋 전에는 `npm run validate`로 typecheck, lint, format, docs link, release static check, test를 모두 확인한다.
- 플랫폼별 코드 변경은 사용자 전달 내용에 영향을 받는 Android, iOS, Web 범위를 명시한다.
- 코드와 문서 변경 및 검증까지만 먼저 진행하고, 사용자가 명시적으로 승인한 경우에만 커밋과 푸시를 실행한다.
- 실제 비밀 값과 `.env.local` 같은 로컬 환경 파일은 커밋하지 않는다.
- 여러 로컬 커밋을 한 번에 푸시할 수 있지만 푸시 역시 사용자 승인을 받은 경우에만 진행한다.

권장 커밋 크기 예시:

```text
모바일 디자인 토큰 정리
하단 탭 navigation 구성
Task API 타입과 client 추가
Today 작업 목록 표시
빠른 할 일 추가
키보드와 저장 버튼 겹침 수정
```

## 9. 화면별 공통 완료 조건

- 로딩, 빈 상태, 오류, 재시도 상태가 있다.
- 터치 영역이 최소 44pt다.
- 하단 탭과 키보드가 마지막 콘텐츠나 CTA를 가리지 않는다.
- 긴 한글 제목, 320px Web, 375pt iPhone, 430dp Android 폭에서 레이아웃이 깨지지 않는다.
- VoiceOver/TalkBack이 버튼 목적과 Task 상태를 이해할 수 있다.
- 색상만으로 완료, 위험, 선택 상태를 전달하지 않는다.
- API 성공 뒤 관련 화면의 데이터가 일관되게 갱신된다.
- 날짜와 시간은 Android, iOS, Web에서 같은 의미로 표시된다.
- `npm run validate`의 typecheck, lint, format, docs link, test가 모두 통과한다.

## 10. 현재 제품 결정

- 첫 진입 화면은 Today로 한다.
- 하단 탭은 `오늘`, `달력`, `프로필` 세 개로 유지하고, 기록함은 Today의 `정리할 항목` 또는 Profile의 기록/검색 흐름에서 다룬다.
- 인증 UI는 1차 구현과 real API smoke test를 완료했고, 배포 전에는 refresh token 또는 세션 만료 정책을 다시 확인한다.
- API URL과 mock/real 모드는 환경변수로 교체할 수 있게 유지한다.
- 로컬 UI 개발은 `EXPO_PUBLIC_API_MODE=mock`으로 더미 데이터를 사용하고, 백엔드 연동 테스트는 `EXPO_PUBLIC_API_MODE=real`과 `EXPO_PUBLIC_API_URL`로 실제 서버를 사용한다.
- 자연어 빠른 입력, 검색, 하위 작업, 주간 리포트는 핵심 모바일 흐름 이후에 진행한다.
- 네이티브 알림은 MVP 데이터 흐름이 안정된 뒤 추가한다.

## 11. 프론트 개발 산출물

모바일 프론트는 기능 구현만으로 완료하지 않고, 설계 의도와 검증 결과가 남아야 한다. 작성하면 좋은 산출물은 다음과 같다.

| 산출물                            | 목적                                      | 관리 기준             |
| --------------------------------- | ----------------------------------------- | --------------------- |
| Roadmap                           | 제품 방향, 작업 우선순위, 완료 기준       | 앞으로 할 일 중심     |
| Design system                     | 색상, typography, spacing, component 원칙 | 현재 토큰 중심        |
| Screen guide                      | 실제 화면 캡쳐와 사용 흐름 설명           | 캡쳐 갱신 시 수정     |
| App store / marketing asset guide | 마켓 이미지, 소개 문구, 캡쳐 구성         | 출시 준비 시 갱신     |
| Backend integration runbook       | real API 환경 설정, endpoint, smoke 순서  | 계약 변경 시 수정     |
| Smoke test checklist / log        | mock/real 검증 시나리오와 최신 결과       | 최신 기준선만 유지    |
| Accessibility checklist           | screen reader, 명암, touch target 기준    | 배포 전 재점검        |
| Performance checklist             | 긴 목록, Calendar, 초기 로딩 성능 기준    | 실기기 QA 때 갱신     |
| Platform quality checklist        | Android/iOS/Web safe area, icon, keyboard | 식별자 확정 시 수정   |
| API contract notes                | 검색, 반복, 일정 범위, 날짜/시간 계약     | 백엔드 변경 시 수정   |
| Release checklist                 | 배포 전 계정, 빌드, 환경, QA 확인         | 출시 전 사용          |
| UX review log                     | 화면별 결정, 다음 UX 검토 항목            | 최신 판단만 유지      |
| Component inventory               | 공통 컴포넌트 사용처와 변형 정리          | 컴포넌트 변경 시 수정 |

이미 지나간 작업 내역은 각 문서에서 길게 보관하지 않는다. 이후 새 패턴이 생기면 `DESIGN.md`, `UX_REVIEW_LOG.md`, `COMPONENT_INVENTORY.md` 중 적절한 문서에 현재 기준으로 반영한다.

## 12. 바로 다음 작업

다음 작업은 실제 화면 품질과 기기별 QA를 우선한다. 2026-07-28 기준 local real API full smoke test는 통과했으므로, 이후 real API 검증은 화면 QA와 배포 전 회귀 테스트로 반복한다.

1. 최신 `main` 기준 Android preview APK가 필요한지 결정한다. 기존 2026-08-03 APK는 생성 완료됐지만 이후 인증 UI 변경은 포함하지 않는다.
2. 최신 APK가 필요하면 Tailscale HTTPS URL이 들어간 preview APK를 다시 생성한다.
3. 생성한 APK를 실제 Android 기기에 설치해 Expo Go와 Metro 없이 cold start, 로그인, Today 핵심 흐름을 확인한다.
4. 430dp, font scale 1.5, light/dark에서 Today와 Calendar, Android back/keyboard/navigation bar가 깨지지 않는지 실기기로 확인한다.
5. [`BACKEND_INTEGRATION_RUNBOOK.md`](../integration/BACKEND_INTEGRATION_RUNBOOK.md)와 [`RELEASE_CHECKLIST.md`](../qa/RELEASE_CHECKLIST.md)에 맞춰 Android real-mode 전체 smoke를 기록한다.
6. 최소 하루 실제 사용하면서 네트워크 전환, 앱 강제 종료, 기기 재부팅, 날짜 경계, 중복 생성과 세션 복원을 확인한다.
7. Android 개인 APK가 안정된 뒤 알림, Play Store, iOS/Web 배포 범위를 별도로 결정한다.

그전에도 사용을 막는 접근성, 키보드, 오류 상태와 명백한 정보 중복은 발견 즉시 수정한다.
