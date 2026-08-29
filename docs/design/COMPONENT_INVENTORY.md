# Component Inventory

Dooit Mobile의 공통 UI 컴포넌트와 주요 도메인 컴포넌트 사용 기준을 정리한다. 새 화면을 만들거나 기존 화면을 고칠 때 같은 역할의 UI가 화면마다 다르게 보이지 않도록 이 문서를 기준으로 선택한다.

## 원칙

- 새 UI를 만들기 전에 기존 컴포넌트로 표현할 수 있는지 먼저 확인한다.
- 같은 역할은 같은 컴포넌트와 같은 밀도를 사용한다.
- 한 화면 안에서 `Card`, `row`, `InlineNotice`, `Button`이 과하게 중첩되지 않게 한다.
- 44pt 이상 touch target, focus outline, screen reader label을 유지한다.
- 색상은 장식보다 의미 구분에 사용한다.

## 공통 레이아웃

| 컴포넌트        | 위치                                   | 역할                                | 주요 사용처                          | 주의점                                     |
| --------------- | -------------------------------------- | ----------------------------------- | ------------------------------------ | ------------------------------------------ |
| `Screen`        | `src/components/ui/screen.tsx`         | safe area, scroll, max width        | 거의 모든 화면                       | 하단 composer, tab bar, keyboard 겹침 확인 |
| `PageHeader`    | `src/components/ui/page-header.tsx`    | 화면 제목, 설명, leading/action     | Today, Calendar, Profile, 상세 화면  | Today/Calendar/Profile의 제목 계층을 통일  |
| `SectionHeader` | `src/components/ui/section-header.tsx` | section 제목, count, action, marker | Today, D-Day, Completed, 정리할 항목 | marker 색은 의미 기반으로 제한             |

## 기본 UI

| 컴포넌트       | 위치                                  | 역할                      | 주요 사용처                         | 사용 기준                                |
| -------------- | ------------------------------------- | ------------------------- | ----------------------------------- | ---------------------------------------- |
| `AppText`      | `src/components/ui/app-text.tsx`      | typography와 tone 통일    | 모든 화면                           | 임의 font size 대신 variant 우선         |
| `Button`       | `src/components/ui/button.tsx`        | 명시적 action             | 폼 제출, retry, 보조 action         | primary는 핵심 CTA에만 사용              |
| `IconButton`   | `src/components/ui/icon-button.tsx`   | icon-only action          | 뒤로 가기, 월 이동, overflow        | 항상 accessibility label 필요            |
| `Card`         | `src/components/ui/card.tsx`          | 묶음 surface              | form, detail section, 일부 상태     | 목록 row를 전부 큰 card로 감싸지 않음    |
| `InlineNotice` | `src/components/ui/inline-notice.tsx` | 오류, 경고, 성공 feedback | API 오류, 저장 성공, 일부 실패      | 너무 자주 뜨면 목록 흐름을 끊는지 확인   |
| `EmptyState`   | `src/components/ui/empty-state.tsx`   | 빈 상태와 다음 행동 안내  | Today, Calendar, Search, D-Day      | 큰 illustration 대신 짧은 문구 유지      |
| `ListSkeleton` | `src/components/ui/list-skeleton.tsx` | 목록 loading              | Today, Search, Completed, 정리 화면 | 실제 row 높이와 크게 다르지 않게 사용    |
| `FadeInView`   | `src/components/ui/fade-in-view.tsx`  | 짧은 등장 animation       | feedback notice 등                  | reduced motion 정책과 충돌하지 않게 제한 |

## Task와 일정

| 컴포넌트               | 위치                                             | 역할                    | 주요 사용처                                    | 사용 기준                                 |
| ---------------------- | ------------------------------------------------ | ----------------------- | ---------------------------------------------- | ----------------------------------------- |
| `TaskCard`             | `src/features/tasks/task-card.tsx`               | TODO/완료 row           | Today, Completed, Calendar, D-Day, 정리할 항목 | 기본 실행 항목은 이 컴포넌트 우선         |
| `ScheduleCard`         | `src/features/tasks/schedule-card.tsx`           | 일정 row                | Today, Calendar 선택 날짜 목록                 | 일정은 Task와 다르게 시간 metadata를 강조 |
| `TodayTaskList`        | `src/features/today/today-task-list.tsx`         | Today 실행 목록 wrapper | Today                                          | 정렬/완료 상태를 목록 단위로 다룰 때 사용 |
| `TaskDateQuickActions` | `src/features/tasks/task-date-quick-actions.tsx` | 날짜 빠른 변경 action   | Task 상세                                      | 44pt touch target 유지                    |
| `TaskForm`             | `src/features/tasks/task-form.tsx`               | Task 작성/수정 form     | 새 Task, Task 수정                             | 일정은 날짜·시작·종료 시간을 직접 입력    |

Task row 기준:

- 기본 높이는 60px 리듬을 유지한다.
- checkbox는 보이는 크기보다 hit area가 커야 한다.
- 제목은 최대 2줄, metadata는 1줄을 우선한다.
- trailing action을 넣을 때 제목 영역이 과하게 줄지 않는지 320px에서 확인한다.

## Today

| 컴포넌트            | 위치                                         | 역할                                 | 주의점                                 |
| ------------------- | -------------------------------------------- | ------------------------------------ | -------------------------------------- |
| `TodayWeekStrip`    | `src/features/today/today-week-strip.tsx`    | 주간 mini calendar                   | 경계 제거, 월 경계·일정 dot 확인       |
| `TodayOverview`     | `src/features/today/today-overview.tsx`      | 일정, 오늘 할 일, 정리, 완료 section | 첫 viewport에서 핵심 목록이 보여야 함  |
| `QuickCapture`      | `src/features/today/quick-capture.tsx`       | 하단 빠른 기록 composer/FAB          | keyboard, safe area, tab bar 겹침 확인 |
| `TodayReviewScreen` | `src/features/today/today-review-screen.tsx` | 지난 미완료, 추천, 기록함 정리       | action copy가 실제 동작과 맞아야 함    |

