# Dooit Mobile Docs

이 폴더는 모바일 클라이언트 문서를 관심사별로 나눠 관리한다. 새 문서를 추가할 때는 먼저 아래 분류 중 어디에 속하는지 확인한다.

## 현재 상태를 확인하는 순서

2026-10-25 [Product Design 재감사와 Todoist/Things/Material 공식 패턴 비교](./audits/task-detail-external-review-2026-10-25/README.md)를 추가했다. 새 실제 캡처에서 정렬은 확인했고, 목표 경로/메뉴 이동/불필요한 버리기 확인/날짜 편집 범위/손잡이 동작을 후속 개선으로 남겼다. 이번 변경은 점검·문서이며 구현 완료로 취급하지 않는다.

최신 개발은 [개인 Task 상세 패널 연결](./audits/task-detail-panel-2026-10-24/README.md)이다. 오늘/계획/달력의 목록 맥락을 유지하고 직접 URL에서는 같은 내용의 일반 상세를 제공한다. Web390 source 비교·320/430·입력/초점/관리 동작과606 tests를 확인했다. 아래 패널 시안 단계 표시는 이전 이력이며 native/확대/운영 API는 아직 확인 전이다.

UI 개발은 [디자인 기준과 재사용 프롬프트](./design/DESIGN_IMPLEMENTATION_GUIDE.md)를 시작점으로 삼는다. 정확한 시각 원본·고정 요소·이번 변경 범위를 확인하며 번호만으로 다른 시안을 연결하지 않는다.

2026-10-24 최신 상세 방향은 [목록 위 패널 권장안](./design/task-detail-options-2026-10-24/RECOMMENDED_DIRECTION.md)이다. 작은 체크·실제 일정 우선·내용 중심 배치에 이어 아이콘을 두 줄 전체 중앙으로 맞춘05가 최신 보정 시안이다. 다음은 패널 연결 구현이며 아직 패널은 이미지/문서 단계다. 반복 지적을 막는 [기본 시각 검사](./qa/UI_VISUAL_ACCEPTANCE.md)와 [실제 Web 좌표 검사/캡처](./audits/ui-alignment-regression-2026-10-24/README.md)를 추가했다. 이전 별도 페이지 추천과 ‘일반 목록 제목이 다음’이라는 표시는 당시 이력이다.

2026-10-24 목표 탭과 긴 이름 기준은 `5e6463f`로 커밋했다. 다음 [개인 상세 정렬](./audits/task-detail-alignment-2026-10-24/README.md)을 구현했다(미커밋). 내부 여백·정보 값·추가/관리 행동을 정리하고 Web 체크 상태를 보완했다. 390 전후와 320/430·주요 취소/날짜/체크리스트를 확인했으며, 일반 TaskCard/ScheduleCard의 긴 제목은 다음 단위다. 아래 미커밋 표시는 당시 이력이다.

2026-10-23 공통 버튼 보정은 `3cd3254`로 커밋했다. 이어서 [선택 목표 탭 노출/상태](./audits/goal-tab-visibility-2026-10-23/README.md)를 반영했다(미커밋). 새 목표 생성·전체 목록 선택·폭 변경·키보드·선택 복원과 597 tests를 확인했다. 현재 다음은 개인 상세 정보 축이며 아래 미커밋/다음 단계 표시는 당시 이력이다.

2026-10-23 글자/행·계획 아이콘 보정은 `1192c38`로 커밋했다. 이어서 [공통 버튼 위계와 상태](./audits/button-hierarchy-2026-10-23/README.md)를 반영했다(미커밋). 저장/취소 구분, 일반/작은 라벨 크기, 초점 테두리 공간 고정과 로딩 이름/공간 유지다. Web 전후·주요 폼/취소·592 tests 통과이며 native/실제 로딩 화면은 미확인이다. 현재 다음 단위는 계획 목표 탭 노출/선택 상태다. 앞선 미커밋/다음 버튼 표시는 당시 이력이다.

