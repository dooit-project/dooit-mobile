# 반복되는 아이콘 정렬 문제의 보정과 회귀 검사

2026-10-24 · `5e6463f` 이후 미커밋 working tree · Web mock/goal-lanes fixture

## 범위와 구현 전 검토

- 목적: 위로 뜬 일정/실행일 아이콘을 보정하고 사용자의 재지적 없이 같은 문제를 점검한다.
- 원본: [패널04](../../design/task-detail-options-2026-10-24/04-context-panel-refined.png), [Today 원본](../../design/goal-lanes-correction-2026-10-21/reference.png), [앞선 계획 정렬 기준](../item-optical-alignment-2026-10-23/README.md)을 직접 확인했다.
- 유지: 선택된 패널 구조, 작은 전체 완료 체크, 일정/실행일 구분, 흰 바탕/목표 레일/네 탭. 새 화면 구조나 backend 계약은 추가하지 않는다.
- 변경: 패널 시안의 정보 행 정렬, 공통 컴포넌트의 개발 Web 측정 표식, 실제 좌표 검사기와 향후 필수 작업 규칙. 실제 앱의 스타일을 전역으로 이동시키지 않는다.
- 도구: Product Design ideate/audit, imagegen 지침, built-in ImageGen 편집, Chrome 확장 실제 DOM/캡처, 저장소 필수 검사.
- 자료: [직전 상세 검토](../task-detail-design-review-2026-10-24/README.md)의 Todoist task view/Things 공식 안내 비교를 재사용했다. 이번에는 경쟁 앱/Figma를 새로 조작하지 않았다.

새 패널 구조는 아직 구현 전이다. [05 보정 이미지](../../design/task-detail-options-2026-10-24/05-context-panel-aligned.png)는 생성 시안이며 아래 실제 앱 캡처와 다르다. 라벨+값 전체 중앙에 일정/실행일 아이콘과 화살표를 맞추고, 제목 체크/체크리스트/추가는 각 제목 줄 중심을 유지했다. 정보 행 높이/간격/상단 조작/체크 크기를 직접 확인했다. 생성 결과는853×1844이며 목표 논리 viewport390×844다. 픽셀 수치를 터치/폰트 검증으로 취급하지 않는다.

## 실제 Web 감사

IAB는 제공된 browser inventory에 없었다. 기존 Chrome 확장 탭의 연결이 끊겨 debugger-not-attached가 발생했다. 같은 Chrome에서 claim/새 탭으로 연결을 복구한 뒤 실제 측정을 완료했다. 로컬 Playwright로 전환하지 않았다. 환경은 `http://localhost:8082`, Chrome 확장, mock API, goal-lanes fixture, 높이844, light, Web 기본 글자 배율이다. 실제 사용자 데이터는 사용하지 않았다.

| 화면    | 실제 캡처                        | 좌표 보고서                        | 검사 결과      |
| ------- | -------------------------------- | ---------------------------------- | -------------- |
| 계획390 | [plan-390.jpg](./plan-390.jpg)   | [plan-390.json](./plan-390.json)   | 5행/3조작 영역 |
| 오늘390 | [today-390.jpg](./today-390.jpg) | [today-390.json](./today-390.json) | 6행/7조작 영역 |
| 오늘320 | [today-320.jpg](./today-320.jpg) | [today-320.json](./today-320.json) | 6행/7조작 영역 |
| 오늘430 | [today-430.jpg](./today-430.jpg) | [today-430.json](./today-430.json) | 6행/7조작 영역 |

행/컨트롤의 실제 좌표를 읽는 표식만 추가했다. 현재 화면은 기하 검사를 통과하고 직접 캡처에서도 계획 종류 아이콘=두 줄 전체 중앙, 오늘 체크=제목 첫 줄 중앙을 확인했다. 상단 메뉴/dooit/문구, 목록 세로 간격, 체크/메타, 추가 버튼, 하단 탭의 크기/높이/겹침도 직접 확인했다. 표식 없는 모든 요소를 자동 검사했다고 주장하지 않는다. 위로 뜬 전체 앱 아이콘을 전역 이동할 근거는 없었다.

## 자동화와 한계

`collect-ui-layout.js`는 표시 중인 행의 좌표/경로/viewport만 수집한다. `check-ui-layout.js`는 정렬 역할, 중심 차이2px 초과, 가로 겹침/넘침, 조작 영역44px 미만, 측정 누락/0행을 실패 처리한다. 실제 텍스트/입력/인증 정보는 기록하지 않는다. 공통 표식은 개발 Web에서만 렌더링하고 native/production에는 추가하지 않는다. 새 의존성은 없다.

AGENTS·구현 가이드·Product Design 정책에 [기본 시각 검사](../../qa/UI_VISUAL_ACCEPTANCE.md)를 연결했다. 앞으로 새 좌표 수집 → 검사 → 실패 수정 → 재측정 → 캡처의 광학적 정렬 검토가 기본이다. 기하 검사기 회귀 테스트는 `validate`에 포함되지만 실제 브라우저 측정은 별도 단계다. 이번 actual CSS 정렬은 이미 맞아 임의 위치 보정을 하지 않았다.

영향 범위: 공통 React Native 컴포넌트 소스는 Android/iOS/Web가 공유하지만 새 표식은 개발 Web 한정이다. Android/iOS 실기기, 글자 확대1.5, dark, 실제 API, 새 패널의 터치/키보드/뒤로가기/초점 복귀는 미확인이다. 기능 변경 없이 개발 표식만 추가한 이번 단위에서 기존 상세 조작 전체를 다시 통과했다고 주장하지 않는다.

검증: 네 실제 JSON 모두 `npm run check:ui-layout` 통과. `npm run validate` 통과(typecheck/lint/format/docs/release static, 117 suites/601 tests, opt-in STG1 제외). 새로운 브라우저 측정과 캡처 확인은 위 표의 범위다. 커밋/푸시는 하지 않았다.
