# Dooit 제품 요구사항

Last updated: 2026-09-11

현재 구현된 제품 범위와 제한을 관리하는 PRD다. 남은 작업은 [로드맵](./ROADMAP.md), 실행 계약과 배포 상태는 [연동 현황](../integration/FRONTEND_BACKEND_STATUS.md), 검증 결과는 [smoke log](../qa/SMOKE_TEST_LOG.md)를 따른다. 구현 완료는 production 검증이나 공개 출시 완료를 뜻하지 않는다.

## 제품 목표

생각난 일은 가볍게 기록하고, 오늘 해야 할 일은 선명하게 만든다. 개인 기록을 오늘 계획과 실행으로 연결하고, 필요한 일은 Workspace에서 함께 관리한다.

빠른 기록 → 기록함 정리 → 오늘 계획 → 한 가지 실행 → 하루 마감 → 다음 날 복구가 핵심 흐름이다.

## 현재 구현 범위

| 영역             | 사용자 요구와 현재 동작                                                        | 제한·추가 확인                                              |
| ---------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| 시작·계정        | 게스트 시작, 회원가입·로그인, 계정 연결, 세션 복구, 비밀번호 재설정            | production 메일·deep link·병합·refresh 검증                 |
| 빠른 기록·기록함 | 자연어 날짜·시간 해석, 날짜 없는 기록 보관, 저장 결과 확인과 오늘 이동         | real API 파싱·멱등성 검증                                   |
| 오늘 계획·실행   | 서버 Daily Plan 복원·확정, focus 최대 3개, 예상 시간 입력과 합계, 한 가지 실행 | 한 가지 실행은 session-only; 예상 시간은 5~1440분           |
| 하루 마감        | 완료·다른 날짜·기록함 이동과 계획 확정 시점 focus 기준 결과                    | summary migration·production 검증; 생산성 점수 제외         |
| Task·일정        | 생성·조회·수정·삭제, 완료·재개, 반복 범위 선택, 개인 템플릿                    | 반복·오류 복구 real smoke                                   |
| 체크리스트       | 개인·Workspace Task 상세에서 추가·수정·완료·재개·삭제·정렬                     | 한 단계만 지원; 담당자·날짜·알림·계층형 subtask 제외        |
| 탐색             | Today·Calendar·기록함·오래 미룬 일·완료 기록·검색·D-Day와 좌측 메뉴            | native 접근성·반응형 검증                                   |
| 개인 카테고리    | 달력 아래 접이식 요약, 전체·이름 있는 카테고리 검색 이동                       | 미분류는 count만 표시; 관리 CRUD·정렬과 Workspace 범위 제외 |
| 목표·공유 공간   | D-Day와 연결 Task, Workspace 생성·초대·수락·거절·멤버 역할별 일정·목표 관리    | production 역할별 smoke와 반복 Task D-Day 오류 재검증       |
| 알림·설정        | 로컬 알림 예약·동기화·선택 이동, 설정과 테마                                   | 실제 OS 전달·권한·cold start 검증; 서버 push 활성화 보류    |

Workspace 체크리스트는 ACTIVE 멤버가 조회하고 OWNER·EDITOR가 변경한다. VIEWER 변경 행동은 제공하지 않으며 서버 403은 권한 안내로 처리한다.

Today의 `오늘 완료한 일` 영역은 완료 항목이 1개 이상일 때만 표시한다. 마지막 완료 항목을 다시 열어 0개가 되면 제목·개수·목록 전체를 숨긴다. [표시 조건 검증](../audits/today-completed-visibility-2026-09-11/README.md)을 참고한다.

화면별 정상·예외·복구 시나리오는 [사용자 흐름 카탈로그](./USER_FLOW_CATALOG.md)에 둔다.

## 플랫폼과 배포 범위

- Android: 내부 preview APK를 우선 검증한다. 2026-09-10 빌드 제출과 EAS managed keystore 생성이 확인됐으며 완료·설치 결과는 smoke log에서 관리한다.
- iOS: 제품 범위에 포함하며 실제 기기 검증과 내부 배포 준비가 남았다.
- Web: 공통 UI와 정적 배포를 지원하며 운영 도메인의 인증·보안·직접 경로 접근을 검증한다.
- Store 공개와 OTA는 [배포 범위 정책](./RELEASE_SCOPE_POLICY.md)에 따른 별도 단계다.

## 실험 기능과 후속 후보

공유 메뉴 text·URL 수신과 iOS widget 빠른 기록은 prototype이다. 기본 preview의 필수 완료 기능으로 취급하지 않으며 별도 native build와 실제 기기 결과를 바탕으로 포함 여부를 결정한다. 기술 근거는 [앱 밖 빠른 기록 스파이크](./OUTSIDE_APP_QUICK_CAPTURE_SPIKE.md)를 따른다.

미분류 목록 탐색, 카테고리 관리, atomic batch, Web HttpOnly refresh cookie는 필요한 계약과 운영 결정을 먼저 확정한다. 습관 tracker, Pomodoro, Matrix, Kanban·Gantt·Timeline, AI 자동 일정 배치, 생산성 점수·연속 달성, 계층형 subtask, 주간 리포트와 복잡한 협업은 현재 출시 범위에 포함하지 않는다.

## 완료 기준

핵심 기능의 프론트 구현은 대부분 완료됐다. 다음 단계는 최신 API 배포 확인, Android 설치·실사용, 플랫폼 품질과 오류 복구 검증이다. 후보별 [릴리즈 체크리스트](../qa/RELEASE_CHECKLIST.md)를 통과하고 플랫폼 범위를 확정해야 출시 완료로 판정한다.