2026-10-22 사용자 승인으로 목표 목록/상세 시안 보정은 `d714879`, 헤더·문구 보정과 구현 가이드/전체 재검토 기록은 `a3943d2`, [공통 보조 색상](./audits/neutral-text-2026-10-22/README.md)은 `20b9211`로 커밋했다. 이어서 [공통 아이콘](./audits/common-icons-2026-10-22/README.md)을 구현하고 실제 화면/조작을 확인해 `0702a28`로 커밋했다. 10월 23일 [메뉴 아이콘/글자 균형 보정](./audits/drawer-icon-alignment-2026-10-23/README.md)은 `f1f07be`로 커밋했고 같은 조건의 Web 전후와 320px, 카테고리 조작을 확인했다. 아래 감사의 ‘미커밋’은 촬영 당시 상태이며 현재 작업 순서는 로드맵 최신 절을 따른다. 푸시는 진행하지 않았다.

첫 개발 단위인 [상단 헤더와 Today 시작 간격](./audits/header-alignment-2026-10-22/README.md)을 구현하고 Chrome 확장으로 실제 확인했다. 헤더/Drawer wordmark와 본문 최대 폭·간격, 좁은 화면 문구 표시를 보정했다. 다음은 VC-02의 공통 글자/행/버튼 규격이다. 아래 전체 검토 회차의 ‘문서/캡처만 추가’는 당시 이력과 구분한다.

2026-10-23 메뉴 균형 보정은 `f1f07be`로 커밋했다. 이어서 [오늘·계획 글자와 행 정렬](./audits/goal-item-typography-2026-10-23/README.md)을 반영했다(미커밋). 같은 390 전후·320 긴 문구/계획·430 오늘·완료/취소를 확인했고, 다음은 버튼 위계다. 아래/이전 문서의 미커밋 표시는 당시 이력이다.

계획 아이콘이 위로 떠 보인다는 후속 지적은 [두 줄 텍스트 전체 중앙 정렬](./audits/item-optical-alignment-2026-10-23/README.md)로 보정했다. 계획의 첫 줄 정렬을 대체하며 글자/행 변경과 함께 미커밋이다.

2026-10-22 [전체 디자인 완성도 재검토](./design/VISUAL_COHESION_REVIEW_2026-10-22.md)와 [새 실제 Web 캡처·발견 사항](./audits/visual-cohesion-2026-10-22/README.md)을 먼저 읽는다. 상단 dooit와 문구의 비율·정렬, 화면별 공통 규칙을 우선 보정한다. 목표 레일과 네 탭은 유지하고, **공통 헤더/스타일 → 계획·상세 → 작성 → 달력·돌아보기 → 보조 화면** 순서로 진행한다. 이번 회차는 문서/캡처만 추가했으며 앱 코드 변경·커밋·푸시는 하지 않았다.

시각 기준은 [사용자 첨부 원본의 흰 배경·색상 레일](./design/goal-lanes-correction-2026-10-21/README.md)이다. 이전 카드형 ‘3번’ 연결은 구현 측 참조 오류로 정정했다. `479ae87` 이후 수정은 미커밋이며 [10월 21일 동일 내용 실제 Web 비교·검증](./audits/goal-lanes-correction-2026-10-21/README.md)에 기존 Task 완료 유지/취소와 계획·상세 정보 축소의 범위를 기록했다. 새 Goal 회차/주간 여정 전체 연결은 미완료다.

이전 다음 단계였던 작성·편집의 입력 순서와 오류 복귀는 공통 헤더 보정 이후로 조정했다. [로드맵](./product/ROADMAP.md)의 최신 절을 우선하고 [이전 카드형/외부 프론트엔드 자료 기록](./design/soft-goal-surfaces-2026-10-21/README.md)은 과거 이력으로 본다.

2026-10-21 `ddde85b`까지 푸시 후 [앱 전체 실제 UI/UX 감사](./audits/whole-app-2026-10-21/README.md)를 진행했다. [수정 목록과 실행 순서](./product/UI_UX_BACKLOG_2026-10-21.md)의 UX-01–13·QA-01을 다음 작업 기준으로 사용한다. 공통 시각 틀은 유지하고 계획→오늘→목표 기록 연결을 우선한다. 이 전체 감사는 `479ae87`에 커밋했다.