Today 기본 순서:

```text
TodayWeekStrip
→ 일정
→ 오늘 할 일
→ 정리할 항목
→ 최근 완료 3개
→ QuickCapture
```

## Calendar

| 컴포넌트                  | 위치                                             | 역할                      | 주의점                                       |
| ------------------------- | ------------------------------------------------ | ------------------------- | -------------------------------------------- |
| `WeekCalendar`            | `src/features/calendar/week-calendar.tsx`        | Calendar 3주 planner 화면 | 이름은 기존 유지지만 현재 planner 역할       |
| `CalendarSingleDayLabels` | `src/features/calendar/calendar-period-bars.tsx` | 하루 일정 label           | 날짜 cell 밖 overflow 금지                   |
| `CalendarPeriodBars`      | `src/features/calendar/calendar-period-bars.tsx` | 여러 날 일정 bar          | 주 경계 clipping과 `+N` 동작 확인            |
| `CalendarDayTasks`        | `src/features/calendar/calendar-day-tasks.tsx`   | 선택 날짜 목록            | Calendar grid와 날짜 기준 일치               |
| `calendar-layout.ts`      | `src/features/calendar/calendar-layout.ts`       | 7열 width/boundary helper | Today strip과 Calendar grid가 같은 기준 사용 |

Calendar 기준:

- grid는 항상 7열을 유지한다.
- 오늘 dot은 현재 날짜 표시이며 일정 존재 표시로 쓰지 않는다.
- 하루 일정과 기간 일정은 색과 위치로 구분하되 cell을 침범하지 않는다.
- 일정이 많으면 cell을 복잡하게 만들지 않고 `+N`과 선택 날짜 목록으로 넘긴다.

## Profile과 보조 화면

| 컴포넌트/화면       | 위치                                            | 역할                                      | 주의점                                     |
| ------------------- | ----------------------------------------------- | ----------------------------------------- | ------------------------------------------ |
| `ProfileOverview`   | `src/features/profile/profile-overview.tsx`     | 로그인 상태, 목표/검색/완료/설정 shortcut | row 밀도는 Today row와 맞춤                |
| `SearchOverview`    | `src/features/search/search-overview.tsx`       | 통합 검색과 filter                        | real API enum 계약과 mock 결과를 함께 유지 |
| `CompletedOverview` | `src/features/completed/completed-overview.tsx` | 완료 기록                                 | 통계보다 완료 목록을 우선                  |
| `DdayOverview`      | `src/features/dday/dday-overview.tsx`           | D-Day 목표 관리                           | 목표와 연결 Task의 위계 분리               |
| `SettingsOverview`  | `src/features/settings/settings-overview.tsx`   | API·가이드·알림 설정 조합                 | 상태와 action을 section별로 분리           |

## 최초 사용과 알림

| 컴포넌트                       | 위치                                                            | 역할                                | 주의점                                    |
| ------------------------------ | --------------------------------------------------------------- | ----------------------------------- | ----------------------------------------- |
| `FirstUseOverview`             | `src/features/auth/first-use-overview.tsx`                      | 게스트·계정·기능 안내 시작 선택     | 데이터 화면보다 먼저 표시, 설명 강제 금지 |
| `NotificationPermissionPrompt` | `src/features/notifications/notification-permission-prompt.tsx` | 첫 미래 일정 저장 뒤 권한 사전 안내 | 일정 저장은 권한 선택과 무관하게 완료     |
| `NotificationSettingsCard`     | `src/features/notifications/notification-settings-card.tsx`     | 권한 상태·기기 설정·수동 동기화     | 거부 상태에서 OS 권한 요청 반복 금지      |

## 새 화면을 만들 때 선택 순서

1. 화면 전체는 `Screen`으로 시작한다.
2. 제목은 `PageHeader`를 우선 사용한다.
3. 목록 section은 `SectionHeader`와 row list를 사용한다.
4. 실행 항목은 `TaskCard`, 일정은 `ScheduleCard`를 우선 사용한다.
5. 묶음이 필요할 때만 `Card`를 사용한다.
6. 오류, 경고, 성공은 `InlineNotice`를 우선 사용한다.
7. 비어 있는 상태는 `EmptyState`, 로딩 목록은 `ListSkeleton`을 사용한다.
8. icon-only action은 `IconButton`을 쓰고 label을 반드시 넣는다.

## 새 컴포넌트를 만들기 전 확인

- 기존 컴포넌트 variant로 해결할 수 없는가?
- 같은 화면 안에 같은 역할의 UI가 이미 있는가?
- 320px에서 제목과 action이 동시에 유지되는가?
- screen reader label과 keyboard focus가 자연스러운가?
- light/dark와 font scale 1.5에서 깨지지 않는가?
- 문서화가 필요한 새 패턴인가?

## 정리 필요 후보

- `WeekCalendar` 이름은 현재 월간 planner 역할과 어긋난다. 추후 큰 리팩터링 때 `MonthCalendar` 계열로 이름 정리를 검토한다.
- `TaskCard` trailing action의 copy와 폭은 화면별로 조금씩 달라질 수 있으므로, 반복되면 compact row action component로 분리한다.
- `Card`와 flat row의 사용 기준이 흐려지면 화면이 다시 데모 dashboard처럼 보일 수 있으므로 `Card` 사용처를 주기적으로 점검한다.
