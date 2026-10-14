# Dooit Mobile Roadmap

Last updated: 2026-10-14

현재 단계는 핵심 기능 구현 이후의 연동·출시 검증이다. 제품 범위는 [PRD](./PRD.md), API 배포 상태는 [연동 현황](../integration/FRONTEND_BACKEND_STATUS.md), 확인 결과는 [smoke log](../qa/SMOKE_TEST_LOG.md)에 둔다. 이 문서는 남은 작업의 우선순위만 관리한다.

## P0. Android preview와 운영 API 검증

- [ ] 최신 코드로 Android preview 후보를 갱신하고 versionCode·서명 연속성을 확인한다. 기존 빌드는 FINISHED지만 `81995c5` 기준이라 완료 영역 수정이 없다. 새 키 fingerprint·설치·복구 기준은 기록이 필요하다.
- [ ] 운영 imageTag `3bda00c`와 실제 source SHA·실행 OpenAPI·필수 migration을 같은 배포 기준으로 확인한다. readiness와 배포 식별 검사는 9월 13일 통과했지만 익명 OpenAPI는 403이다.
- [ ] local guest 생성 500과 Workspace 반복 Task의 D-Day 연결 500을 복구한 인스턴스에서 real smoke를 재실행한다. 백엔드 변경은 별도 저장소에서 진행한다.
- [ ] Android에서 Expo Go·Metro 없는 cold start, 게스트·계정 시작, 핵심 개인·Workspace 흐름과 신규 일일 실행 API를 검증한다.
- [ ] APK·frontend/backend 버전·API URL·기기·설치 결과와 최소 하루 사용 결과를 smoke log에 기록한다.

## 전반 검토 후 우선 보완

[실제 화면·코드 근거와 통과 기준](../audits/product-review-2026-09-13/README.md)을 따른다. 아직 수정 완료된 항목은 없다.

- [ ] P0: 자정·앱 활성화·Web 복귀에서 날짜 표시와 조회·저장 기준을 함께 갱신한다.
- [ ] P0: 직접 URL·deep link 진입에서도 뒤로 가기가 안전한 기본 화면으로 돌아가게 한다.
- [ ] P1: 완료·재개 직후 상세·검색·Calendar cache 일관성과 background refetch 실패 시 목록 유지를 확인한다.
- [ ] P1: 오늘 계획의 순서 변경 안내를 현재 동작에 맞추고 focus 선택·순서 UI와 결과 진입 구조를 설계한다.
- [ ] P1: 완료 Task만 있는 날에도 하루 결과를 열 수 있게 한다. 완료 0개 영역 숨김 조건은 유지한다.
- [ ] P1: Task 작성 초안 복구와 계정·Workspace별 저장 격리, 저장 후 제거·로그아웃 정리를 설계한다.
- [ ] P1: 일정 알림·반복 chip과 추가 정보 토글의 터치 영역을 내부 44 기준으로 확인·보완한다.
- [ ] P1: native onlineManager 연결, 수동 재시도 멱등성, 알림 시간대·사전 알림 문구를 재현 검사한다.

## P1. 품질·오류 복구 검증

- [ ] Android에서 320·390·430dp, font scale 1.5, dark mode·키보드 상태를 확인한다. Web light 반응형 근거는 [2026-09-09 audit](../audits/responsive-core-2026-09-09/README.md)에 있다.
- [ ] 승인된 플랫폼에서 VoiceOver·TalkBack, Android back, iOS gesture, safe area·focus 복귀를 확인한다.
- [ ] production Workspace 초대·체크리스트를 OWNER·EDITOR·VIEWER별로 검증한다. local 체크리스트 역할 경계는 통과했다.
- [ ] 비밀번호 재설정 메일·deep link, guest 병합, refresh rotation·reuse, logout을 production에서 확인한다.
- [ ] 로컬 알림의 권한·실제 전달·선택·앱 종료 상태와 중복 방지를 기기에서 확인한다.
- [ ] 생성 mutation timeout·동일 key replay·payload 충돌 409와 네트워크 복구를 real smoke한다.
- [ ] 실제 API 지연·대량 데이터에서 Today·Completed·Calendar 성능을 측정한다.
- [ ] 운영 Web의 CORS·CSP·cache·직접 경로·세션 만료를 검증하고 HttpOnly refresh cookie 운영 여부를 확정한다.
- [ ] 오류 수집 운영 책임자와 Sentry project·DSN을 확정한 뒤 privacy 기준에 맞춰 연결한다.
- [ ] [릴리즈 체크리스트](../qa/RELEASE_CHECKLIST.md)에 후보별 결과를 대조하고 플랫폼별 배포 범위를 확정한다.

## 전반 UI·UX 개선 — Today 재탐색 1번 구현 중

계획의 최신 기준은 [목표별 가로 탭 최종안](../design/plan-navigation-2026-10-15/README.md)이다. 목표 전환·전체 목록·간결한 연결 항목·상단 간격을 먼저 코드에 반영했다(미검증). 다음은 통합 항목 추가, 반복 정의 단위 목록, 목표·항목 순서 관리와 저장 계약이며 기존 API의 지원 범위를 구분해 진행한다.

[화면 필요성·위치 재검토](./PRODUCT_ARCHITECTURE_REVIEW_2026-10-13.md)와 [10개 실제 화면 감사](../audits/product-architecture-2026-10-12/README.md)를 기준으로 진행한다. 사용자는 후속 비교에서 [운영 앱 참고 재탐색 1번](../design/to-be-2026-10-14/TODAY_REFERENCE_INSPIRED_OPTIONS.md)을 선택했다. 목표별 편집 목록, 단일 추가 메뉴, 네 개 하단 탭, 작은 순환 문구와 목표 색상 선택을 먼저 구현한다.