2026-10-21 [선택 시안에 맞춘 공통 UI 보정](./design/VISUAL_SYSTEM_ALIGNMENT_2026-10-21.md)을 이번 UI 커밋에 반영했다. 계획·공통 헤더/탭·글자·아이콘과 영문 문구를 수정하고 실제 Web 캡처를 갱신했다. 아래 F3a-1 기반은 유지하며 실제 오늘 화면 연결은 아직 후속이다.

2026-10-18 백엔드 회신은 [회신 대조와 후속 작업](./integration/BACKEND_HANDOFF_2026-10-18.md)에 반영했다. Goal API는 운영 배포/목표 smoke 완료 보고·모바일 미연동, requestedType은 로컬 구현·운영 미배포다. [최신 연동 현황](./integration/FRONTEND_BACKEND_STATUS.md)과 [로드맵](./product/ROADMAP.md)의 다음 순서를 우선한다.

Goal API 기반 F1과 계획 탭 Goal 관리 F2a는 커밋했다. [반복 계획 관리 F2b-1](./design/GOAL_PLAN_EDITOR_2026-10-19.md)은 `e805059`로 커밋했고 10월 20일 자동 검증·부분 Web 감사를 마쳤다. [오늘 회차 실행 기반 F3a-1](./integration/GOAL_OCCURRENCE_EXECUTION_2026-10-20.md)은 `a246572` 커밋·자동 검증 완료이며 화면은 아직 연결하지 않았다. 다음은 F3a-2 오늘 화면의 목표 묶음·체크·최소 행동·휴식/취소 연결이다. 일회성 목록 필터 G-07은 미전달·미합의이며 native 알림·여정 화면·AI 활성화도 별도 후속이다.

1. [`product/PRD.md`](./product/PRD.md): 현재 제품 범위·구현 상태·제한
2. [`product/ROADMAP.md`](./product/ROADMAP.md): 남은 연동·출시 검증 우선순위
3. [`integration/FRONTEND_BACKEND_STATUS.md`](./integration/FRONTEND_BACKEND_STATUS.md): 현재 API 계약, 프론트 실행 항목과 백엔드 요청
4. [`qa/SMOKE_TEST_LOG.md`](./qa/SMOKE_TEST_LOG.md): 현재 검증 기준선과 알려진 한계
5. [`qa/RELEASE_CHECKLIST.md`](./qa/RELEASE_CHECKLIST.md): 출시 후보 판정 기준

프론트엔드의 화면별 사용자 시나리오와 캡처 근거는 [`product/USER_FLOW_CATALOG.md`](./product/USER_FLOW_CATALOG.md)와 각 `audits/` README에서 확인한다. 오늘 실행 루프의 구현 결정과 제한은 [`product/DAILY_EXECUTION_PRIORITIES.md`](./product/DAILY_EXECUTION_PRIORITIES.md), 좌측 메뉴와 카테고리 탐색 구조는 [`product/NAVIGATION_INFORMATION_ARCHITECTURE.md`](./product/NAVIGATION_INFORMATION_ARCHITECTURE.md)에 정리한다.

## 최신 UI·UX 검토

