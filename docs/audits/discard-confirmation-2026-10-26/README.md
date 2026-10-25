# 변경 내용 버리기 · 선택01 구현 감사

2026-10-26 · 기준 `1d42148` 이후 working tree · 구현 후 실제 Web 감사

## 구현 전 검토와 범위

- 이번 단위: 실제 입력 변경을 보호하는 확인을 중앙의 작은 흰 dialog로 분리한다.
- 원본: 사용자가 이번 메시지에 첨부한 [정확한01](../../design/discard-confirmation-2026-10-25/01-centered-decision.png). 853×1844 래스터를390×844 문맥으로 정규화한다. 파일을 직접 열어 확인했다. 기존 경계 없는 버리기 권고보다 최신 사용자 선택의 얇은 경계를 우선한다.
- 유지: Today/네 탭, 상세 sheet/목표 경로, 기존 폼과 dirty 판정, 저장 API, 닫기와 편집 취소의 서로 다른 목적지.
- 변경: 공통 ConfirmDialog, 공통 Button의 선택적 파란 keyboard focus ring/얇은 경계 보조 destructive 표현, 부모 sheet의 중첩 modal 초점 양보, 기존 입력 보호의 확인 표시.
- 범위 밖: 폼 필드/유형 선택 전반, 날짜 전용 편집, 새 정보 구조, 백엔드, 전역 Button 초점 일괄 변경.
- 완료 조건: 같은390×844·같은 임시 입력으로 원본/실제 비교,320/430/짧은 화면, 입력·스크롤·초점 보존, 안전한 닫기/Back, 두 종류 버리기 목적지, 실제 좌표 검사와 필수 validate. Native는 실제 검증 범위를 따로 기록한다.

Product Design index/audit/image-to-code/design-qa와 저장소 구현 가이드/정책을 적용했다. 기존 Expo 앱과 AppText/Button/색·간격 토큰을 사용한다. 신규 의존성·이미지 자산·다른 앱 템플릿은 없다. 저장 user-context는 없었다. 선택 전 생성한3안과 프롬프트는 [시각 비교 문서](../../design/discard-confirmation-2026-10-25/README.md)에 보존한다.

기본 검토: 확인은 실제 입력 손실 가능성이 있을 때만 필요하며 편집 위에서 짧은 결정을 지원한다. 계속 작성을 주 행동으로 두고 버리기는 명시적으로 구분한다. 색 이외의 문구·경계와44 조작 영역을 유지한다. 기존 [편집 감사의 공식 서비스 패턴](../edit-surfaces-review-2026-10-25/README.md)을 재사용하고,2026-10-26 [WAI-ARIA Alert Dialog](https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/)와 [Modal Dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)를 직접 읽었다. 초기 초점은 덜 파괴적인 계속 작성, 배경 비활성, Tab 순환과 안전한 Escape/초점 복귀 조건에 적용한다. 이 자료 참고를 실제 외부 앱 사용이나 Figma 검토로 표현하지 않는다. 새 Figma 파일은 열지 않았다.

## 실제 환경과 진행 상태

Chrome 확장 browser1의 기존 연결을 이어 사용했다. 이전 IAB 연결 불가 이후 복구된 같은 Chrome QA 흐름이며 이번 회차에 local Playwright로 전환하지 않았다. Expo Web `http://localhost:8082`, opt-in mock `goal-lanes` fixture. 운영 API/실제 사용자 입력을 변경하지 않았다. 임시 제목 ‘토익 시험 접수 준비’, 일정2026-10-25 14:00–14:30을 실제 입력 UI에서 맞추고 저장하지 않는다. 현재 실제 날짜는2026-10-26이며 원본의 날짜는 비교용 샘플이다.

## 원본과 실제 비교

[선택 원본과 실제를 같은390×844로 함께 비교](./07-source-vs-actual.jpg)했다. 이 비교판은 원본 PNG와 실제 앱 JPEG를 HTML에서 같은 크기로 표시해 캡처한 것이며 실제 앱을 합성하거나 생성한 화면이 아니다. 임시 비교 HTML은 제품 코드에 남기지 않는다.

- [기본 편집390](./01-editor-390.jpg) → [실제 확인390](./02-confirm-390.jpg). 흰 면·중앙 배치·제목/설명·빨간 글자/얇은 보조 경계·파란 계속 작성·가로 두 버튼을 유지한다. 시안 정규화 폭 약316/높이158, 실제316×158이다.
- 실제 dialog는 viewport의 정확한 중앙(y343, 중심422)에 둔다. 생성 원본은 중심이 약445여서 실제는 약23px 위다. 래스터의 임의 offset은 복제하지 않고 키보드 없는 가용 화면 중앙을 구현 기준으로 삼았다. 이 차이는 구조 변경이 아닌 반응형 위치 보정이다.
- 파란색/빨간색/회색 dim은 기존 semantic token을 쓴다. 원본의 미세한 색 변화/그림자/질감은 복제하지 않는다. 원본 배경의 종료 날짜 필드 등은 생성 이미지의 폼 근사이며 이번에 폼 기능을 추가하지 않는다. 뒤 폼의 간격/레이블과 sheet 위치 차이는 기존 편집 표현의 후속 범위다. 현재 폼을 시안 전체와 픽셀 일치했다고 판정하지 않는다.
- [320](./03-confirm-320.jpg)은280×158, [430](./04-confirm-430.jpg)은316×158이다. 두 조작의 높이는 모두44이며 문구가 한 줄로 읽힌다. [390×568](./05-confirm-short-390.jpg)에서도 두 조작이 보인다. 높이는 고정하지 않아 줄바꿈/스크롤이 가능하나 실제 native font scale1.5 검증은 별도다.
- 포인터로 열 때 불필요한 검정 focus border를 만들지 않는다. 키보드로 이동하면 [파란2px 외곽 초점](./10-keyboard-focus-390.jpg)이 보인다. 이번 선택적 ring을 다른 화면의 Button에 일괄 적용하지 않았다.

