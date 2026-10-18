# 프론트엔드·백엔드 연동 현황

Last verified: 2026-09-13 (운영 공개 endpoint만 재확인)

이 문서는 모바일에서 사용하는 백엔드 계약의 단일 현황판이다. 앞으로 할 일의 우선순위는 [`ROADMAP.md`](../product/ROADMAP.md), 실제 연결 절차는 [`BACKEND_INTEGRATION_RUNBOOK.md`](./BACKEND_INTEGRATION_RUNBOOK.md), 세부 일일 실행 계약은 [`API_DAILY_EXECUTION.md`](../api/API_DAILY_EXECUTION.md)를 따른다.

문서 정리: 2026-09-14. readiness·metadata·익명 OpenAPI는 9월 13일 재조회했다. 백엔드 local source·관련 테스트·guest 응답·migration은 이번에 재확인하지 않았으므로 과거 결과로 구분한다.

## 확인 기준

| 구분                         | 확인 결과                                                                               |
| ---------------------------- | --------------------------------------------------------------------------------------- |
| 백엔드 source (9월 8일 기록) | local `main` = `d1b2ddc`                                                                |
| 관련 커밋                    | Workspace 체크리스트, Task 카테고리 요약, 일일 계획 결과 요약, 빠른 등록 구어 표현 파싱 |
| 관련 테스트                  | Daily Plan 6, Task API 37, Checklist 5, OpenAPI 7 통과                                  |
| production readiness         | `UP`                                                                                    |
| production metadata          | `version=1.0-SNAPSHOT`, `commitSha=local`, `imageTag=3bda00c`                           |
| production OpenAPI           | 익명 요청 HTTP 403                                                                      |

source 구현 완료와 production 반영 완료는 구분한다. 현재 imageTag `3bda00c`는 배포 식별 검사를 통과한다. 다만 commitSha는 `local`이라 태그와 실제 source의 대응을 추가 확인해야 한다. 과거 guest 응답의 refreshToken 누락은 이번에 재검증하지 않았다. 아래 migration 적용 여부도 미확인이다.

```text
docs/db/migrations/20260903_add_daily_plan_initial_focus_task.sql
```

## 신규·변경 API와 모바일 상태

2026-10-18 코드 변경: 빠른 기록 성공 안내를 parser metadata 대신 저장된 Task 원본 기준으로 정리하고 `6b7ac90`으로 커밋했다(미검증). 오늘의 할 일 선택을 TODO로 보존하는 필드는 현재 요청 DTO에 없어 [추가 계약 요청](../api/API_QUICK_CAPTURE_TYPE_CHANGE_REQUEST.md)을 별도 작성했다. **미전달·미합의**이며 기존 목표 중심 요청서의 전달 여부와 구분한다. 서버·배포·실 API의 현재 상태는 새로 확인하지 않았다.

| API                                         | 백엔드 계약                                                                      | 현재 모바일                       | 다음 프론트 작업                   |
| ------------------------------------------- | -------------------------------------------------------------------------------- | --------------------------------- | ---------------------------------- |
| `GET/PUT /api/v1/daily-plans/{date}`        | focus 최대 3개와 `DRAFT/CONFIRMED/CLOSED` 상태                                   | focus 복원·확정·real smoke 추가   | guest 500 복구 후 local·production |
| `GET /api/v1/daily-plans/{date}/summary`    | 계획 확정 시점 focus 기준 완료·이동·미결정 집계                                  | 하루 마감 결과·real smoke 추가    | migration 후 local·production      |
| `GET /api/v1/tasks/categories`              | 개인 Task만 집계하며 `category=null`은 `미분류`                                  | drawer·named 이동·real smoke 추가 | null-category 검색·guest 500 복구  |
| `/api/v1/tasks/{taskId}/checklist-items/**` | 개인·Workspace 지원. ACTIVE 멤버 조회, OWNER/EDITOR 변경, VIEWER 변경 403        | 상세 CRUD·정렬·역할별 local 확인  | production Android smoke           |
| `POST /api/v1/tasks/quick-capture`          | 축약 상대일, 상대 주+요일, 한국어·슬래시 날짜, 단독 요일, `N시 반`, `HH:mm` 파싱 | 연결·real 입력 smoke 추가         | guest 500 복구 후 local·production |

기존 개인 Task URL과 DTO에는 깨지는 변경이 없다. 카테고리 요약은 Workspace Task를 포함하지 않으며 카테고리 생성·이름 변경·삭제·사용자 지정 정렬 API를 대신하지 않는다.
Task `estimatedDurationMinutes`는 5~1440분 입력, 상세 표시와 Today 실행 Task 합계까지 연결했다.

## 프론트에서 바로 할 수 있는 일

1. 카테고리 drawer의 `전체`·이름 있는 개인 카테고리 이동을 real API로 확인하고 null-category 검색 계약 뒤 `미분류`를 활성화한다.
2. 체크리스트의 Workspace OWNER·EDITOR·VIEWER local 검증은 완료했다. production Android에서 같은 권한 경계를 확인한다.
3. Daily Plan과 summary를 local real API로 확인하고 migration 미적용·404 상태를 구분한다.
4. production 배포 확인 뒤 Android 실기기 smoke를 수행한다.

