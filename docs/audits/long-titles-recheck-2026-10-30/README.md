# 긴 제목 재검토

2026-10-30 · Product Design audit · Chrome 확장, 로컬 mock Web 320×844

1. [미완료 목록](./01-list-320.png): 30자 연속 영문 스트레스 제목을 세 줄로 읽을 수 있고 설명과 목표가 분리되어 보인다. 조작 영역과 글자가 겹치지 않는다.
2. [완료 목록](./02-done-320.png): 동일 제목의 취소선·완료 시각이 함께 보인다. mock 제목과 완료 상태는 검사 후 원래대로 복원했다.
3. [Things 공식 Today 안내](https://culturedcode.com/things/support/articles/4001304/)는 긴 목록을 프로젝트나 영역으로 묶는 방법을 소개한다. [Google Tasks 공식 안내](https://support.google.com/tasks/answer/7675838?hl=en-GB)는 제목과 상세 정보를 구분한다. 이는 목록의 정확한 줄 수나 현재 앱 화면을 직접 확인한 근거는 아니다. dooit은 기존 목표별 그룹을 유지하고 실행 내용인 제목을 읽을 수 있게 한다.

검토 범위에서 변경을 막는 문제는 발견하지 않았다. 30자 연속 영문은 경계 조건 재현용이며 실제 사용자 문구가 아니다. Android/iOS·글자 확대·긴 일정 기하 검사·모든 목록 경로는 미확인이다. [기존 감사](../long-task-titles-2026-10-29/README.md)의 한계도 유효하다.
