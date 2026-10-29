# 일정 전용 편집 구현과 실제 감사

2026-10-27 · 기준34d470c 이후 working tree · Android/iOS/Web 공통 클라이언트

## 구현 전 검토와 선택

- 목적/범위: 상세 일정 행에서 날짜/종일/시작/종료만 바꾸고 상세로 복귀. 원문/목표/알림·반복을 유지하며 날짜를 바꾸면 목록/달력도 일치한다.
- 정확한 원본: 사용자 첨부로 확인한 [선택1번](../../design/task-schedule-edit-2026-10-27/01-focused-editor.png)과 요청을 반영한 [보정04](../../design/task-schedule-edit-2026-10-27/04-focused-editor-refined.png). [정확한 보정 입력](../../design/task-schedule-edit-2026-10-27/refinement-prompt.json)을 저장했다. 원본을 직접 열고 보정 이미지를 먼저 생성/확인한 뒤 구현했다.
- 구현 전 실제 증거: [01 전체 폼390](./01-before-full-editor-390.jpg). 일정 행을 눌렀는데 제목 초점/유형/알림·반복/추가 정보까지 나타났다. 선택된 전용 편집으로 범위를 줄인다.
- 유지: 오늘 목표 레일/네 탭·공통 헤더·상세 패널, 상단 전체 수정과 별도 날짜 빠른 변경, 중앙 버리기 확인/dirty, 기존 API/mutation과 공통 token/아이콘/폰트.
- 보정: 잘못된 실행일 고정 안내 삭제, 취소에 중립1px outline, 완료는 primary 한 개. 거대한 enclosing card는 추가하지 않는다. 같은 패널 본문을 전환하고 뒤로/취소는 상세, X는 패널 닫기다.
- 도구: Product Design index/audit/get-context/ideate/image-to-code/design-qa, built-in Image Gen 보정1개, Chrome 확장 browser1. 기존 IAB 접근 실패 뒤 사용하던 같은 브라우저를 유지했고 surface/Playwright로 전환하지 않았다. 저장 context 없음. 새 raster를 앱 자산으로 넣지 않고 기존 AppIcon/공통 UI로 구현했다. Figma/경쟁 앱 직접 조작/외부 전문가 인증은 아니다.

## 공식 자료와 설계 판단

