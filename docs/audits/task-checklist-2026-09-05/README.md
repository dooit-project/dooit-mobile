# Task Checklist Product Design Audit

- 날짜: 2026-09-05
- frontend 기준: base `2f7faf5` + 현재 작업 트리
- 환경: Expo Web mock, Chrome/Playwright, 390×844, light theme
- 결과: 통과

## 선택한 방향

A안의 펼쳐진 체크리스트를 Task 핵심 정보 바로 아래에 두고, B안의 원형 진행률을 52px 헤더 요소로 결합했다. 원 안의 `완료/전체`와 `N개 남음`만 사용해 가로 progress bar와 중복 수치를 제거했다. 기존 `날짜 빠른 변경`은 체크리스트 다음에 그대로 유지한다.

- 최초 3안: [`options.png`](./options.png)
- 선택 후 결합 시안: [`option-a-circle-refined.png`](./option-a-circle-refined.png)
- 390×844 정규화 기준: [`reference-selected-390x844.png`](./reference-selected-390x844.png)
- 빈 개인 체크리스트: [`00-personal-empty-390x844.png`](./00-personal-empty-390x844.png)
- 2/4 완료 상태: [`01-personal-2-of-4-390x844.png`](./01-personal-2-of-4-390x844.png)
- 항목 행동: [`02-personal-actions-390x844.png`](./02-personal-actions-390x844.png)
- 항목 추가 입력: [`03-personal-add-editor-390x844.png`](./03-personal-add-editor-390x844.png)

## 구현 판정

- 개인 Task 상세에서 체크리스트가 핵심 정보와 날짜 빠른 변경 사이에 항상 펼쳐진다.
- 원형 진행률은 `0/0`, `2/4`, 전체 완료를 수치·보조 문구·접근성 progressbar로 전달한다.
- 생성·완료·재개·제목 수정·삭제·위아래 정렬을 실제 UI로 조작했고 최종 항목 4개가 유지됐다.
- 각 checkbox, 항목 행동, 추가·편집 버튼은 44px 최소 touch target을 사용한다.
- Workspace Task는 목록 밀도를 위해 사용자가 `체크리스트 보기`를 누를 때만 query와 UI를 연다.
- Workspace OWNER·EDITOR는 변경 UI를 사용하고 VIEWER는 `보기 전용 · 변경할 수 없어요`와 항목만 보며 변경 행동은 렌더링하지 않는다.
- Chrome 390×844에서 가로 overflow, 잘림과 console error가 없었다.

## 브라우저 선택

ChatGPT 앱 내장 브라우저가 앞선 검증에서 `Invalid browser service environment`로 연결되지 않아, 사용자가 허용한 로컬 Chrome/Playwright로 실제 viewport를 고정해 검증했다.

## 남은 기기 검증

Workspace VIEWER의 조회·403 계약은 mock API 테스트로 확인했다. OWNER·EDITOR·VIEWER 실제 계정별 화면, Android/iOS font scale 1.5, dark theme, VoiceOver·TalkBack, 키보드와 production API는 release smoke에서 확인한다.
