# 좌측 메뉴 smart 진입 감사

Last updated: 2026-09-01

## 목표

좌측 메뉴의 `기록함`과 `오래 미룬 일`이 같은 오늘 계획 첫 화면으로만 이동하지 않고, 사용자가 선택한 범위만 바로 보여 준다.

## 환경

- Expo Web static export
- mock guest · light theme
- viewport: 390×844

## 결과

1. **기록함 — 양호**
   - `/today/review?focus=inbox`로 이동한다.
   - 제목, 설명과 빈 상태가 모두 기록함 맥락을 사용한다.
   - [`inbox-empty.png`](./inbox-empty.png)
2. **오래 미룬 일 — 양호**
   - `/today/review?focus=stale`로 이동한다.
   - 제목, 설명과 빈 상태가 지난 미완료 판단 맥락을 사용한다.
   - [`stale-empty.png`](./stale-empty.png)
3. **통합 오늘 계획 — 유지**
   - focus query가 없으면 기존 먼저 할 일, 지난 미완료, 추천과 기록함을 모두 보여 준다.
4. **복귀 — 양호**
   - 직접 진입 빈 상태에서는 `Today로 돌아가기`를 제공한다.
   - 전용 화면에서 오늘 계획 완료로 오인할 수 있는 action은 노출하지 않는다.

## 검증

- 두 메뉴의 실제 URL과 화면 heading 일치
- browser console error: 0
- focus parsing과 기록함 문구 단위 테스트 추가
- `npm run validate`: 82 suites · 428 tests 통과

## 남은 범위

- 기록함과 지난 미완료 데이터가 여러 개인 상태의 row action은 기존 오늘 계획 감사 근거를 따른다.
- Native screen reader와 Android back, iOS gesture는 실제 기기 후속 검증 대상이다.
