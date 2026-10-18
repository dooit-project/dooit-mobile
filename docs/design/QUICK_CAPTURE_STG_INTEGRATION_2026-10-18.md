# 빠른 기록 선택 유형 STG 연동

2026-10-18 · Android/iOS/Web 공통 요청과 mock 연결 · PRD 미배포 · 실제 화면 감사 보류

## 목적과 구현 전 판단

오늘의 추가 메뉴에서 할 일을 고르면 날짜가 있어도 TODO로 저장한다. 기존 TodayCaptureDock → QuickCapture 입력창 → 결과 notice 구조와 버튼 배치는 유지한다. 일정·아이디어 메뉴는 기존 명시적 유형의 Task 작성 화면을 유지하며 자연어 입력 화면으로 통합하지 않는다. 새 화면이나 정보 구조를 만들지 않아 시각안 세 개를 추가하지 않았다.

확인한 원본은 `src/app/(tabs)/index.tsx`, `src/features/today/today-capture-dock.tsx`, `quick-capture.tsx`, 요청 타입·mock·성공 안내 helper와 backend의 `QUICK_CAPTURE_TYPE_CONTRACT.md`다. Product Design index/audit/user-context 지침을 읽었고 저장된 user context는 없었다.

[Material 메뉴 안내](https://m1.material.io/components/menus.html)의 항목별 독립 행동과 선택 즉시 적용 원칙을 참고해, 선택한 할 일을 다른 유형으로 바꾸지 않는 흐름을 유지했다. 이는 구버전 가이드의 행동 패턴 참고이며 최신 규격이나 서비스 실사용 관찰 결과가 아니다. 기존 디자인 토큰과 입력/결과/오류 component를 그대로 사용한다.

## 변경

- `TaskQuickCaptureRequest.requestedType?: TaskType | null` 추가. Today의 할 일 입력은 TODO를 명시하고 API 호출자는 SCHEDULE/IDEA 또는 생략/null도 사용할 수 있다.
- mock은 TODO 날짜를 계획일로만 저장한다. 미래 TODAY는 오늘 목록에서 제외하고 시각 구간 없는 TODO의 unscheduled=true도 서버와 맞춘다.
- TODO 시각/지원 주간 반복, 근거 없는 SCHEDULE, 미지원 유형은 생성 전에 400/10001이다. IDEA는 날짜·시각·반복 문구를 보존한다. 지원 주간 SCHEDULE은 mock task에도 반복 원본을 저장한다.
- 접근성 안내를 날짜는 할 일의 계획일이며 시각/반복은 미지원이라는 정책에 맞췄다. 생성 오류 때 원문 유지와 제출 중 잠금, 실제 저장 task 우선 결과 안내는 기존 동작을 유지한다.
- `npm run web:stg`: localhost:8090 Web → localhost:18080 API. 기존 real/production 설정을 바꾸지 않으며 PRD token과 session을 재사용하지 않는다.
- 전체 검사에서 발견한 기존 Web 탭 아이콘 타입 충돌과 잘못된 glyph 참조를 수정했다. Web 이름과 native SymbolView 이름을 분리하고 checklist는 해당 glyph가 있는 MaterialIcons로 표시한다.

## 검증과 한계

- 타입 검사와 빠른 기록 mock/전달/원본 안내/실제 Today 제출 테스트 통과.
- `npm run test:stg`: 앱의 실제 apiClient/taskApi를 실행하고 native fetch transport만 Node HTTP로 연결한다. 대상은 localhost:18080으로 고정해 PRD 호출을 차단한다. TODO 날짜/미래 목록/IDEA/기존 자동/오류/멱등 재시도를 STG에서 확인하고 만든 Task와 refresh session을 정리했다. 게스트와 멱등성 기록은 STG에 남는다.
- 기본 npm test는 STG 네트워크 테스트를 건너뛴다. 명시적인 test:stg에서만 실행한다.
- 새 캡처를 시도했지만 Computer Use inventory가 Sky native pipe startup failed를 반환했고 iab 및 Chrome도 Browser is not available이었다. 앱 서버는 8090에서 실행 중이다. 실제 화면을 캡처하지 못했으므로 시각·키보드·보조 기술 감사 통과로 기록하지 않는다. 로컬 Playwright 전환은 지침에 따라 사용자 확인을 요청한 상태다.
- Android/iOS 실제 기기, 새 기능 PRD 배포, 실제 사용자 데이터, 외부 STG 도메인은 이번 확인 범위에 포함하지 않는다. PRD image 6cdc9e5는 requestedType을 지원하지 않으므로 모바일 운영 release는 백엔드 PRD 반영 확인 뒤 진행한다.

## 최종 검사 기록

- 다른 미커밋 목표 작업을 제외한 커밋 후보를 별도 임시 index/트리로 추출해 타입·lint, 전체 단위 테스트 102 suite/537개(네트워크 opt-in 1개는 기본 skip), `test:stg` 실 API 1개를 독립 검증했다.
- 작업 트리의 Prettier, 문서 링크, release 정적 검사를 통과했다. Expo Web entry bundle 컴파일과 localhost:18080 주입을 확인했으나 렌더링된 화면을 봤다는 뜻은 아니다.
- `npm run validate`는 기존 canonical screenshot이 2026-09-13 캡처로 35일이 지나 30일 갱신 규칙을 넘긴 단계에서 실패했다. 새 캡처 없이 manifest 날짜를 바꾸지 않았다. 전체 validate 통과로 보고하지 않는다.
- 검사 중 발견한 기존 D-Day render 중 ref 갱신을 effect로 옮겼다. PanResponder.create는 설치된 React Native 소스상 gesture callback을 등록만 하므로 compiler의 두 refs 오탐에만 좁은 제외와 근거를 적었다. 새 회귀 테스트로 render 중 handler 미실행과 최신 disabled/정리 callback을 확인했다. 목표 탭 자동 스크롤의 불필요한 수동 memoization도 정리했다.

## 다음 확인

실제 브라우저에서 할 일 선택 → 오늘/내일 날짜 입력 → 저장 원본/안내/목록 분리, 시각 입력 오류 뒤 원문 유지·재시도·초점 복귀를 확인한다. 이 문서는 캡처가 없는 코드/자료 검토와 API 검증 기록이며 실제 화면 감사 결과가 아니다.