2026-10-27 직접 읽은 [GOV.UK Button](https://design-system.service.gov.uk/components/button/)은 한 주 행동·보조 행동 구분, 명확한 행동 문구와 과도한 버튼을 줄이는 원칙을 제공한다. 취소가 반드시 테두리여야 한다는 규칙은 아니며, Dooit의 흰 면에서 사용자가 경계를 찾기 쉽게 해 달라는 피드백에 맞춘 국소 판단이다. 취소는 중립 글자/흰 면/1px borderStrong·완료는 solid primary, 각48px이며 세로 간격8px다. 공통 Button에 선택적 outline variant를 추가했고 기존 다른 variant는 유지했다.

[Todoist Task view](https://www.todoist.com/help/todoist/features/use-the-task-view-to-manage-tasks-in-todoist-eDeRDO0C)의 Date 속성→날짜·시각 편집을 참고해 일정 행은 관련 입력만 연다. 실제 Todoist 앱을 조작한 감사가 아니다. Material3 문서는 Web 텍스트 열람이 JavaScript 안내만 반환해 세부 사양 근거로 사용하지 않았다. 오류는 직전 WAI/GOV.UK 감사의 필드 가까운 문구·설명 연결·첫 오류 초점을 재사용했다.

## 계약 검토에서 발견한 기능 차이와 수정

로컬 backend HEAD bc55e44의 TaskTxService.updateTxForOwner/applySingleUpdate와 Task.update/applyInitialStatus/getPlannedDate를 읽었다. 미완료 일정의 PUT은 시작일로 targetDate/plannedDate를 갱신하고 예전 날짜 focus를 정리한다. DONE은 날짜 이력/완료 시각을 보존한다. 배포 확인이나 backend 테스트 실행이 아니며 이 저장소에서 backend 파일을 바꾸지 않았다.

1. **이전 mock 날짜 잔류:** applyTaskRequest가 일정 필드만 바꾸고 목록 날짜를 남겼다. 실제 계약처럼 미완료 일정의 상태/목록 날짜/targetDate/order·focus를 갱신하고 DONE 이력은 보존한다. 두 요청을 연속 호출해 부분 성공을 만드는 방식을 추가하지 않았다.
2. **반복 삭제/재생성:** PUT의 recurrence null/생략은 실제 backend에서 시리즈를 제거하지 않으며 non-null 규칙은 거절한다. mock의 삭제/재생성을 이 계약에 맞췄다. 일정 전용 builder는 recurrence·linkedGoalId를 보내지 않으므로 기존 규칙/목표 연결을 보존한다. 이번만은 MODIFIED 예외, 묶음 범위는 각 occurrenceDate를 기준으로 시각/기간을 적용한다. 묶음 범위에서는 날짜 입력을 읽기 전용으로 하고 안내하며, 이번만으로 돌아오면 기존 날짜 초안을 복원한다. scope 전환으로 현재 값이 올바른데 과거 날짜 오류가 남지 않게 해제했다.
3. **알림/기간:** 메뉴 밖83분 같은 원래 시간차도 notifyAt/startAt 차이로 보존한다. off는 다시 켜지 않으며 종일은 기존 당일 알림 정책을 따른다. mock createTask가 notification 값을 누락하던 것도 발견해 보존했다. 여러 날/자정 넘는 일정은 기존 종료 날짜 offset을 유지하고 종료 날짜를 읽을 수 있게 표시한다. 종일 exclusive 종료 기간도 보존한다.
4. **전체 수정의 기존 규칙 재전송:** 제목/시간만 바꿔도 기존 반복 규칙을 다시 보내 API 거절을 받을 수 있었다. 변경하지 않은 규칙은 생략한다. 실제 규칙 변경은 기존 일반 PUT이 지원하지 않으므로 전용 계약 확인/연결은 별도 미해결 후속이다. 화면이 해당 선택지를 제공한다는 이유로 API 지원을 주장하지 않는다.
5. **조회 정합성:** useUpdateTask가 Task/계획(D-Day) 외 하루 계획 집계도 갱신한다. 일정의 targetDate를 별도 목표일로 중복 표시하지 않는다. 해당 목표의 실제 마감 날짜를 없애는 변경이 아니다.

## 구현과 시각 비교

공통 TaskScheduleFields를 기존 TaskForm과 새 TaskScheduleForm이 공유한다. TextField/normalizeScheduleFormInput·AppText/Button/오류 hint/ID를 재사용하고 관련 없는 필드 값을 화면에 숨겨 제출하는 방식으로 만들지 않았다. 새 폼 baseline은 편집 세션에서 고정하고 no-op 저장은 요청 없이 상세로 복귀한다. 값 변경/원문 복원·숨긴 시각·취소/Back과 미저장 보호를 부모와 연결했다. 새 의존성은 없다.

[시안과 최종 실제390 비교11](./11-source-comparison.jpg)을 같은 폭/날짜27일/14:00–14:30/종일off/light로 함께 직접 확인했다. 원본853×1844 PNG를390폭/비율 유지, 구현390×844 CSS/실제 캡처1:1로 비교한다. 비교판의 이미지 외 앱 UI를 합성하지 않았다. 별도 부분 crop 없이390폭에서 필드/취소 경계·완료 글자가 읽힌다. 임시 비교 HTML은 제거했다.

필수 다섯 면: 공통22/30·18/26·16/24·14/20·13/18 글꼴 위계, 필드/하단 간격과48px 버튼, white/primary/neutral token, 기존 아이콘(새 이미지 자산 없음), 원문 제목/날짜와 제거 요청 문구를 확인했다. 시안에 없는 기존96% 패널 뒤 Today34px/손잡이, 입력의 YYYY-MM-DD만 표시, 기존 종일 설명/공통14px 목표 맥락과 경로 chevron, gradient 대신 solid primary는 공통 컴포넌트·기존 패널에 맞춘 명시적 차이다. 제목/유형 등 전체 폼을 다시 넣지 않는다.

초기 [02](./02-focused-first-390.jpg)는 자동 초점의 검은 Back 테두리가 강했다. 새 Back에만 IconButton의 선택적 focus ring을 적용해 pointer 진입에서는 조용하게, 키보드에서는 표시를 유지했다. [최종03](./03-focused-final-390.jpg)으로 재검사했다. 기존 다른 IconButton의 초점 표현은 바꾸지 않았다.

## 단계별 실제 Web 감사

Chrome/localhost8082/mock goal-lanes/light. 날짜2026-10-27 기준. 모든 저장은 개발 mock에서만 수행했다.

1. **전용 편집 진입 — 수정 후 양호:** [03](./03-focused-final-390.jpg). 날짜/종일/시각만 보이고 하단 취소1px 경계·완료 주 행동/Back·X 구분이 유지된다.
2. **입력 오류 — 양호:** [04 320px](./04-error-320.jpg). 존재하지 않는 날짜의 설명·red 경계/초점과 원문 시각 보존. 수정하면 안내가 해제된다. 긴 화면도 저장은 스크롤로 접근 가능하다.
3. **날짜·시각 저장 — 양호:** 27일14:00→29일15:00–15:30 저장 후 [05 상세](./05-saved-detail-390.jpg)/[DOM](./saved-detail.txt)에서 일정·실행일이29일로 함께 바뀌었다. 이전 Today 항목이 사라지고 [06 달력29일](./06-calendar-new-date-390.jpg)에1개 항목/새 시각이 보였다.05의 목표일 중복은 이후 제거했고 최종 DOM에서 없는 것을 재확인했다. 검증 항목은27일14:00로 복원했다.
4. **320/430/짧은 화면 — 양호:** 최종 [10 320](./10-final-320.jpg)/[07 430](./07-focused-430.jpg)/[08 390×568](./08-focused-short-390.jpg)에서 필드·하단 조작이 유지된다. 새 좌표4개 모두2행/9조작 통과. 종일 스위치 그림은40×20이었으나 전체 행350×44로 클릭/키보드 전환하게 보정했고 내부 그림은 aria-hidden 부모 안에 둬 중복 조작을 숨겼다. 단일 접근성 이름/checked와 DOM 숨김은 확인했지만 실제 화면 읽기는 미검증이다.
5. **취소/복귀 — 양호:** [09](./09-unsaved-confirmation.jpg)의 중앙 확인→계속 작성 시 원문 보존. 시각 원문 복원→Back 시 확인 없이 상세, no-op 취소·브라우저 Back도 [일정 행 초점](./back-focus.txt) 복귀. 종일 on/off 시 입력 중 시각을 보존했다. X는 상세 전체 닫기이며 저장 중 비활성/dirty 확인은 기존 보호를 재사용한다.

개발 중 API 모듈 HMR 뒤 이전 store를 참조해 저장이 되돌아 보이는 상태가 있어, 초안 없는 Today에서 같은 브라우저를 reload한 뒤 위 저장 흐름을 재현했다. 재로드 후 새 날짜 상세/Today/달력이 일치한 결과만 저장 증거로 채택했다. 짧은 화면의 개발 갱신 표시가 남은 캡처도 재촬영했다. 이런 개발 환경 복구를 사용자 저장 실패 검증으로 취급하지 않는다.

## 검증과 미확인 범위

unit/회귀는 원문·메뉴 밖 알림 시간차/off·자정/여러 날·종일 exclusive/오류, mock 단일 PUT의 이전·새 날짜/DONE/반복 보존과 범위, 폼 dirty/no-op/오류 수정/범위 초안·종일 복원, 하루 계획 캐시 갱신을 확인한다. 기존 mock null=반복 해제 기대는 backend 코드에 맞춰 보존 기대로 바꿨다.

전체 `npm run validate`129 suites/693 tests 통과(opt-in STG1개 제외). 로그 `/private/tmp/dooit-schedule-20261027.log`. [console](./console.json)은 error0·기존 shadow/pointerEvents deprecation2종이다. 시각 없는 Today TODO의 제목 수정도 날짜/상태를 보존하는 회귀를 확인했다. 공통 필드를 사용하는 [전체 수정12](./12-shared-full-editor-390.jpg)에서도 기본 구조와 입력/두 속성 행/저장 접근을 다시 확인했다.

미확인은 Android/iOS 실제 기기·키보드/safe area·font scale1.5·스크린 리더/dark·운영 배포 API/알림 전달·느린 저장/실제 실패·다중 실제 반복 회차의 화면 확인이다. 반복 범위와 여러 날은 이번 unit/mock 계약 범위이며 실제 native/서버 사용 성공이라고 확장하지 않는다. 브라우저에서 확인하지 않은 항목은 통과로 기록하지 않는다.

전체 수정의 실제 반복 규칙 변경은 별도 후속이며 R4의 기존 규칙 보존과 구분한다. 다음 시각 이슈 R5 손잡이/R6 일반 상세의 첫 읽기 초점도 이번 완료 범위 밖이다. 현재 코드/문서는 미커밋·미푸시다.
