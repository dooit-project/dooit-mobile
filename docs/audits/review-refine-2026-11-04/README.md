# 돌아보기 버튼·기록 목록·빈 상태 보정

2026-11-04 · Product Design 사전 검토 후 로컬 Playwright / Chrome mock Web 확인

- 범위: [전체 재검토](../review-full-recheck-2026-11-04/README.md)에서 찾은 작은 버튼 여백, 긴 기록과 상세 진입 단서, 빈 상태 버튼 위계를 보정한다. 목표별 묶음, 주간 탐색, 실제 완료 내용과 상세 경로, 네 탭은 유지한다.
- [320 지난주](./after-previous-320.png): 이번 주 버튼의 좌우 여백을 늘리고 주간 날짜는 한 줄을 유지했다. 시작일과 종료일을 축약한 320 한 줄에는 여전히 짧은 표기가 사용된다. [320 연도 경계](./after-year-320.png)는 두 자리 연도이며 작은 화면에서 구분자 주변이 촘촘하다. 두 화면 모두 이전 화살표 테두리는 테스트 조작 후 초점 표시다.
- 같은 테스트 기록 두 건의 [수정 전 390](../review-full-recheck-2026-11-04/audit-populated-390.png)과 [수정 후 390](./after-populated-390.png)을 비교했다. 날짜를 제목 아래로 옮겨 제목이 한 줄로 읽히고, 작은 화살표로 상세 진입을 표시한다. [320 기록](./after-populated-320.png)은 긴 제목이 두 줄로 표시된다. 기록 행을 눌러 상세를 열고 닫는 경로도 확인했다.
- 빈 주에서 오늘으로 이동하는 동작은 유지하고 공통 outline 버튼으로 강조를 낮췄다. 여전히 복귀 경로를 찾을 수 있는지는 사용자 조사로 확인하지 않았다.
- [빈 주 320](./after-layout-320.json)·[390](./after-layout-390.json)·[430](./after-layout-430.json), [연도 경계 320](./after-year-layout-320.json)의 새 기하 검사는 각 1행 / 4조작 통과. 기록 있는 [320](./after-populated-layout-320.json)·[390](./after-populated-layout-390.json)·[430](./after-populated-layout-430.json)은 각 3행 / 4조작 통과. 실제 캡처에서도 화살표와 텍스트 블록의 중심을 확인했다.
- 사전 검토에서 [Apple 버튼 가이드](https://developer.apple.com/design/human-interface-guidelines/buttons), [Apple Calendar](https://support.apple.com/en-lamr/guide/iphone/iphfd1054569/ios), [Todoist 완료 기록 안내](https://lp-regional-test.todoist.com/help/todoist/features/view-completed-tasks-in-todoist-J19h2s)를 참고했다. 외부 앱 직접 조작은 아니다.
- 브라우저 접근 호스트 장애로 사용자가 이전에 승인한 로컬 Playwright를 사용했다. 동일 날짜의 목표 미연결 테스트 기록 두 건만 확인했다. 여러 목표, 기록 20개 이상, 확대 글자, 스크린 리더, Android/iOS 실기기, 운영 API는 미확인이다. 일부 320 캡처의 검은 번개는 Expo 개발 오버레이다.
