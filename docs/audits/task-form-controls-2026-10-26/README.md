# Task 작성·편집 입력과 유형 표현 정돈

2026-10-26 · 기준 `e049f0f` · 구현 전 검토/구현 후 실제 Web 감사

- 이번 단위: 기존 TaskForm의 입력·선택 표현과 초점 안정성 보정.
- 원본: [이번 실제 편집390](./01-before-390.jpg), [이전 선택01](../../design/discard-confirmation-2026-10-25/01-centered-decision.png)의 확인창 고정 요소, [선택 범위](../../design/discard-confirmation-2026-10-25/README.md). 원본은 직접 확인했고 배경 폼을 새 디자인 승인으로 확대하지 않는다.
- 유지: 기존 세 유형의 의미·순서·위치와 inline 단일 선택, 제목/날짜/종일/시간/부가 정보 순서, 선택적 펼침, 취소·저장 API와 dirty 판단, 중앙 확인창과 상세/Today/탭.
- 변경: 공통 TextField의 글자/초점/경계 고정, 기존 세 radio의 한 묶음 표현과 명시적 선택 상태/키보드 조작, TaskForm의 저장/취소 focus ring.
- 범위 밖: 새 화면·선택 modal·접기 단계 변경·다른 폼 일괄 수정, 알림/반복의 요약→편집 구조, R4 날짜 전용 편집, 백엔드.
- 완료 조건: 같은390 전후 및320/430, 세 유형·종일·부가 정보/invalid/dirty 유지, 키보드/초점·44px 검사, 실제 캡처/기하 검사와 전체 validate.

Product Design audit/index/critical-overrides/design-qa, 저장소 정책과 구현 가이드를 적용한다. user-context preflight는 저장 항목 없음이다. [이전 폼 감사 E3/E4/E5](../edit-surfaces-review-2026-10-25/README.md)의 문제를 재현했다. 신규 정보 구조를 선택하는 회차가 아니라 같은 자리의 기존 단일 선택과 필드 표현 보정이다. 새 picker/선택 단계/정보 구조를 만들 경우 세 시각안 선택은 별도로 진행한다.

## 구현 전 실제 관찰

Chrome 확장 browser1의 기존 연결을 이어 Expo Web localhost8082, mock goal-lanes/light/390×844에서 새 캡처했다. 기존 IAB 연결 불가 후 복구된 같은 Chrome 감사 흐름이며 이번에 다른 browser/Playwright로 바꾸지 않았다.

[수정 전 치수](./01-before-390.json): 제목 focus border2/blur border1로 내부 글 시작 위치가 변한다. 입력의 lineHeight는 normal이다. 세 유형은 독립된 경계와 선택 tint를 가지며 실제 Web DOM의 aria-checked는 모두 누락되고 Tab 진입점도 세 개다. 스타일만 바꾸기보다 한 개의 radio group에 checked와 방향키/Space를 연결한다. 입력의 경계는 제거하거나 더 흐리게 만들지 않고 기존 token을 유지한다.

