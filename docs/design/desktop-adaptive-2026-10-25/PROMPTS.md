# PC 시각안 생성 조건

2026-10-25 · built-in ImageGen · 세 독립 결과 · 호출 조건 재현 요약

아래는 실제 긴 tool prompt의 공통 조건과 각 방향의 차이를 정리한 기록이다. 원본 tool prompt와 token 단위로 동일한 문자열은 아니다. 세 호출 모두 다음 실제 로컬 참조를 `referenced_image_paths`로 전달했고 `transparent_background=false`였다.

- `docs/design/desktop-adaptive-2026-10-25/current-wide-1440.jpg`: 현재 PC의 중앙720 제한이 있는 실제 mock 화면, 개선 대상.
- `docs/design/goal-lanes-correction-2026-10-21/reference.png`: 사용자가 선택한 모바일 시각 언어, 유지 기준.
- `docs/audits/task-goal-navigation-2026-10-25/01-detail-390.jpg`: 현재 실제 상세 패널, 정보 위계/아이콘/제어 기준.

## 공통 지시

Transform the attached Dooit references into one independent realistic production-quality desktop web app UI mockup. Target1440×1024, natural viewport ratio, no browser chrome/device frame/presentation board/option label. Use the full white workspace, not a centered mobile app card. Preserve blue dooit, quiet motivation, blue/sage goal rails and dots, small round completion checks. Body16/24, section18/26, detail22/30, caption13/18, text#0F172A, secondary#64748B, blue#006DFF. No giant Today/date/week calendar, task row cards/dividers, scores, percentages, streaks, charts, author attribution or invented filler features. No mobile bottom tabs on desktop.

Keep exactly the current task hierarchy: blue 토익900점받기 with 영단어30개외우기(매일·아침식사후), 토익문제30개풀기(오답까지정리하기), selected 토익시험접수(calendar·오후2:00). Sage 건강한몸만들기 with30분걷기(월·수·금·퇴근후), completed muted struck-through 스트레칭5분(완료). Small group ellipsis, unboxed lists. One primary pale-blue 할일추가 action, not repeated. Inspector shows goal breadcrumb, 수정/more/X, title check, schedule and execution-date rows, brief description and two checklist items. Icons/chevrons center on label+value blocks; check centers on title first line. Date anchor2026-10-25 Sunday Asia/Seoul, schedule14:00–14:30. Use readable Korean copy and focused hero use case, without a feature inventory.

## Workspace Canvas

Fixed approximately232px lightly neutral navigation sidebar: dooit and 오늘/달력/계획/돌아보기, 검색/설정 below. Main list approximately700px including insets; flush-right detail approximately400px with a single understated vertical separator, no bottom-sheet handle or floating shadow. English motivation One step, your pace. Preserve current vertical reading order of goal groups.

## Compact Rail

Fixed slim approximately88px left icon+label rail with four destinations and44px targets; more main workspace width. Header contains small dooit and Small steps, lasting change., discreet search at right. Wide task reading canvas with gutters and flush-right approximately380px inspector. The distinction is narrow navigation rather than a full sidebar.

## Goal Navigator

Left approximately208px sidebar with four destinations plus two goal shortcuts. Main execution workspace shows blue/sage goal groups as two adjacent unboxed columns, approximately410px each. Right approximately340px docked inspector. Keep all areas readable and avoid tiny typography/cards/kanban status dashboards. Motivation One step, your pace. The distinction is simultaneous goal columns, not new functionality.
