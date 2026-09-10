# Dooit Mobile Docs

이 폴더는 모바일 클라이언트 문서를 관심사별로 나눠 관리한다. 새 문서를 추가할 때는 먼저 아래 분류 중 어디에 속하는지 확인한다.

## 현재 상태를 확인하는 순서

1. [`product/PRD.md`](./product/PRD.md): 현재 제품 범위·구현 상태·제한
2. [`product/ROADMAP.md`](./product/ROADMAP.md): 남은 연동·출시 검증 우선순위
3. [`integration/FRONTEND_BACKEND_STATUS.md`](./integration/FRONTEND_BACKEND_STATUS.md): 현재 API 계약, 프론트 실행 항목과 백엔드 요청
4. [`qa/SMOKE_TEST_LOG.md`](./qa/SMOKE_TEST_LOG.md): 현재 검증 기준선과 알려진 한계
5. [`qa/RELEASE_CHECKLIST.md`](./qa/RELEASE_CHECKLIST.md): 출시 후보 판정 기준

프론트엔드의 화면별 사용자 시나리오와 캡처 근거는 [`product/USER_FLOW_CATALOG.md`](./product/USER_FLOW_CATALOG.md)와 각 `audits/` README에서 확인한다. 오늘 실행 루프의 구현 결정과 제한은 [`product/DAILY_EXECUTION_PRIORITIES.md`](./product/DAILY_EXECUTION_PRIORITIES.md), 좌측 메뉴와 카테고리 탐색 구조는 [`product/NAVIGATION_INFORMATION_ARCHITECTURE.md`](./product/NAVIGATION_INFORMATION_ARCHITECTURE.md)에 정리한다.

## 문서 패키지

| 디렉터리                                                      | 역할                                               | 대표 문서                                                                                                            |
| ------------------------------------------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| [`product`](./product/ROADMAP.md)                             | 제품 방향, 로드맵, 우선순위                        | `ROADMAP.md`                                                                                                         |
| [`design`](./design/DESIGN.md)                                | 디자인 시스템, UX 리뷰, 화면 가이드, 컴포넌트 기준 | `DESIGN.md`, `SCREEN_GUIDE.md`, `UX_REVIEW_LOG.md`                                                                   |
| [`api`](./api/API_DATE_TIME.md)                               | 모바일이 요구하거나 참조하는 API 계약              | `API_DAILY_EXECUTION.md`, `API_SEARCH_FILTER.md`, `API_RECURRENCE.md`, `API_PASSWORD_RESET.md`, `API_IDEMPOTENCY.md` |
| [`integration`](./integration/BACKEND_INTEGRATION_RUNBOOK.md) | 실제 백엔드 연동 절차와 환경 기준                  | `FRONTEND_BACKEND_STATUS.md`, `BACKEND_INTEGRATION_RUNBOOK.md`, `ANDROID_APK_RUNBOOK.md`, `WEB_SECURITY_POLICY.md`   |
| [`qa`](./qa/RELEASE_CHECKLIST.md)                             | smoke test, release, 접근성, 성능, 플랫폼 품질     | `PRODUCT_DESIGN_REVIEW_POLICY.md`, `SMOKE_TEST_LOG.md`, `RELEASE_CHECKLIST.md`                                       |
| [`marketing`](./marketing/APP_STORE_ASSETS.md)                | 앱 마켓, 소개 이미지, 문구 산출물                  | `APP_STORE_ASSETS.md`                                                                                                |
| [`screenshots`](./screenshots/README.md)                      | 실제 앱 화면 캡처와 촬영 기준                      | `README.md`, `manifest.json`, 화면별 PNG                                                                             |
| [`audits`](./audits/uf-01-first-use-2026-08-23/README.md)     | 최신 사용자 흐름의 화면 근거                       | `uf-01`~`uf-08`, Workspace 반응형·접근성 점검                                                                        |

현재 `screenshots/`에는 2026-09-05에 촬영한 mock Web 390×844 기준 실제 화면 PNG가 있다. 촬영일과 기준 커밋은 [`screenshots/README.md`](./screenshots/README.md)와 `manifest.json`에서 관리하며, 대표 캡처는 촬영 후 7일이 되기 전에 갱신한다. 마켓용 편집 이미지는 `marketing/`에 초안으로 생성되어 있으며, 최종 제출 전에는 [`marketing/APP_STORE_ASSETS.md`](./marketing/APP_STORE_ASSETS.md)의 규격에 맞춰 다시 export한다.

`audits/`에는 현재 판단에 필요한 최신 근거만 둔다. 흐름 전체는 `uf-01`~`uf-08`을 기준으로 하고, 별도 audit은 반응형·접근성처럼 UF 캡처에 없는 근거만 유지한다. 현재 UI로 대체된 과거 audit은 Git 이력에서 확인한다.

## 관리 기준

- 앞으로 할 일과 우선순위는 `product/ROADMAP.md`에 둔다.
- 색, 타이포그래피, 컴포넌트, 화면 밀도 결정은 `design/`에 둔다.
- 백엔드 구현이 필요한 요구사항은 모바일 저장소에서는 `api/`나 `integration/`에 계약만 기록한다.
- 실제 검증 결과와 출시 전 체크리스트는 `qa/`에 둔다.
- 화면 캡쳐와 마켓 이미지는 `screenshots/`, `marketing/`에 분리한다.
- 대표 화면 캡처는 7일 이내 상태를 유지하고 UI 변경 시 즉시 갱신한다. `npm run docs:check`로 날짜와 파일 구성을 검사한다.
- 로드맵에는 완료 작업의 세부 연혁을 누적하지 않고 현재 기준선과 미완료 항목만 둔다.
- 오래된 실패·audit 기록은 현재 결정에 필요한 요약만 남기고 원본은 Git 이력에서 확인한다.

## 문서 역할과 갱신 기준

- 제품 기능의 포함·제외와 현재 동작은 `product/PRD.md`에 먼저 반영한다.
- `ROADMAP.md`에는 미완료 작업만 두고, API 배포 상태나 테스트 수치를 복제하지 않는다.
- `DAILY_EXECUTION_PRIORITIES.md`, `WORKSPACE_FOLLOWUP_PRIORITIES.md`, `NAVIGATION_INFORMATION_ARCHITECTURE.md`, `QUICK_CAPTURE_INBOX_UX_PROPOSAL.md`는 기능별 결정·제한의 참고 문서다. 완료된 구현을 신규 작업으로 다시 등록하지 않는다.
- API 계약은 `api/`, 실행 환경별 확인 상태는 `integration/FRONTEND_BACKEND_STATUS.md`에서 관리한다. 확인 날짜가 지난 기록을 현재 운영 상태로 단정하지 않는다.
- 체크리스트는 후보별 검사 기준이고, 통과·실패·미확인 결과는 `qa/SMOKE_TEST_LOG.md`와 audit에 둔다.
- 과거 빌드·화면 근거는 날짜와 당시 환경을 유지한다. 최신 캡처처럼 보이도록 날짜만 바꾸지 않는다.