외부 근거: 기존 감사의 Things/Todoist 공식 편집 역할 분리 자료를 재사용한다. 2026-10-26 [WAI-ARIA Radio Group](https://www.w3.org/WAI/ARIA/apg/patterns/radio/)와 [Focus Visible](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html)을 직접 읽었다. 현재 선택으로 Tab 진입, 방향키 단일 선택, Space, 보이는 키보드 초점을 적용한다. 공식 자료 참고이며 외부 앱 직접 조작/Figma 검증은 아니다. React Native의 로컬0.85 타입과 [0.85 공식 outline 문서](https://reactnative.dev/docs/0.85/view-style-props#outlinewidth)를 직접 확인했다. outline은 New Architecture 전용이고 layout 크기에 영향을 주지 않는다. 기존1px border를 유지하고 초점 외곽선만 추가해 안쪽 글 위치를 고정한다. 새 의존성은 추가하지 않는다.

## 구현 결과와 시각 비교

공통 TextField/SegmentedControl을 만들고 TaskForm의 작성·수정에서 사용했다. 다른 폼에 일괄 적용하지 않았다. 기존 제어 값·onChangeText·키보드/길이 제한·multiline·validation/dirty 계산은 유지한다. 제목·날짜·시작/종료·반복 간격·설명·예상 시간·카테고리의8개 입력을 공통화했다. 라벨/선택 문구의 무게는700에서600으로 낮추고 저장/취소에는 기존 공통 Button의 선택적 focus ring을 사용한다.

[같은390×844 실제 전후 비교](./08-before-after.jpg)를 한 입력으로 함께 확인했다. 두 캡처를 HTML에서 같은390 크기로 나란히 표시해 찍은 비교판이며 제품 화면을 합성/생성하지 않았다. 임시 HTML은 제거했다. 초기 비교판의 Expo 개발 갱신 표시는 실제 앱을 다시 캡처해 교체했다.

- [수정 후390](./02-after-390.jpg): 기존 세 유형을 같은 자리에서 한 중립 배경에 묶고 선택된 항목만 흰 면·얇은 경계·파란 글자로 강조한다. 선택된 항목에 실제 checked 상태와 한 개의 Web Tab 진입점도 연결했다.
- 필드 글자는 기존16px에 명시적24px lineHeight를 적용했다. 기존 neutral border/표면/primary token과10 반경을 유지한다. 초점의1px outline은 공간을 차지하지 않는다. [초점 안정성](./focus-stability.json)에서 제목의 x24/y187.766/폭342/높이44/글 시작 x37이 focus 전후 모두 같다. 기존에는 border1→2로 글 시작이1px 움직였다.
- 제목/목표 경로/순서/문구/필드 폭은 그대로다. 유형 option은44px 조작 영역에 안쪽 여백4씩을 더해 그룹 높이가44→52px이다. 따라서 날짜 이후가8px 내려간 것은 의도한 선택 그룹 여백이다. 새 화면·새 선택 단계가 아니다.
- [320](./06-after-320.jpg)과 [430](./07-after-430.jpg)에서 세 유형과 날짜/시간이 읽히고 필드/선택 조작 높이44를 유지한다. 반복 간격은 두 자리 숫자 용도에 맞게88px로 제한해 [320 부가 입력](./09-expanded-320.jpg)에서 단위 문구와 함께 표시한다. 기본 203px 폭을 계속 두지 않는다.
- 폰트/간격/색·token/이미지 품질/문구를 비교했다. 새 이미지/아이콘 자산은 없고 기존 앱 아이콘/텍스트를 사용한다. JPG 치수는 실제390×844/320×844/430×932/390×568로 확인했다. 생성된 확인 원본의 배경 폼을 그대로 재현한 것으로 표현하지 않는다.

## 실제 흐름과 접근성 검사

| 단계                    | 결과/근거                                                                                                                                                                                                             |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. 상세→편집            | 기존 패널 안에서 편집. [수정 전](./01-before-390.jpg)/[후](./02-after-390.jpg)의 목표 경로/제목/입력 축 유지                                                                                                          |
| 2. 유형 단일 선택       | 제목 Tab→현재 일정, ArrowRight→아이디어, ArrowLeft→일정 후 날짜2026-10-26/14:00/14:30 유지. 다음 Tab은 날짜로 이동. Web checked는 false/true/false, tabIndex는 −1/0/−1                                                |
| 3. 원상 복원            | 유형을 원래 일정으로 돌린 뒤 X는 불필요한 확인 없이 Today/원래 항목 초점으로 복귀                                                                                                                                     |
| 4. 새 일정 작성         | Today 추가→일정의 [같은 공통 폼](./03-new-schedule-390.jpg). 빈 제목 저장 비활성, 종일 켜면 시간 숨김/끄면09:00·빈 종료 유지, 취소로 Today 복귀                                                                       |
| 5. 부가 정보/validation | [직접 반복·설명 등](./05-expanded-390.jpg)의8개 입력 유지. 예상 시간1을 입력하고 값 반영을 확인한 뒤 저장하면 [오류 문구/빨간 경계](./04-invalid-duration-390.jpg)와 aria-invalid=true. 값을 지우면 오류/invalid 해제 |
| 6. 짧은 화면/키보드     | [390×568](./10-short-keyboard-390.jpg)에서 스크롤 후 수정 완료까지 Tab 접근, 파란2px focus ring 유지                                                                                                                  |
| 7. 변경 보호 회귀       | 제목 ‘토익 시험 접수 준비’→X의 [기존 중앙 확인](./11-confirmation-390.jpg). 계속 작성은11/30·입력 보존, 편집 취소→버리기는 상세/수정 초점 복귀                                                                        |

처음 화면 밖 duration에 자동 fill을 시도했을 때 입력이 반영되지 않아 동일한 빈 값으로 mock 저장1회가 실행됐다. 이후 화면에 표시된 입력을 먼저 클릭하고 DOM 값1을 확인한 뒤 유효성 오류를 재검증했다. 이 첫 시도를 오류 방지 성공으로 기록하지 않는다. 운영 API는 사용하지 않았고 최종 실제 제목/일정/설명은 초기 fixture 값으로 유지했다.

공통 radio는 native에 기존 checked/disabled를 전달하고 Web에는 명시적 aria-checked·radiogroup과 roving Tab·방향키/Space를 연결한다. Enter는 React Native Web Pressable이 keyup에서 처리하므로 별도 keydown 선택을 중복하지 않는다. 보조키 조합은 가로채지 않는다. Native Tab 진입을 Web처럼 제한하지 않으며 실제 native 하드웨어 키보드/화면 읽기는 미확인이다.

새 실제 `check:ui-layout` 결과:

- 기본 [320](./layout-320.json)·[390](./layout-390.json)·[430](./layout-430.json): 각각1행/11조작 영역.
- 부가 정보 [320](./layout-expanded-320.json):1행/7조작 영역, [390](./layout-expanded-390.json):1행/9조작 영역. 보고서에는 현재 보이는 조작만 포함한다.
- [짧은390](./layout-short-390.json):1행/11조작 영역, [변경하지 않은 일반 상세](./layout-detail-390.json):5행/8조작 영역.
- 별도 [필드/유형320](./06-after-320.json)·[390](./02-after-390.json)·[430](./07-after-430.json) 보고서에서도 가로 넘침 없음, 단일 checked/Tab 진입점, 필드/유형44px 이상을 확인했다. 화면을 직접 보고 글자 중심과 반경/간격도 확인했으며 기하 검사로 미감을 대체하지 않는다.

## 자동 검사와 남은 범위

- 새 회귀9개: 방향키 순환/Home/End·단일 선택/Tab·Space·보조키·저장 중 잠금8개, 실제 TaskForm의 유형별 submit 계약과 날짜/시간 복원1개. 기존 dirty/유효하지 않은 입력12개도 유지한다.
- 전체 `npm run validate` 통과:126 suites /671 tests, opt-in STG1개 제외. TypeScript·lint·format·문서·출시 정적 검사 포함. 로그 `/private/tmp/dooit-task-form-controls-20261026.log`.
- [Console](./console.json) error0, 기존 shadow/pointerEvents deprecation warning2종. 새 의존성·백엔드 변경 없음.
- 영향: Android/iOS/Web 공통 Task 작성·수정. 실제 확인은 Chrome mock Web이다. native font scale1.5/키보드/safe area/VoiceOver·TalkBack/dark·실제 API 오류/느린 저장은 미확인이다. 확대 시 줄바꿈 가능한 구조지만 실제 native 확대 통과를 뜻하지 않는다.
- 알림/반복의 기존 pill 표현·일부 선택 상태/키보드, 첫 오류 필드로의 초점 이동, 다른 Button/IconButton의 전역 초점은 후속이다. 새 요약→선택 화면을 만들면 별도 시각 비교를 한다. 이번 유형/필드의 정돈을 전체 폼/앱 접근성 통과로 확대하지 않는다.
- 기존 R3 새로고침 수동 확인·미지원 Web traversal, R4 일정 전용 편집과 손잡이 동작 등의 이전 미완료도 유지한다.

final result: passed (명시한 기존 TaskForm 표현/실제 Web·회귀 범위). 새 폼 변경은 미커밋/미푸시다. 이전 확인창은 사용자 승인으로 `e049f0f`에 커밋했고 푸시하지 않았다.