## 실제 동작과 좌표

| 확인한 동작                               | 관찰 결과                                                        |
| ----------------------------------------- | ---------------------------------------------------------------- |
| 무변경 수정 폼의 X                        | 확인창 없이 목록으로 복귀, 원래 항목 초점 복원                   |
| 제목/날짜를 변경한 뒤 X                   | 중앙 확인만 표시, 입력란 y·값 유지, 배경 input 모두 inert        |
| 계속 작성 / 확인창 Escape                 | 확인만 닫음, 제목/날짜와 원래 X 또는 취소 버튼 초점 유지         |
| Tab / Shift+Tab                           | 두 행동 안에서 순환, 초기 초점은 계속 작성                       |
| 확인창이 열린 뒤 Chrome Back              | 상세/초안은 유지하고 확인만 닫음                                 |
| 초안 작성 중 Chrome Back → 버리기         | 취소됐던 원래 traversal을 실행, Today와 원래 목록 항목 초점 복귀 |
| 편집 취소 → 버리기                        | 상세는 유지, 원래 값/할 일 수정 버튼 초점 복귀                   |
| 부가 정보 펼침·스크롤 후 취소 → 계속 작성 | scrollTop737.5와 제목 y−560.773px이 전후 동일, 취소 초점 복귀    |
| [직접 주소 상세](./08-direct-url-390.jpg) | 같은 확인창, 계속 작성은 입력 보존, 편집 취소 확정은 상세 유지   |
| [체크리스트 초안](./09-checklist-390.jpg) | 같은 확인창, 계속 작성 후 ‘접수 안내 확인’ 임시 입력 보존        |

배경 클릭의 안전한 취소 콜백과 Android/iOS Modal의 onRequestClose는 회귀 검사로 확인했다. 실제 브라우저 backdrop의 중앙 클릭은 dialog가 덮인 위치를 눌러 동작 증거로 채택하지 않았다. 가장자리 포인터 조작/실제 native Back·키보드·보조 기술은 미확인이다. 의도하지 않은 저장/삭제 요청은 실행하지 않았다.

`check:ui-layout`은 [편집320](./editor-320.json)·[390](./editor-390.json)·[430](./editor-430.json)의 각1행/4조작 영역과 [일반 상세390](./06-detail-390.json)의5행/8조작 영역을 통과했다. 확인창에는 아이콘 행이 없으므로0행 보고서를 해당 검사기의 통과로 위장하지 않았다. 대신 [390](./02-confirm-390.json)·[320](./03-confirm-320.json)·[430](./04-confirm-430.json)·[짧은 화면](./05-confirm-short-390.json)의 별도 실제 DOM 보고서로 두 버튼44 이상·viewport 내 위치·document 가로 넘침 없음·배경 input inert를 검사했다. 캡처에서 광학적 중앙과 문구/면의 위계도 직접 확인했다.

## 자동 검사와 한계

- 새 회귀2개: Android/iOS 시스템 닫기·배경·계속 작성이 확정 콜백을 호출하지 않고 명시적인 버리기만 확정한다. 실제 native 조작 검증을 대신하지 않는다.
- 전체 `npm run validate` 통과:125 suites /662 tests, opt-in STG1개 제외. TypeScript·lint·format·문서·출시 정적 검사 포함. 로그 `/private/tmp/dooit-discard-confirmation-20261026.log`. 임시 비교 HTML 때문에 최초 format 검사에서 멈춘 뒤 해당 파일을 캡처 후 제거하고 전체 검사를 다시 통과했다. 새 의존성은 추가하지 않았다.
- Chrome console error0. 기존 `shadow*`/`props.pointerEvents` deprecation warning2종은 유지되며 이번 코드에서 새 경고를 만들지 않았다.
- 영향 플랫폼: Android/iOS/Web 공통. 실제 감사는 Chrome mock Web만이다. native 키보드·safe area·font scale1.5·VoiceOver/TalkBack·dark·실제 API 실패/저장/로딩은 미확인이다. 이번 확인 결정은 API 요청 없이 실행된다.
- 기존 R3의 새로고침/탭 닫기 수동 확인 제한과 Navigation API 미지원 Web traversal 제한은 그대로 남는다. 이 변경을 새로고침 보호 해결로 표현하지 않는다.
- 폼 유형 segmented control·공통 필드/focus 확장과 R4 날짜 전용 편집은 로드맵 후속이다. 현재 앱 전체 디자인 완료를 뜻하지 않는다.

final result: passed (선택01 확인창의 명시한 실제 Web/회귀 범위). 코드·문서·시안 선택 기록은 미커밋/미푸시다.
