# ToDoLab Mobile Docs

이 폴더는 모바일 클라이언트 문서를 관심사별로 나눠 관리한다. 새 문서를 추가할 때는 먼저 아래 분류 중 어디에 속하는지 확인한다.

## 현재 상태를 확인하는 순서

1. [`product/ROADMAP.md`](./product/ROADMAP.md): 구현된 범위와 남은 우선순위
2. [`integration/BACKEND_STATUS_2026-08-27.md`](./integration/BACKEND_STATUS_2026-08-27.md): 완료된 백엔드 요청과 프론트 후속
3. [`qa/SMOKE_TEST_LOG.md`](./qa/SMOKE_TEST_LOG.md): 현재 검증 기준선과 알려진 한계
4. [`qa/RELEASE_CHECKLIST.md`](./qa/RELEASE_CHECKLIST.md): 출시 후보 판정 기준

프론트엔드의 화면별 사용자 시나리오와 캡처 커버리지는 [`product/USER_FLOW_CATALOG.md`](./product/USER_FLOW_CATALOG.md), 최신 화면을 나란히 보는 보드는 [`product/USER_FLOW_BOARD.md`](./product/USER_FLOW_BOARD.md)에서 확인한다.

## 문서 패키지

| 디렉터리                                                      | 역할                                               | 대표 문서                                                                                                              |
| ------------------------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| [`product`](./product/ROADMAP.md)                             | 제품 방향, 로드맵, 우선순위                        | `ROADMAP.md`                                                                                                           |
| [`design`](./design/DESIGN.md)                                | 디자인 시스템, UX 리뷰, 화면 가이드, 컴포넌트 기준 | `DESIGN.md`, `SCREEN_GUIDE.md`, `UX_REVIEW_LOG.md`                                                                     |
| [`api`](./api/API_DATE_TIME.md)                               | 모바일이 요구하거나 참조하는 API 계약              | `API_SEARCH_FILTER.md`, `API_RECURRENCE.md`, `API_PASSWORD_RESET.md`, `API_IDEMPOTENCY.md`, `API_SESSION_LIFECYCLE.md` |
| [`integration`](./integration/BACKEND_INTEGRATION_RUNBOOK.md) | 실제 백엔드 연동 절차와 환경 기준                  | `BACKEND_STATUS_2026-08-27.md`, `BACKEND_INTEGRATION_RUNBOOK.md`, `ANDROID_APK_RUNBOOK.md`, `WEB_SECURITY_POLICY.md`   |
| [`qa`](./qa/RELEASE_CHECKLIST.md)                             | smoke test, release, 접근성, 성능, 플랫폼 품질     | `SMOKE_TEST_LOG.md`, `RELEASE_CHECKLIST.md`                                                                            |
| [`marketing`](./marketing/APP_STORE_ASSETS.md)                | 앱 마켓, 소개 이미지, 문구 산출물                  | `APP_STORE_ASSETS.md`                                                                                                  |
| [`screenshots`](./screenshots/.gitkeep)                       | 실제 앱 화면 캡쳐                                  | 화면별 PNG                                                                                                             |
| [`audits`](./audits/uf-01-first-use-2026-08-23/README.md)     | 최신 사용자 흐름의 화면 근거                       | `uf-01`~`uf-08`, Workspace 반응형·접근성 점검                                                                          |

현재 `screenshots/`에는 mock Web 390×844 기준 실제 화면 PNG가 있다. 마켓용 편집 이미지는 `marketing/`에 초안으로 생성되어 있으며, 최종 제출 전에는 [`marketing/APP_STORE_ASSETS.md`](./marketing/APP_STORE_ASSETS.md)의 규격에 맞춰 다시 export한다.

`audits/`에는 현재 판단에 필요한 최신 근거만 둔다. 흐름 전체는 `uf-01`~`uf-08`을 기준으로 하고, 별도 audit은 반응형·접근성처럼 UF 캡처에 없는 근거만 유지한다. 현재 UI로 대체된 과거 audit은 Git 이력에서 확인한다.

## 관리 기준

- 앞으로 할 일과 우선순위는 `product/ROADMAP.md`에 둔다.
- 색, 타이포그래피, 컴포넌트, 화면 밀도 결정은 `design/`에 둔다.
- 백엔드 구현이 필요한 요구사항은 모바일 저장소에서는 `api/`나 `integration/`에 계약만 기록한다.
- 실제 검증 결과와 출시 전 체크리스트는 `qa/`에 둔다.
- 화면 캡쳐와 마켓 이미지는 `screenshots/`, `marketing/`에 분리한다.
- 로드맵에는 완료 작업의 세부 연혁을 누적하지 않고 현재 기준선과 미완료 항목만 둔다.
- 오래된 실패·audit 기록은 현재 결정에 필요한 요약만 남기고 원본은 Git 이력에서 확인한다.
