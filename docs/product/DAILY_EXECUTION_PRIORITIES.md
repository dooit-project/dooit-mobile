# 오늘 실행 루프 우선순위

Last updated: 2026-09-04

## 목표

```text
빠른 기록 → 오늘 계획 → 한 가지 실행 → 하루 마감 → 다음 날 복구
```

기존 기록함·Today·완료·추천·오래 미룬 일의 연결을 먼저 개선한다. 습관, Pomodoro, matrix와 자동 일정 배치는 오늘 실행 루프가 실제 사용에서 검증된 뒤 판단한다.

## 현재 완료된 프론트 기반

- 기존 Task API 기반 오늘 계획과 항목별 부분 실패 재시도
- 하루 마감과 날짜·기록함 이동
- session-only `한 가지 실행하기`
- 오늘·달력·기록함·오래 미룬 일·완료 기록·목표·공유 공간의 탐색 메뉴
- 공유 메뉴 text·URL 확인 화면과 iOS widget 빠른 기록 deep link prototype
- real quick-capture API와 멱등성 처리
- backend 규칙과 같은 quick-capture mock parser와 회귀 테스트

## 다음 프론트 작업

### F0. 서버 계약을 연결하는 비시각 작업

1. Daily Plan·summary·category summary·checklist 타입과 API client를 추가한다.
2. mock fixture, query key, cache 무효화, 403·404·migration 미적용 오류 테스트를 추가한다.

### F1. 카테고리 탐색

`GET /api/v1/tasks/categories`로 개인 Task 요약을 좌측 메뉴에 연결한다.

- `전체`, `미분류`, 개인 카테고리를 구분한다.
- `taskCount`, `inboxCount`, `todayCount`, `doneCount` 중 현재 진입에 필요한 값만 노출한다.
- Workspace Task는 섞지 않는다.
- 생성·이름 변경·삭제·사용자 지정 정렬 UI는 별도 API가 생기기 전 제공하지 않는다.

### F1. 체크리스트

개인·Workspace Task 상세에 한 단계 체크리스트를 연결한다.

- ACTIVE 멤버는 조회한다.
- OWNER·EDITOR는 생성·수정·완료·재개·삭제·정렬할 수 있다.
- VIEWER에게 변경 행동을 노출하지 않고 서버 403도 권한 안내로 처리한다.
- 계층형 subtask, 담당자, 날짜, 알림은 범위에서 제외한다.

### F1. 서버 Daily Plan과 하루 결과

- local preference 기반 계획 상태를 서버 Daily Plan으로 교체한다.
- `estimatedDurationMinutes` 입력과 오늘 총 예상 시간을 연결한다.
- 계획 확정 시점 snapshot 기반 summary를 하루 마감 결과에 사용한다.
- summary의 완료·다른 날짜 이동·기록함 이동·미결정을 생산성 점수로 바꾸지 않는다.

### F2. 네이티브와 production 검증

- 공유 메뉴와 iOS widget prototype을 development/preview build에서 실제 기기로 확인한다.
- 최신 production image와 migration이 확인된 뒤 신규 API와 기존 핵심 흐름을 Android에서 smoke한다.
- UI 변경은 Product Design 3안 비교와 390×844 캡처 판정을 거친다.

## 백엔드 요청 우선순위

| 우선순위 | 요청                                                   | 이유                                       | 요청 시점              |
| -------- | ------------------------------------------------------ | ------------------------------------------ | ---------------------- |
| B0       | 최신 source 배포, migration 적용, 식별 가능한 metadata | 구현된 계약을 production에서 안전하게 검증 | 즉시                   |
| B0       | 인증된 OpenAPI 확인 경로                               | 실행 계약과 source의 일치 자동 검사        | 즉시                   |
| B1       | 카테고리 CRUD·정렬·삭제 정책                           | 메뉴에서 직접 관리하는 기능                | 관리 UX를 승인할 때    |
| B1       | 계획·마감 atomic batch mutation                        | 단건 처리의 부분 성공 방지                 | 실제 오류가 반복될 때  |
| B1       | Web HttpOnly refresh cookie                            | Web 장기 세션의 credential 노출 축소       | 운영 host 정책 확정 시 |
| B2       | 서버 push token·발송 소유권                            | local/push 중복 방지                       | push 활성화 승인 시    |

일일 계획, 예상 소요 시간, 일일 결과 summary, 개인 카테고리 요약, 개인·Workspace 체크리스트와 새 빠른 등록 표현은 source 구현이 끝났으므로 백엔드 신규 요청 목록에서 제외한다.

## 의도적으로 보류

- 습관 tracker
- Eisenhower Matrix
- Kanban·Gantt·Timeline
- AI 자동 일정 재배치
- 생산성 점수와 연속 달성
- 댓글·파일·복잡한 Workspace activity feed
