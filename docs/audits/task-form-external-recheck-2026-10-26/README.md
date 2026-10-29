# TaskForm 외부 기준 재검토와 실제 복구 감사

2026-10-26 시작 · 10월27일 완료 · 기준 `34d470c` 이후 working tree

- 대상: 직전 오류 위치·초점 작업을 다시 감사하고, 다음 R4 일정 날짜/시간 편집으로 진행할 수 있는지 확인.
- 도구: Product Design audit/index/get-context/design-qa, Chrome 확장 browser1, 공식 문서 Web 열람. 저장 context 없음. Figma·경쟁 앱 로그인/직접 조작·외부 전문가 인증은 하지 않았다.
- 환경: 같은 Chrome 연결/localhost8082/mock goal-lanes/light. 기본390×844, 좁은320×844, 짧은390×568. 다른 browser surface나 local Playwright로 전환하지 않았다. 자정에 fixture의 10월26일 Today 항목은 사라졌지만 열린 Task 상세의 날짜/시각과 작성 값은 유지됐다. 배경 Today의 일시적 loading이 남은06 캡처는 승인 증거에서 제외한다.
- 원본/유지: [직전 선택안](../../design/task-form-density-2026-10-26/01-property-rows.png), 이번 [기본 화면](./01-normal-390.jpg). 기존 입력/유형/두 속성 행·추가 정보/저장 위치와 API 계약 유지. 변경은 아래 날짜 오류 문구 하나다.

## 공식 자료와 적용 판단

직접 다시 읽은 [WAI 폼 알림](https://www.w3.org/WAI/tutorials/forms/notifications/)의 입력 근처 오류·수정 방법·설명 연결과 [GOV.UK Error message](https://design-system.service.gov.uk/components/error-message/)의 구체적인 안내·잘못된 값도 보존하는 원칙을 비교했다. GOV.UK는 상단 오류 요약도 권장하지만 Dooit의 기존 첫 오류 흐름에 이를 전부 복제하지 않았다. 실제 보조 기술 테스트나 전체 WCAG 적합성 판정은 아니다.

[Todoist Task view](https://www.todoist.com/help/todoist/features/use-the-task-view-to-manage-tasks-in-todoist-eDeRDO0C)의 모바일 Date 속성에서 날짜/시각/기간을 편집하는 패턴은 다음 R4 근거로 확인했다. 서비스 공식 사용 안내를 읽은 자료 비교이며 Todoist 앱 자체를 조작한 감사는 아니다.

## 단계별 실제 결과

1. **기본 편집 — 양호:** [01](./01-normal-390.jpg). 필드/유형/두 요약 행과 저장·취소 위계 유지. 추가 선택 목록이 상시 노출되지 않는다.
2. **날짜 오류 — 수정 후 양호:** [이전02](./02-before-impossible-date-390.jpg)에서2026-02-30을 입력했는데 형식만 안내했다. P2: 형식이 맞아도 존재하지 않는 날짜라는 문제를 설명하지 못했다. 형식 불일치에는 기존 YYYY-MM-DD 안내를 유지하고, 형식이 맞으나 유효하지 않은 날짜에는 ‘존재하지 않는 날짜예요. 일정 날짜를 다시 확인해 주세요.’로 분리했다. [수정03](./03-after-date-error-390.jpg)/[동일390 전후 비교07](./07-date-comparison.jpg)을 직접 확인했다. 문구 외 글꼴·위계/간격/색 token/자산은 유지한다. 입력 아래 red 문구·경계와 [실제 활성 초점/설명 연결](./date-focus.json)이 유지된다. 스크롤에 따른 제목 상단 잘림은 스크롤 상태이며 새 레이아웃 변경이 아니다.
3. **320px — 양호:** [04](./04-date-error-320.jpg). 새 문구는 두 줄로 읽히고 오류 입력과 함께 보인다. 긴 폼의 저장은 기존 세로 스크롤로 접근한다. [새 좌표](./layout-320.json)3행/13조작 통과.
4. **접힌 오류 복구/짧은 화면 — 양호:** [05](./05-duration-recovery-390.jpg). 설명 ‘접수 준비물 확인’/예상 시간1 입력→추가 정보 접기→저장 시 자동 펼침/예상 시간 초점과 문구가 동시에 보임.25로 수정하면 오류 해제, 설명 보존. [새 좌표](./layout-short.json)3행/9조작 통과.
5. **취소/복귀 — 양호:** 실제 중앙 버리기 확인 후 기존 상세/수정 버튼 초점에 복귀했다. 이 감사에서는 Task 저장을 하지 않았다. [console](./console.json)은 error0·기존 shadow/pointerEvents deprecation2종이다.

## 결론과 한계

날짜 오류 설명 P2를 같은 범위에서 수정하고 재캡처했다. 재검토한 정상/오류/좁은 화면/접힌 입력/취소 흐름에서 미해결 P0/P1/P2는 발견하지 않았다. 전체 앱 승인이나 실제 native 적합성 보증이 아니다. Android/iOS 실제 기기·스크린 리더·font scale1.5·dark·운영 API/알림은 미확인이다. 수정 영향은 Android/iOS/Web 공통 일정 검증 문구이며 요청 계약/의존성은 바꾸지 않았다.

다음 단위는 기존 R4의 **일정 행에서 일정 날짜·시작·종료·종일만 편집**이다. 상단 수정은 전체 폼을 유지하고 실행일(plannedDate)과 구분한다. 의미 있는 신규 편집 구조는3안 비교/선택 후 구현한다. 코드/문서는 미커밋/미푸시다.

검사 결과는 최신 design-qa에 기록한다.