- [자정·복귀 후 오늘 기준일 갱신](./design/APP_TODAY_ROLLOVER_2026-10-18.md): 공통 날짜 구독·선택 맥락 보존·응답 날짜별 이동/완료 캐시. 미커밋·미검증
- [달력 선택 날짜·표시 범위 정합성](./design/CALENDAR_DATE_SCOPE_2026-10-18.md): 3주에 포함된 달 조회·이전 날짜 placeholder 제거·범위 오류 재시도. `f3ad95a` 커밋·미검증
- [빠른 기록 결과 안내 정합성](./design/QUICK_CAPTURE_RESULT_CONSISTENCY_2026-10-18.md): 실제 저장 원본 기준 안내·중복 제출 잠금, 선택 유형 보존은 백엔드 추가 요청 미전달
- [계정 화면 집중 구성 시안 3개](./design/account-focus-2026-10-17/README.md): 추천 1번 반영, `2cbbb82` 커밋·푸시. 구현 미검증
- [왼쪽 메뉴 밀도·중복 목적지 시안 3개](./design/menu-navigation-2026-10-17/README.md): 추천 2번 진행 승인, 보조 기능 9개·작은 헤더·간결한 행 코드 반영. 구현 미검증
- [돌아보기: 실제 기록을 증거로 보여주는 시안 3개](./design/review-evidence-2026-10-16/README.md): 세 안 비교와 추천 1번 목표별 기록 목록 코드 반영. 구현 미검증
- [메뉴 진입과 탐색 문구 정리](./design/NAVIGATION_CONSISTENCY_2026-10-17.md): 계정 진입·선택 표시·용어 일치, 직접 진입 시 화면 내 복귀 보강. 구현 미검증

- [TO-BE 화면 제안 보드 3개](./design/to-be-2026-10-13/README.md): 주요 화면·하단 탐색·변경 이유를 한눈에 비교하는 계획 이미지. 1번 구조+2번 스타일 조합 선택, 생성 이미지의 보완점도 기록
- [Today 선택안과 재탐색](./design/to-be-2026-10-14/README.md): 목표별 편집 목록을 비교한 뒤 운영 앱 참고 재탐색 1번을 구현 기준으로 선택
- [최신 계획 탭 선택안](./design/plan-navigation-2026-10-15/README.md): 가로 목표 탭·전체 목표·관리 메뉴, 실제 상단 간격 기준과 단계별 구현 상태
- [2026-10-13 화면 필요성·위치 재검토](./product/PRODUCT_ARCHITECTURE_REVIEW_2026-10-13.md): 유명 앱·디자인 자료, 탐색 구조 세 안, 오늘·계획·돌아보기 추천, 페이지별 통합·이동, 프론트/백엔드 경계와 수정 순서
- [2026-10-12–13 실제 화면 감사](./audits/product-architecture-2026-10-12/README.md): 10개 화면, 빈 상태·게스트 제한·날짜 변화와 검증 한계
- [2026-10-12 UI 세부 감사](./audits/ui-structure-2026-10-12/README.md): 하단 탭·작성 dock·달력 밀도·빠른 기록 불일치

시스템 실행 시각안은 사용자가 3번의 제안형 sheet를 선택했다. Today는 운영 앱 참고 재탐색 1번을 선택해 목표별 목록과 네 개 하단 탭 구현을 시작했다. 현재 Today에는 주간 strip이 없다.

## 신규 제품 방향: 목표·실행 계획·실천 여정

- [상단 동기부여 문구와 출처](./product/MOTIVATIONAL_COPY.md): 자체 문장·출처 확인 명언, 수동 교체·재방문 순환과 구현 한계

- [최신 목표·실행 계획·지나온 길](./product/GOAL_JOURNEY_EXPERIENCE.md): 목표·날짜 설정, 여러 반복 계획과 일회성 노력, 이미 한 일 기록, 목표별 여정. 앞선 단일 시스템 제한을 대체
- [목표 중심 백엔드 변경 요청서](./api/API_GOAL_JOURNEY_CHANGE_REQUEST.md): 이미 전달한 요청의 범위 수정본, 2026-10-13 전달 완료·회신 대기

- [매일 행동과 세 원칙 점검](./product/DAILY_SYSTEM_FIT_REVIEW_2026-10-13.md): 운동·영단어의 기존 지원/제약, 가벼운 반복·근거 회고·바람 연결과 순환 동기 문구
- [일상 반복 백엔드 보충 확인서](./api/API_PERSONAL_SYSTEMS_DAILY_CLARIFICATION.md): 시간 없는 반복·선택적 다음 행동·기존 템플릿/자연어 확인, 목표 중심 변경 요청서에서 참조해 전달