검증 중 UI 수정이 필요하면 Product Design 검토와 실제 화면 감사를 진행한다. 로컬 Web 검증은 ChatGPT 앱의 내장 브라우저를 기본으로 사용하며, 접근 실패 시 연결·주소·서버 상태를 먼저 복구한다. 다른 브라우저로 전환한 경우 사유와 실제 환경을 audit에 기록한다.

## 백엔드·운영에 요청할 항목

### 배포에 반드시 필요한 요청

- imageTag `3bda00c`가 포함하는 실제 source SHA와 신규 API·migration 전체의 적용 기록을 제공한다. 과거 local `d1b2ddc` 기록만으로 현재 배포 누락을 단정하지 않는다.
- metadata의 `commitSha`가 `local`이 아닌 배포 commit을 반환하도록 빌드 정보를 주입한다.
- 같은 배포의 readiness, metadata, OpenAPI와 migration 적용 기록을 제공한다.
- 인증된 OpenAPI 확인 방법을 제공하거나 검사 환경에서 계약 문서를 읽을 수 있게 한다.
- local `POST /api/v1/auth/guest` HTTP 500을 복구하고 8080의 Docker·IntelliJ 중 검증 기준 인스턴스를 하나로 고정한다.
- Workspace 반복 Task의 D-Day 연결 HTTP 500을 복구한다. 체크리스트 역할 검증은 통과했으며 실패 시 Workspace 자동 정리도 확인했다.
- Android 실제 기기에서 신규 API와 기존 핵심 흐름을 함께 smoke할 수 있는 production 후보를 고정한다.

### 제품 결정 후 요청할 계약

- 검색 API에 `uncategorized=true`처럼 `category IS NULL`을 명시할 필터를 추가한다. summary API만으로는 `미분류` count는 알 수 있지만 cursor pagination을 보존한 목록 탐색은 불가능하다.
- 카테고리 관리가 필요해지면 생성·이름 변경·삭제·사용자 지정 순서와 삭제 시 Task 처리 정책을 추가한다.
- 단건 계획·마감 처리의 부분 실패가 반복 확인될 때만 atomic batch mutation을 요청한다.
- Web 운영 형태를 정한 뒤 refresh credential의 HttpOnly cookie 계약을 확정한다.
- 서버 push를 활성화할 때 token 등록·해제, 발송 멱등성과 local 알림 억제 소유권을 production에서 검증한다.

이미 source에 구현된 일일 계획, 예상 소요 시간, summary, 개인 카테고리 요약, 개인·Workspace 체크리스트와 빠른 등록 파싱을 다시 신규 구현 요청하지 않는다.

## 신규 제품 방향 요청 — 계약 미확정

2026-10-12 시스템·실천 증거·AI 회고·다독임 요구를 [복사 전달용 백엔드 개발 요청서](../api/API_PERSONAL_SYSTEMS_REQUEST.md)에 정리했다. 신규 API 경로는 제안이며 백엔드 구현·배포·합의를 확인하지 않았다. 사용자 확인으로 요청서는 2026-10-12 백엔드 담당자에게 전달 완료했으며 회신 대기 상태다. 이 기록은 위 기존 API의 검증 날짜를 갱신하지 않는다. 프론트엔드 작업과 제품 원칙은 [제품 제안](../product/PERSONAL_SYSTEM_EXPERIENCE.md), 순서는 [로드맵](../product/ROADMAP.md)을 따른다.

## 완료 판정

- production metadata가 배포 commit/image를 식별한다.
- 필수 migration과 실행 OpenAPI가 같은 배포 단위를 가리킨다.
- 위 표의 Daily Plan·summary·category·checklist·quick-capture 계약에 대한 mobile mock·real 테스트가 통과한다.
- Workspace OWNER/EDITOR/VIEWER 권한 차이가 UI와 HTTP 결과에서 일치한다.
- Android production smoke 결과가 [`SMOKE_TEST_LOG.md`](../qa/SMOKE_TEST_LOG.md)에 기록된다.

## 목표 중심 범위 수정 — 전달 완료, 회신 대기

2026-10-13 사용자가 목표 하나에 여러 반복 계획과 일회성 노력을 연결하고 목표별 지나온 길을 보는 경험을 명확히 요청했다. [목표 중심 변경 요청서](../api/API_GOAL_JOURNEY_CHANGE_REQUEST.md)는 기존 전달본의 단일 시스템 제한을 수정하며, 사용자 확인으로 백엔드 담당자에게 전달됐다. 회신·계약 합의·구현·배포는 미확인이다. [일상 반복 보충 확인서](../api/API_PERSONAL_SYSTEMS_DAILY_CLARIFICATION.md)는 이 변경 요청에서 참조해 함께 전달됐으며 별도 중복 요청하지 않는다.

2026-10-14 목표 색상도 계정 간 동기화가 필요한 Goal 속성으로 추가 요청했다. 프론트 초기 구현은 기존 API와 병행하기 위해 로컬 색상과 ID 기반 기본색을 사용하며, 백엔드 `colorKey` 생성·조회·수정 계약이 배포되면 서버 값을 우선하고 로컬 선택을 한 번 이전해야 한다.
