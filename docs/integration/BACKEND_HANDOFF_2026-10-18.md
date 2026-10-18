# 2026-10-18 백엔드 회신 대조와 모바일 후속

문서 검토일: 2026-10-18 · 운영 재검증/모바일 연동 완료 판정 아님

## 근거와 이번 확인 범위

사용자가 전달한 `Mobile API Backend Status — Last audited: 2026-10-18` 원문을 읽었다. 추가로 같은 작업 폴더의 `backend` 저장소에서 다음 파일을 읽기 전용으로 확인했다.

- `docs/mobile/MOBILE_API_BACKEND_STATUS.md`
- `docs/api/QUICK_CAPTURE_TYPE_CONTRACT.md`
- `docs/api/PERSONAL_SYSTEM_CONTRACT.md` — 제목은 Goal Journey Contract이며 옛 단일 시스템 계약을 대체
- `docs/api/TIMEZONE_CONTRACT.md`, `docs/db/MIGRATION_HISTORY.md`
- `goal`의 생성/수정/조회 DTO와 목표/계획/회차/기록/여정 controller 매핑
- `task/dto/TaskQuickCaptureRequest.java`

백엔드 HEAD는 읽은 시점 `a27fcd2`였다. requestedType DTO·parser 변경 및 회신 문서는 working tree 변경/미추적 파일에도 존재한다. 이는 해당 변경이 커밋·운영 배포됐다는 근거가 아니다. 사용자 전달 상태와 동일하게 로컬 구현·운영 미배포로 기록한다. 백엔드 파일은 수정하지 않았고 테스트·API 호출·DB 작업·배포도 실행하지 않았다.

모바일에서는 현재 D-Day 타입/API·목표 색상·로컬 순서, Task DTO, Quick Capture 요청·mock과 완료 Task 기반 돌아보기를 대조했다. 새 Goal/Plan/여정 API를 호출하는 클라이언트와 `linkedGoalId/requestedType` 필드는 아직 없다. 진행 중인 날짜 갱신 코드도 이 문서 반영과 구분한다.

## 상태를 바꾼 항목

| 항목                          | 기존 모바일 문서                       | 이번 기준                                                                                                     |
| ----------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Goal/Plan/실천/직접 기록/여정 | 요청 전달 후 구현·배포 미확인          | 백엔드 운영 image 6cdc9e5 배포·목표 기능 smoke 완료 **보고**; 로컬 계약·controller도 존재 확인. 모바일 미연동 |
| 목표 schema                   | 적용 확인 필요                         | 백엔드 migration 10-12/14/15/16 적용 완료 보고. 실제 개인 시스템 이관은 미실행                                |
| 배포 metadata/CORS            | 옛 3bda00c와 commitSha=local 확인 대기 | 새 image/full SHA·readiness·공개 Web origin CORS 확인 완료 **보고**. 직접 재호출 안 함                        |
| requestedType                 | 미전달·미합의 추가 요청                | 해당 요청에 대한 회신 도착·로컬 구현/통합 테스트 완료 보고. 제품 합의·커밋/배포·모바일/mock 연결은 남음       |
| AI                            | 전체 계약 대기                         | 네 API 기반 배포·비활성 503 보고. 제공자 adapter/보관·삭제 정책 미완료                                        |
| Goal 색상/G-06 순서           | 요청/별도 추가분 대기                  | 확인한 Goal DTO/controller와 보고에 계약 없음. 독립 회신 항목으로 유지                                        |
| Android/이관/push             | 검증 필요                              | 실제 기기·실제 개인 데이터 이관·push 실수신은 계속 미완료                                                     |

`[x]`는 백엔드 자체 완료 범위에만 적용한다. production Web 항목도 배포/CORS 근거이며 전체 모바일 Web 기능 검증을 대체하지 않는다.

## 프론트가 반영해야 할 주요 계약

### Goal과 기존 D-Day

새 `/api/v1/goals`가 원본이다. Goal은 `targetDate=null`을 허용하며 기존 D-Day의 필수 목표일 제약은 유지한다. `linkedDdayGoalId`는 선택적인 대응 관계다. Goal ID와 D-Day ID가 같다고 가정하지 않고 기존 `ddayGoalId`와 새 Task `linkedGoalId`도 구분한다. 모든 기존 D-Day/Task가 자동 이관됐다고 보지 않는다.

목표 생성/수정/조회, 상태, 사용자 확인 달성/취소와 미래 계획 유지/정지 정책을 새 클라이언트에 연결한다. 계획/목표 수정 후 과거 snapshot을 유지해야 한다. 기존 화면의 날짜 필수를 새 Goal에서도 강제하지 않는다.

### 여러 실행 계획과 회차

`/goals/{goalId}/plans`, `/goal-plans`, `/goal-plan-occurrences`를 사용한다. 회차 조회는 양끝 포함 1~31일이다. 기본·최소·미분류 실천과 휴식은 서로 다른 원본 상태이며 동시에 저장할 수 없는 전환/취소 규칙과 version 충돌을 반영한다. 선택 요일은 각각의 회차이며 기간 내 임의 N회 엔진으로 확장해서 표현하지 않는다.

