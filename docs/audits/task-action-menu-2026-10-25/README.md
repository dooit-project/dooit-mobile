# R2 · 상세 더보기 팝오버와 본문 위치 유지

2026-10-25 · `c5a2362` 이후 미커밋 변경 · Android/iOS/Web 공통 코드

## 구현 전 검토와 고정 범위

Product Design audit와 저장소 기본 시각 검사/구현 가이드를 적용했다. user-context preflight는 저장 context 없음이었다. 정확한 기준은 [선택05](../../design/task-detail-options-2026-10-24/05-context-panel-aligned.png)이며 원본을 직접 확인했다. [이전 외부 패턴 감사 R2](../task-detail-external-review-2026-10-25/README.md)의 작은 고정 메뉴 권고를 구현한다. 새 페이지/정보 구조 선택이 아니라 기존 세 관리 행동의 배치·닫기 보정이다.

흰 패널·84% 높이·작은 헤더·목표 경로·제목 앞24px 완료 체크/44px 조작 영역·일정/실행일 정보 블록 중앙 정렬·체크리스트는 유지한다. 메뉴 순서는 기록 정보→목표 연결 관리→할 일 삭제다. PC 적응형 배치나 R3–R6을 이번 단위에 섞지 않는다.

공식 자료를 확인한 날은2026-10-25다. [W3C menu button](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/)과 [menu/menubar 키보드 동작](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/)을 버튼의 expanded/haspopup, 처음/마지막 진입, 방향키/Home/End, 선택, Escape 복귀, Tab으로 메뉴를 벗어나는 동작의 근거로 사용했다. [Todoist 공식 Task view](https://www.todoist.com/help/todoist/features/use-the-task-view-to-manage-tasks-in-todoist-eDeRDO0C)의 관리 메뉴 분리는 이전 감사의 자료 참고다. 다른 앱의 실제 조작·Figma 검증 또는 전체 WCAG 준수로 확대하지 않는다.

## 변경

- 공통 `useActionMenu`를 추가하고 `DetailSheet`/`Screen`의 스크롤 바깥 overlay slot에 배치했다. 버튼/host의 실제 상대 좌표를 측정해 오른쪽 정렬하며, 공간이 부족하면 위로 열고 가용 높이 안에서 스크롤한다. 새 의존성은 없다.
- 바깥 누름/Escape/Android Back 처리 시 메뉴가 먼저 닫힌다. Web 초점은 더보기로 돌아온다. 메뉴 항목을 선택하면 기존 관리 내용으로 이동하고 ‘상세로 돌아가기’에 초점을 보낸다. 돌아가기/삭제 취소 후에도 더보기로 복귀한다.
- Web에서 메뉴가 열린 동안 배경 조작은 inert로 막고, native에는 modal/배경 숨김 속성을 제공했다. 화살표/Home/End·Enter/Space·Tab/Shift+Tab은 메뉴 동작을 따른다. 부모 상세의 Escape와 중복 처리하지 않는다.
- 기존 수정/초안 보호·삭제 확인은 유지한다. 영구 삭제나 목표 연결 변경은 실제로 실행하지 않았다.

## 실제 화면 감사

기존 Chrome 확장 연결을 사용했다. IAB가 제공되지 않은 기존 환경을 이어갔으며 Playwright/다른 browser surface로 전환하지 않았다. localhost8082, Web mock/goal-lanes fixture, light, 기본 글자 배율, 오늘/일정2026-10-25다. 실제 브라우저 캡처를 저장하고 각각 직접 열어 확인했다.

| 상태                  | 실제 캡처                        | 결과                                                     |
| --------------------- | -------------------------------- | -------------------------------------------------------- |
| 수정 전390×844 · 닫힘 | [01](./01-before-closed-390.jpg) | 제목 y214.046875                                         |
| 수정 전390×844 · 열림 | [02](./02-before-open-390.jpg)   | 제목 y378.046875,164px 이동                              |
| 수정 후390×844 · 열림 | [03](./03-after-open-390.jpg)    | 제목 y214.046875, 이동0px. 메뉴208×142, x114/y203.046875 |
| 수정 후390×844 · 닫힘 | [04](./04-after-closed-390.jpg)  | 기존 제목·날짜·완료 체크 배치 유지                       |
| 수정 후320×844        | [05](./05-after-open-320.jpg)    | 메뉴 x48–256, 가로 잘림 없음                             |
| 수정 후430×932        | [06](./06-after-open-430.jpg)    | 메뉴 x154–362, 열린 채 resize 후 위치 갱신               |
| 수정 후390×568        | [07](./07-after-open-short.jpg)  | 낮은 화면에서도 세 행동 표시/터치 가능                   |
| 직접 URL1920×907      | [08](./08-direct-open-wide.jpg)  | 일반 상세의 기존720px 본문 유지. 제목 y83→83, 이동0px    |
| 직접 URL320×844       | [09](./09-direct-open-320.jpg)   | 공통 메뉴가 본문과 분리되고 가장자리 안에 표시           |

새 탭은 기본1920×907로 열렸으므로 실측대로 wide로 이름을 정정한 뒤 별도로320×844를 설정/재촬영했다. 기존390 캡처로 잘못 취급하지 않는다. 원본 시안의 예시 설명/체크리스트와 달리 이번 fixture에는 해당 내용이 없어 빈 틀을 표시하지 않는다. 제품 구조 차이로 해석하지 않는다.

실제 조작 확인:

- Enter/Space와 버튼 누름으로 열기, ArrowUp으로 마지막 항목 진입, Home/End/방향키 순환.
- Escape 한 번→메뉴만 닫힘/더보기 초점, 다음 Escape→상세 닫힘/오늘의 원래 항목 초점.
- Tab→상세 닫기, Shift+Tab→수정으로 나가며 메뉴만 닫힘.
- 바깥 메뉴 backdrop 누름→메뉴만 닫힘, 상세 유지/완료 상태 false 유지. 패널 바깥의 특정 좌표 누름은 별도 재현하지 않았다.
- 기록 정보→기존 생성 정보, 목표 연결 관리→기존 D-Day 연결 내용, 삭제→기존 영구 삭제 확인으로 연결. 삭제는 취소했다. 관리 화면 선택 직후 돌아가기 버튼에 초점이 도착했다.
- 기존 Chrome console error0. shadow/pointerEvents deprecation 경고는 남는다.

## 검증과 남은 차이

실제 DOM 기하 검사: [닫힘390](./layout-closed-390.json)은5행/8조작 영역, 메뉴 열림 [390](./layout-open-390.json)/[320](./layout-open-320.json)/[430](./layout-open-430.json)/[낮은 화면](./layout-open-short.json)/[직접 wide](./layout-direct-wide.json)/[직접320](./layout-direct-320.json)은 각각3행/3조작 영역을 검사한다. 아이콘/문자 수직 중심·44px 이상·문서 가로 넘침을 확인한다. 전체 화면 읽기 품질을 기하 검사만으로 승인하지 않는다.

경계 배치/짧은 화면/방향키 순환에 대한 의미 있는 회귀6개를 추가했다. 전체 `npm run validate` 통과:121 suites /643 tests, opt-in STG1개 제외.

남은 항목: 실제 Android/iOS의 Back/VoiceOver/TalkBack/글자 확대·키보드·safe area·dark·운영 API는 미확인이다. native focus 복귀는 접근성 초점 API를 사용하지만 Web 키보드 결과와 동일하다고 주장하지 않는다. 메뉴의 실제 위쪽 반전/긴 내용 스크롤은 단위 검사 범위이며 fixture의 세 항목으로 실제 재현한 상태는 아니다. R3 무변경 dirty 판단→R4 일정 편집→R5 손잡이→R6 초기 초점 순서로 이어간다. 전체 앱 UX 승인은 계속 보류한다.

final result: passed (R2 명시 범위의 실제 Web 감사). 새 변경은 미커밋/미푸시다.