- [제품 제안과 프론트엔드 작업 분해](./product/PERSONAL_SYSTEM_EXPERIENCE.md): 사용자 흐름, 기존 기능 재사용, 주요 화면, AI·명언 원칙과 최소 구현 범위
- [백엔드 복사 전달용 요청서](./api/API_PERSONAL_SYSTEMS_REQUEST.md): 이미 전달한 초기 시스템 요청 원본. 단일 시스템 제한은 최신 목표 중심 변경 요청에서 수정
- [로드맵](./product/ROADMAP.md): 계약 확정부터 시각 방향 선택·구현·검증까지의 미완료 작업

Today 프론트 개선은 구현 중이며 목표 여정 전체와 API 합의는 아직 완료되지 않았다.

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

현재 `screenshots/`에는 2026-09-13에 촬영한 mock Web 390×844 기준 실제 화면 PNG가 있다. 촬영일과 기준 커밋은 [`screenshots/README.md`](./screenshots/README.md)와 `manifest.json`에서 관리하며, 대표 캡처는 촬영 후 30일이 되기 전에 갱신한다. 마켓용 편집 이미지는 `marketing/`에 초안으로 생성되어 있으며, 최종 제출 전에는 [`marketing/APP_STORE_ASSETS.md`](./marketing/APP_STORE_ASSETS.md)의 규격에 맞춰 다시 export한다.

`audits/`에는 현재 판단에 필요한 최신 근거만 둔다. 흐름 전체는 `uf-01`~`uf-08`을 기준으로 하고, 별도 audit은 반응형·접근성처럼 UF 캡처에 없는 근거만 유지한다. 현재 UI로 대체된 과거 audit은 Git 이력에서 확인한다.

## 관리 기준

- 앞으로 할 일과 우선순위는 `product/ROADMAP.md`에 둔다.
- 색, 타이포그래피, 컴포넌트, 화면 밀도 결정은 `design/`에 둔다.
- 백엔드 구현이 필요한 요구사항은 모바일 저장소에서는 `api/`나 `integration/`에 계약만 기록한다.
- 실제 검증 결과와 출시 전 체크리스트는 `qa/`에 둔다.
- 화면 캡쳐와 마켓 이미지는 `screenshots/`, `marketing/`에 분리한다.
- 대표 화면 캡처는 30일 미만 상태를 유지하고 UI 변경 시 즉시 갱신한다. `npm run docs:check`로 날짜와 파일 구성을 검사한다.
- 로드맵에는 완료 작업의 세부 연혁을 누적하지 않고 현재 기준선과 미완료 항목만 둔다.
- 오래된 실패·audit 기록은 현재 결정에 필요한 요약만 남기고 원본은 Git 이력에서 확인한다.

## 문서 역할과 갱신 기준

- 제품 기능의 포함·제외와 현재 동작은 `product/PRD.md`에 먼저 반영한다.
- `ROADMAP.md`에는 미완료 작업만 두고, API 배포 상태나 테스트 수치를 복제하지 않는다.
- `DAILY_EXECUTION_PRIORITIES.md`, `WORKSPACE_FOLLOWUP_PRIORITIES.md`, `NAVIGATION_INFORMATION_ARCHITECTURE.md`, `QUICK_CAPTURE_INBOX_UX_PROPOSAL.md`는 기능별 결정·제한의 참고 문서다. 완료된 구현을 신규 작업으로 다시 등록하지 않는다.
- API 계약은 `api/`, 실행 환경별 확인 상태는 `integration/FRONTEND_BACKEND_STATUS.md`에서 관리한다. 확인 날짜가 지난 기록을 현재 운영 상태로 단정하지 않는다.
- 체크리스트는 후보별 검사 기준이고, 통과·실패·미확인 결과는 `qa/SMOKE_TEST_LOG.md`와 audit에 둔다.
- 과거 빌드·화면 근거는 날짜와 당시 환경을 유지한다. 최신 캡처처럼 보이도록 날짜만 바꾸지 않는다.

현재 보완 항목과 신규 기능 후보는 [2026-09-14 전반 검토](./product/PRODUCT_REVIEW_2026-09-14.md)에 정리했습니다.