회차 조회는 생성과 연결 Task 정리를 포함할 수 있다. 실천/휴식 결과와 연결 Task 완료/재개 동작을 함께 고려해 오늘 화면과 캐시를 갱신한다. 같은 Task와 회차를 독립 실천 두 개로 집계하지 않는다. 회차 알림 키/시각을 기존 Task 알림과 중복 예약하지 않는다.

### 직접 기록과 여정

직접 기록 생성은 Idempotency-Key 필수다. 동일 생성 의도 재시도에서 기록 수정/취소 후에도 최초 기록을 복제하거나 되살리지 않는다. 여정은 `PLAN_OCCURRENCE | TASK_COMPLETION | DIRECT_LOG`와 행동 종류 `STANDARD | MINIMUM | UNKNOWN`을 구분한다.

여정은 명시 기간·timezone·cursor를 사용한다. summary는 전체 범위 원본 기준이며 페이지 일부 개수가 아니다. 원본 변경으로 cursor가 409/70008이면 첫 페이지부터 재조회하고 기존 summary와 섞지 않는다. 회차 조회의 31일 제한을 전체 여정 조회에 잘못 적용하지 않는다. 완료 Task만으로 제공하던 현재 주간 돌아보기를 통합 여정 완료로 취급하지 않는다.

### 빠른 기록 requestedType — 운영 활성화 대기

- 생략/null: 기존 자동 해석, 날짜만 있어도 종일 일정이 될 수 있음.
- TODO+날짜: 시각 구간 없는 계획 TODO. 날짜 없으면 INBOX이며 referenceDate를 자동 계획일로 넣지 않음.
- TODO+시각 또는 지원 주간 반복: 400/10001, 생성 없음. 자동 일정 전환하지 않음.
- IDEA: 날짜/시각/반복 문구를 텍스트로 보존, INBOX.
- SCHEDULE: 날짜/시각/지원 반복이 필요. 근거가 없으면 400/10001.
- `parsed*`는 회신상 제안이 아니라 실제 적용 결과다. 모바일은 계속 저장된 task를 표시 원본으로 사용한다.
- 지원 주간 반복은 실제 RecurrenceSeries와 첫 Task를 저장한다. 모바일 mock도 metadata만 붙이는 것으로 끝내지 않아야 함.
- 날짜 TODO는 `unscheduled=true`여도 계획일이 있을 수 있다. Today 날짜 조회로 구분하며 시각 구간 기반 Calendar 범위 응답에 반드시 포함된다고 가정하지 않음.
- timeout은 최초 key/동일 본문을 재사용한다. 서버의 응답 기록 별도 transaction/프로세스 내부 잠금/24시간 만료 한계를 넘어 완전한 중복 방지를 주장하지 않음.

운영 `6cdc9e5`는 새 필드를 지원하지 않는다. 로컬 타입/mock 준비와 운영 활성화를 분리하고 최종 배포 확인 전 요청을 켜거나, 미지원/실패 시 자동 해석 요청으로 몰래 재생성하지 않는다. 위 TODO 미지원 조합과 날짜 없는 TODO 정책은 제품 확인이 남아 있다.

### 시간대·이관·별도 요청

서버 응답 LocalDateTime은 offset 없는 서울 wall-clock이고, 사용자 timezone 설정/일정 조회 경계는 별도로 지원한다. 현재 모바일의 서울 고정 날짜 구독을 곧바로 전 사용자 timezone 지원으로 표현하지 않는다. 프로필 설정 API·조회 경계·반복 series timezone을 함께 연결해야 한다.

개인 시스템 이관 API는 명시적 선택으로 시스템별 실행하며 자동 데이터 이전이 아니다. 모바일은 현재 해당 시스템 API를 연동하지 않았으므로 이 API를 D-Day 일괄 변환 수단으로 사용하지 않는다. 원본/새 ID mapping·취소/재시도·알림 전환·되돌리기 제약을 먼저 정한다.

색상은 확인한 GoalCreate/Update/Response에 colorKey가 없고 순서 저장 controller도 이번 범위에 없다. 미지원 여부를 서버 전체 탐색의 확정 결과로 과장하지 않고 DTO/응답/동시 수정 계약을 추가로 요청한다. G-06 추가분의 전달 상태는 별도 확인 전까지 미확인으로 남긴다.

## 우선순위와 검증

다음 구현 우선순위는 **Goal DTO/API/mock → 목표 작성/선택·D-Day 대응 → 복수 계획/오늘 회차 → 직접 기록/통합 여정**이다. 일반 Goal 백엔드 전체를 다시 구현 요청하지 않는다. 요청 유형은 배포를 기다리며 준비하고, 색상·순서·AI는 별도 의존성으로 추적한다. 기존 UI 방향과 수동 입력을 유지하며 AI가 준비될 때까지 기본 경험을 막지 않는다.

이번 요청은 문서 반영이다. 프론트/백엔드 실행 코드를 바꾸거나 커밋/푸시하지 않았다. 기존 미커밋 날짜 갱신 작업은 보존했다. 사용자 요청에 따라 테스트·실제 화면 감사·실 API 검증은 계속 보류한다.
