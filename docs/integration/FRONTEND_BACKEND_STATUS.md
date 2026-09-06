# 프론트엔드·백엔드 연동 현황

Last verified: 2026-09-06

이 문서는 모바일에서 사용하는 백엔드 계약의 단일 현황판이다. 앞으로 할 일의 우선순위는 [`ROADMAP.md`](../product/ROADMAP.md), 실제 연결 절차는 [`BACKEND_INTEGRATION_RUNBOOK.md`](./BACKEND_INTEGRATION_RUNBOOK.md), 세부 일일 실행 계약은 [`API_DAILY_EXECUTION.md`](../api/API_DAILY_EXECUTION.md)를 따른다.

## 확인 기준

| 구분                 | 확인 결과                                                                               |
| -------------------- | --------------------------------------------------------------------------------------- |
| 백엔드 source        | local `main` = `d4c4243`                                                                |
| 관련 커밋            | Workspace 체크리스트, Task 카테고리 요약, 일일 계획 결과 요약, 빠른 등록 구어 표현 파싱 |
| 관련 테스트          | Daily Plan 6, Task API 37, Checklist 5, OpenAPI 7 통과                                  |
| production readiness | `UP`                                                                                    |
| production metadata  | `version=1.0-SNAPSHOT`, `commitSha=local`, `imageTag=63a54d5`                           |
| production OpenAPI   | 익명 요청 HTTP 403                                                                      |

source 구현 완료와 production 반영 완료는 구분한다. 현재 metadata만으로는 production image `63a54d5`가 최신 source를 실행한다고 볼 수 없으며, 아래 migration 적용 여부도 확인되지 않았다.

```text
docs/db/migrations/20260903_add_daily_plan_initial_focus_task.sql
```

## 신규·변경 API와 모바일 상태

| API                                         | 백엔드 계약                                                                      | 현재 모바일                       | 다음 프론트 작업                   |
| ------------------------------------------- | -------------------------------------------------------------------------------- | --------------------------------- | ---------------------------------- |
| `GET/PUT /api/v1/daily-plans/{date}`        | focus 최대 3개와 `DRAFT/CONFIRMED/CLOSED` 상태                                   | focus 복원·확정·real smoke 추가   | guest 500 복구 후 local·production |
| `GET /api/v1/daily-plans/{date}/summary`    | 계획 확정 시점 focus 기준 완료·이동·미결정 집계                                  | 하루 마감 결과·real smoke 추가    | migration 후 local·production      |
| `GET /api/v1/tasks/categories`              | 개인 Task만 집계하며 `category=null`은 `미분류`                                  | drawer·named 이동·real smoke 추가 | null-category 검색·guest 500 복구  |
| `/api/v1/tasks/{taskId}/checklist-items/**` | 개인·Workspace 지원. ACTIVE 멤버 조회, OWNER/EDITOR 변경, VIEWER 변경 403        | 상세 CRUD·정렬·개인 smoke 추가    | Workspace 역할별·production smoke  |
| `POST /api/v1/tasks/quick-capture`          | 축약 상대일, 상대 주+요일, 한국어·슬래시 날짜, 단독 요일, `N시 반`, `HH:mm` 파싱 | 연결·real 입력 smoke 추가         | guest 500 복구 후 local·production |

기존 개인 Task URL과 DTO에는 깨지는 변경이 없다. 카테고리 요약은 Workspace Task를 포함하지 않으며 카테고리 생성·이름 변경·삭제·사용자 지정 정렬 API를 대신하지 않는다.
Task `estimatedDurationMinutes`는 5~1440분 입력, 상세 표시와 Today 실행 Task 합계까지 연결했다.

## 프론트에서 바로 할 수 있는 일

1. 카테고리 drawer의 `전체`·이름 있는 개인 카테고리 이동을 real API로 확인하고 null-category 검색 계약 뒤 `미분류`를 활성화한다.
2. 체크리스트를 Workspace OWNER·EDITOR·VIEWER 실제 계정으로 검증한다.
3. Daily Plan과 summary를 local real API로 확인하고 migration 미적용·404 상태를 구분한다.
4. production 배포 확인 뒤 Android 실기기 smoke를 수행한다.

UI가 바뀌는 1~3번은 Product Design 검토와 390×844 캡처 판정을 포함한다. 로컬 Web 검증은 ChatGPT 앱의 내장 브라우저를 기본으로 사용하고, 연결이 불가능하거나 Chrome 고유 동작을 확인해야 할 때 로컬 Chrome/Playwright를 사용한다.

## 백엔드·운영에 요청할 항목

### 배포에 반드시 필요한 요청

- `d4c4243` 기준 신규 API를 포함한 이미지를 production에 배포하고 필요한 migration 전체를 순서대로 적용한다.
- metadata의 `commitSha`가 `local`이 아닌 배포 commit을 반환하도록 빌드 정보를 주입한다.
- 같은 배포의 readiness, metadata, OpenAPI와 migration 적용 기록을 제공한다.
- 인증된 OpenAPI 확인 방법을 제공하거나 검사 환경에서 계약 문서를 읽을 수 있게 한다.
- local `POST /api/v1/auth/guest` HTTP 500을 복구하고 8080의 Docker·IntelliJ 중 검증 기준 인스턴스를 하나로 고정한다.
- Android 실제 기기에서 신규 API와 기존 핵심 흐름을 함께 smoke할 수 있는 production 후보를 고정한다.

### 제품 결정 후 요청할 계약

- 검색 API에 `uncategorized=true`처럼 `category IS NULL`을 명시할 필터를 추가한다. summary API만으로는 `미분류` count는 알 수 있지만 cursor pagination을 보존한 목록 탐색은 불가능하다.
- 카테고리 관리가 필요해지면 생성·이름 변경·삭제·사용자 지정 순서와 삭제 시 Task 처리 정책을 추가한다.
- 단건 계획·마감 처리의 부분 실패가 반복 확인될 때만 atomic batch mutation을 요청한다.
- Web 운영 형태를 정한 뒤 refresh credential의 HttpOnly cookie 계약을 확정한다.
- 서버 push를 활성화할 때 token 등록·해제, 발송 멱등성과 local 알림 억제 소유권을 production에서 검증한다.

이미 source에 구현된 일일 계획, 예상 소요 시간, summary, 개인 카테고리 요약, 개인·Workspace 체크리스트와 빠른 등록 파싱을 다시 신규 구현 요청하지 않는다.

## 완료 판정

- production metadata가 배포 commit/image를 식별한다.
- 필수 migration과 실행 OpenAPI가 같은 배포 단위를 가리킨다.
- 신규 API 4종의 mobile mock·real 테스트가 통과한다.
- Workspace OWNER/EDITOR/VIEWER 권한 차이가 UI와 HTTP 결과에서 일치한다.
- Android production smoke 결과가 [`SMOKE_TEST_LOG.md`](../qa/SMOKE_TEST_LOG.md)에 기록된다.
