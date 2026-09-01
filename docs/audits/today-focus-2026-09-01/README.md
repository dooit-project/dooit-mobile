# 한 가지 실행하기 구현 감사

Last updated: 2026-09-01

## 선택 방향

- Product Design 시각안 3개 중 2번 full-screen 집중 화면
- 선택 시안: [`reference-selected.png`](./reference-selected.png)
- 실제 구현: [`focus-active-final.png`](./focus-active-final.png)
- 완료 상태: [`focus-completed.png`](./focus-completed.png)

## 범위

- Today의 미완료 할 일 row에서 target icon으로 진입
- 선택한 Task 한 개의 제목과 최소한의 보조 정보만 표시
- 완료, 자세히 보기, 집중 모드 나가기
- session-only route state이며 timer·통계·streak·서버 저장은 제외

## 실제 흐름

1. **진입 — 양호**
   - Today row의 `Task 제목, 한 가지 실행하기` 접근성 label로 목적이 명확하다.
   - 일정과 완료 Task에는 집중 진입을 노출하지 않는다.
2. **집중 상태 — 양호**
   - Today tab, week strip과 다른 목록을 숨겨 한 Task만 남긴다.
   - close, 날짜, 집중 안내, Task 제목, 완료 action 순서로 읽힌다.
3. **완료 — 양호**
   - 기존 Task 완료 mutation을 사용하고 성공 후 `Today로 돌아가기`를 primary action으로 바꾼다.
4. **이탈·상세 — 양호**
   - 상단 close와 하단 `집중 모드 나가기`가 모두 안전하게 Today로 복귀한다.
   - `자세히 보기`는 기존 Task 상세로 이동한다.
5. **오류·loading — 양호**
   - Task 조회 loading과 조회·완료 오류를 기존 component로 제공한다.

## 검증

- Web mock · 390×844 · light
- 실제 빠른 기록 → Today 이동 → 집중 진입 확인
- browser console error: 0
- 날짜·metadata presentation 단위 테스트 추가
- `npm run validate`: 83 suites · 430 tests 통과

## 한계

- focus 상태는 서버에 저장하지 않아 앱 재시작·기기 간 이어지지 않는다.
- 실제 Native safe area, dark, font scale 1.5와 screen reader는 후속 검증 대상이다.
- 여러 Task를 한 번에 선택하는 sheet와 예상 소요 시간은 이번 범위에 포함하지 않는다.