- [ ] U2. 선택한 tab·header·Today 목록·작성 진입과 [계획 탭 선택안](../design/to-be-2026-10-15/README.md)의 실제 화면 감사를 진행하고 세부 밀도를 보정한다. 목표 색상은 서버 계약 전 로컬에 저장하며 이후 계정 동기화 값으로 이전한다. drawer/더보기 중복을 정리하되 기존 목적지·deep link·계정 범위를 보존한다.
- [ ] U3. 빠른 기록의 선택 유형·저장 유형·성공 안내 불일치를 mock/real에서 확인하고 별도 수정한다. API 변경 필요 시 이미 전달한 요청서와 별개의 백엔드 추가 요청을 작성한다.
- [ ] U4. 달력 밀도·범위, D-Day 명칭, 템플릿 진입, icon·용어·게스트 안내를 순차 개선한다. [앞선 UI 감사](../audits/ui-structure-2026-10-12/README.md)의 시각 문제도 추적한다.
- [ ] U5. 대표 screenshots의 30일 갱신 주기에 맞춰 전체 기준 세트를 재촬영한다. 부분 audit 캡처로 대표 세트의 촬영일을 바꾸지 않는다.

## 신규 제품 방향: 목표·여러 실행 계획·실천 여정·동기부여

2026-10-13 구체화한 [목표·실행 계획·지나온 길](./GOAL_JOURNEY_EXPERIENCE.md)이 최신 범위다. 기존 단일 시스템 제한을 대체하며 목표 하나에 여러 반복 계획·일회성 노력·이미 한 일 기록을 포함한다. 현재 출시 검증과 구분하며 아직 구현하지 않았다. 상세 프론트 작업은 [제품 제안](./PERSONAL_SYSTEM_EXPERIENCE.md), 이미 전달한 백엔드 요청의 수정은 2026-10-13 전달한 [목표 중심 변경 요청서](../api/API_GOAL_JOURNEY_CHANGE_REQUEST.md)에서 관리한다.

- [ ] S1. 전달한 [목표 중심 변경 요청서](../api/API_GOAL_JOURNEY_CHANGE_REQUEST.md)를 기준으로 Goal·기존 D-Day 이행·목표 아래 여러 반복 계획·일회성 Task/완료 기록·여정 조회 계약 회신을 받고 확정한다. 기존 요청서의 단일 시스템 제한은 최신 요구와 다르다. 일상 반복 보충 항목도 이 변경 요청에 포함했다.
- [ ] S2. 기존 탐색/스타일 조합과 실행 sheet 선택을 유지하고 목표 생성·상세·계획 작성·추가 노력·전체 기간 여정을 시각 검토한다. 의미 있는 신규 화면 선택지는 비교 후 구현한다.
- [ ] S3. 목표 하나→독립 반복 계획 두 개 이상→기본/최소 실천→추가 Task 완료→이미 한 일 기록→목표별 여정→조정/달성 확인 흐름을 구현한다. 수정/취소·중복 집계·과거 보존 포함. 백엔드 구현은 별도 저장소에서 진행한다.
- [ ] S4. AI 초안·주간 요약과 직접 입력·정형 요약 대체 경로를 연결한다. 조정 AI는 핵심 루프 이후 연결할 수 있다.
- [ ] S5. 정적 응원·출처 확인 명언·잠깐 쉬어가기, 노출 빈도·덜 보기와 로컬 알림을 연결한다. 새 날/4시간 이후 재방문 교체·다른 문장·최근 중복 방지 정책은 일상 행동 점검 문서의 제안을 검토한다. 문구 CMS·서버 push는 제외한다.
- [ ] S6. 실제 화면 감사·Android/iOS/Web·real API 검증과 `npm run validate` 결과를 기록한다.

## 추가 기능 후보

- 완료·날짜 이동 실행 취소: 단일 action부터 원래 상태 복원과 실패 처리 범위를 정한다.
- 카테고리 입력 제안: 기존 개인 summary를 활용하며 CRUD 확대와 분리한다.
- 개인 데이터 내보내기: 장기 사용 수요 확인 뒤 범위·형식·pagination 계약을 정의한다.
- 계정 삭제: iOS Store 준비 시 backend 데이터 삭제·Workspace 소유권·세션 폐기와 함께 설계한다.

선택안과 수용 기준은 [제품 검토](./PRODUCT_REVIEW_2026-09-14.md)에 연결한다. 후보 추가가 구현 승인을 뜻하지 않는다.

## 조건 충족 후 진행

- 미분류 목록 탐색: null-category 검색 계약이 준비된 뒤 활성화한다. 현재 요약 count와 이름 있는 카테고리 탐색은 구현됐다.
- 카테고리 CRUD·정렬: 관리 UX와 삭제 정책을 결정한 뒤 계약을 요청한다.
- 계획·마감 atomic batch: 단건 처리의 부분 실패가 실제로 반복될 때 요청한다.
- 공유 메뉴·iOS widget: 별도 native build에서 인증 bootstrap·cold start·취소·재시도를 검증한 뒤 출시 포함 여부를 결정한다.
- 서버 push: token lifecycle·발송 멱등성·local suppression 검증과 활성화 승인을 거친다.

추가 기능 후보와 제외 범위는 [PRD](./PRD.md), Store·OTA 승격 조건은 [배포 범위 정책](./RELEASE_SCOPE_POLICY.md)를 따른다.
