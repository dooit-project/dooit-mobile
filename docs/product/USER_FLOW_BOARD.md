# ToDoLab 사용자 흐름 보드

Last updated: 2026-08-25

이 문서는 구현과 함께 갱신하는 사용자 흐름의 시각적 원본이다. 전체 시나리오와 미검증 상태는 [`USER_FLOW_CATALOG.md`](./USER_FLOW_CATALOG.md), 화면별 판정과 재현 조건은 각 audit README에서 확인한다.

## 진행 현황

| Flow  | 범위                         | 최신 캡처 | 판정      | 상세 근거                                                                    |
| ----- | ---------------------------- | --------- | --------- | ---------------------------------------------------------------------------- |
| UF-01 | 최초 시작·계정 연결          | 10장      | 보강 필요 | [2026-08-23 audit](../audits/uf-01-first-use-2026-08-23/README.md)           |
| UF-02 | Today 실행·빠른 기록         | 9장       | 보강 필요 | [2026-08-23 audit](../audits/uf-02-today-quick-capture-2026-08-23/README.md) |
| UF-03 | Task 생성·조회·수정·삭제     | 7장       | 보강 필요 | [2026-08-24 audit](../audits/uf-03-task-crud-2026-08-24/README.md)           |
| UF-04 | 반복 Task occurrence         | 7장       | 보강 필요 | [2026-08-24 audit](../audits/uf-04-recurrence-2026-08-24/README.md)          |
| UF-05 | Calendar·검색·완료 기록 탐색 | 10장      | 보강 필요 | [2026-08-25 audit](../audits/uf-05-explore-2026-08-25/README.md)             |
| UF-06 | D-Day 목표                   | 13장      | 보강 필요 | [2026-08-25 audit](../audits/uf-06-dday-2026-08-25/README.md)                |
| UF-07 | Workspace                    | 15장      | 보강 필요 | [2026-08-25 audit](../audits/uf-07-workspace-2026-08-25/README.md)           |
| UF-08 | 설정·알림·세션 복구          | 준비 중   | 누락 큼   | [사용자 흐름 카탈로그](./USER_FLOW_CATALOG.md#uf-08-설정알림세션-복구)       |

## UF-01. 최초 시작과 계정 연결

```mermaid
flowchart LR
  A[최초 시작] --> B{시작 방식}
  B -->|둘러보기| C[기능 소개]
  C --> A
  B -->|로그인 없이 시작| D[게스트 Today]
  D --> E[게스트 계정 안내]
  E --> F[로그인]
  B -->|계정 사용| F
  F -->|입력 오류| F
  F -->|신규 계정| G[계정 만들기]
  F -->|성공| H[계정 연결 완료]
```

| 01 최초 시작                                                                          | 02 기능 둘러보기                                                           | 03 로그인                                                                      | 04 입력 오류                                                                      | 05 계정 만들기                                                                      |
| ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| ![최초 시작](../audits/uf-01-first-use-2026-08-23/01-start.png)                       | ![기능 둘러보기](../audits/uf-01-first-use-2026-08-23/02-feature-tour.png) | ![로그인](../audits/uf-01-first-use-2026-08-23/03-login.png)                   | ![로그인 입력 오류](../audits/uf-01-first-use-2026-08-23/04-login-validation.png) | ![계정 만들기](../audits/uf-01-first-use-2026-08-23/05-register.png)                |
| 06 비밀번호 재설정 직접 경로                                                          | 07 게스트 Today                                                            | 08 게스트 계정 안내                                                            | 09 계정 연결 로그인                                                               | 10 연결 완료                                                                        |
| ![비밀번호 재설정](../audits/uf-01-first-use-2026-08-23/06-password-reset-direct.png) | ![게스트 Today](../audits/uf-01-first-use-2026-08-23/07-guest-today.png)   | ![게스트 계정 안내](../audits/uf-01-first-use-2026-08-23/08-guest-profile.png) | ![게스트 로그인](../audits/uf-01-first-use-2026-08-23/09-guest-login.png)         | ![계정 연결 완료](../audits/uf-01-first-use-2026-08-23/10-account-linked-today.png) |

## UF-02. Today 실행과 빠른 기록

```mermaid
flowchart LR
  A[Today] --> B[빠른 기록 열기]
  B --> C[내용 입력]
  C --> D[저장 성공]
  D --> E[composer 닫기]
  E --> F[최신 기록 preview]
  A --> G[하루 정리]
  A --> H[완료 최근 3개]
  H --> I[전체 보기·접기]
```

| 01 최초 안내                                                                                    | 02 Today 기본                                                                                 | 03 빠른 기록 열기                                                                                  | 04 입력                                                                                           | 05 저장 성공                                                                                        |
| ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| ![Today 최초 안내](../audits/uf-02-today-quick-capture-2026-08-23/01-today-populated.png)       | ![Today 기본](../audits/uf-02-today-quick-capture-2026-08-23/02-today-default.png)            | ![빠른 기록 열기](../audits/uf-02-today-quick-capture-2026-08-23/03-quick-capture-open.png)        | ![빠른 기록 입력](../audits/uf-02-today-quick-capture-2026-08-23/04-quick-capture-filled.png)     | ![빠른 기록 저장 성공](../audits/uf-02-today-quick-capture-2026-08-23/05-quick-capture-success.png) |
| 06 닫은 뒤                                                                                      | 07 하루 정리 여러 항목                                                                        | 08 완료 기본                                                                                       | 09 완료 펼침                                                                                      |                                                                                                     |
| ![composer 닫은 뒤](../audits/uf-02-today-quick-capture-2026-08-23/06-after-composer-close.png) | ![하루 정리 여러 항목](../audits/uf-02-today-quick-capture-2026-08-23/07-review-multiple.png) | ![완료 네 개 접힘](../audits/uf-02-today-quick-capture-2026-08-23/08-completed-four-collapsed.png) | ![완료 네 개 펼침](../audits/uf-02-today-quick-capture-2026-08-23/09-completed-four-expanded.png) |                                                                                                     |

## UF-03. Task 생성·조회·수정·삭제

```mermaid
flowchart LR
  A[새 Task] --> B[추가 정보]
  B --> C[입력 완료]
  C -->|저장| D[Task 상세]
  D --> E[Task 수정]
  E -->|취소·저장| D
  D --> F{삭제 확인}
  F -->|취소| D
  F -->|영구 삭제| G[Today 복귀]
```

| 01 새 Task 기본                                                               | 02 추가 정보                                                                        | 03 입력 완료                                                                            | 04 Task 상세                                                                         |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| ![새 Task 기본](../audits/uf-03-task-crud-2026-08-24/01-new-task-default.png) | ![추가 정보 펼침](../audits/uf-03-task-crud-2026-08-24/02-new-task-more-fields.png) | ![Task 입력 완료](../audits/uf-03-task-crud-2026-08-24/03-new-task-filled.png)          | ![생성된 Task 상세](../audits/uf-03-task-crud-2026-08-24/04-task-detail-created.png) |
| 05 Task 수정                                                                  | 06 삭제 확인                                                                        | 07 삭제 후 Today                                                                        |                                                                                      |
| ![Task 수정](../audits/uf-03-task-crud-2026-08-24/05-task-edit.png)           | ![삭제 확인](../audits/uf-03-task-crud-2026-08-24/06-task-delete-confirm.png)       | ![삭제 후 Today](../audits/uf-03-task-crud-2026-08-24/07-task-deleted-return-today.png) |                                                                                      |

## UF-04. 반복 Task occurrence

```mermaid
flowchart LR
  A[새 반복 일정] --> B[반복 Task 상세]
  B --> C{수정 범위}
  C -->|이번만| D[현재 occurrence]
  C -->|이후 모두| E[현재와 이후]
  C -->|전체| F[반복 묶음 전체]
  B --> G{삭제 범위}
  G -->|이번만| H[현재 occurrence 삭제]
  G -->|이후 모두| I[현재와 이후 삭제]
  G -->|전체| J[반복 묶음 삭제]
```

| 01 반복 기본                                                                                       | 02 매일 반복 입력                                                                       | 03 반복 상세                                                                          | 04 수정 이번만                                                                    |
| -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| ![새 일정 반복 기본](../audits/uf-04-recurrence-2026-08-24/01-new-schedule-recurrence-default.jpg) | ![매일 반복 입력](../audits/uf-04-recurrence-2026-08-24/02-daily-recurrence-filled.jpg) | ![반복 Task 상세](../audits/uf-04-recurrence-2026-08-24/03-recurring-task-detail.jpg) | ![수정 범위 이번만](../audits/uf-04-recurrence-2026-08-24/04-edit-scope-this.jpg) |
| 05 수정 이후 모두                                                                                  | 06 삭제 이번만                                                                          | 07 삭제 전체                                                                          |                                                                                   |
| ![수정 범위 이후 모두](../audits/uf-04-recurrence-2026-08-24/05-edit-scope-future.jpg)             | ![삭제 범위 이번만](../audits/uf-04-recurrence-2026-08-24/06-delete-scope-this.jpg)     | ![삭제 범위 전체](../audits/uf-04-recurrence-2026-08-24/07-delete-scope-all.jpg)      |                                                                                   |

## UF-05. Calendar·검색·완료 기록 탐색

```mermaid
flowchart LR
  A[Calendar] --> B[날짜 선택]
  B --> C{항목}
  C -->|있음| D[예정·완료 목록]
  C -->|없음| E[빈 날짜·일정 추가]
  F[검색] --> G{검색 결과}
  G -->|있음| H[Task 상세]
  H --> F
  G -->|없음| I[조건 초기화]
  J[완료 기록] --> K[날짜 선택]
  K --> L[완료 Task 다시 열기]
  L --> M[완료·주간 집계 갱신]
```

| 01 Calendar 안내                                                           | 02 Calendar 일정 있음                                                               | 03 Calendar 빈 날짜                                                                | 04 검색 기본                                                                    | 05 검색 결과                                                                    |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| ![Calendar 안내](../audits/uf-05-explore-2026-08-25/01-calendar-guide.jpg) | ![Calendar 일정 있음](../audits/uf-05-explore-2026-08-25/02-calendar-populated.jpg) | ![Calendar 빈 날짜](../audits/uf-05-explore-2026-08-25/03-calendar-empty-date.jpg) | ![검색 기본](../audits/uf-05-explore-2026-08-25/04-search-default.jpg)          | ![검색 결과](../audits/uf-05-explore-2026-08-25/05-search-results.jpg)          |
| 06 검색 복원                                                               | 07 검색 결과 없음                                                                   | 08 완료 기록 기본                                                                  | 09 완료 빈 날짜                                                                 | 10 완료 다시 열기                                                               |
| ![검색 복원](../audits/uf-05-explore-2026-08-25/06-search-restored.jpg)    | ![검색 결과 없음](../audits/uf-05-explore-2026-08-25/07-search-empty.jpg)           | ![완료 기록 기본](../audits/uf-05-explore-2026-08-25/08-completed-default.jpg)     | ![완료 빈 날짜](../audits/uf-05-explore-2026-08-25/09-completed-empty-date.jpg) | ![완료 다시 열기](../audits/uf-05-explore-2026-08-25/10-completed-reopened.jpg) |

## UF-06. D-Day 목표

```mermaid
flowchart LR
  A[D-Day 목록] --> B[새 목표]
  B -->|입력 오류| B
  B -->|생성| C[목표 카드]
  C --> D{연결 Task}
  D -->|없음| E[빈 상태]
  E --> F[Today Task 만들기]
  F --> G[연결 Task 목록]
  G --> H[Task 상세·D-Day 표시]
  C --> I{목표 삭제}
  I -->|취소| C
  I -->|영구 삭제| A
  A -->|0개| J[D-Day 빈 상태]
```

| 01 안내                                                                       | 02 목록                                                                           | 03 생성 기본                                                                    | 04 validation                                                                           | 05 생성 입력                                                               |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| ![D-Day 안내](../audits/uf-06-dday-2026-08-25/01-dday-guide.jpg)              | ![D-Day 목록](../audits/uf-06-dday-2026-08-25/02-dday-list.jpg)                   | ![새 목표 기본](../audits/uf-06-dday-2026-08-25/03-dday-create-default.jpg)     | ![생성 validation](../audits/uf-06-dday-2026-08-25/04-dday-create-validation.jpg)       | ![새 목표 입력](../audits/uf-06-dday-2026-08-25/05-dday-create-filled.jpg) |
| 06 생성 완료                                                                  | 07 연결 Task 없음                                                                 | 08 Today Task 생성                                                              | 09 연결 Task 생성 완료                                                                  | 10 연결 Task 상세                                                          |
| ![목표 생성 완료](../audits/uf-06-dday-2026-08-25/06-dday-created.jpg)        | ![연결 Task 없음](../audits/uf-06-dday-2026-08-25/07-dday-linked-tasks-empty.jpg) | ![Today Task 생성](../audits/uf-06-dday-2026-08-25/08-dday-today-task-form.jpg) | ![연결 Task 생성 완료](../audits/uf-06-dday-2026-08-25/09-dday-linked-task-created.jpg) | ![연결 Task 상세](../audits/uf-06-dday-2026-08-25/10-dday-task-detail.jpg) |
| 11 삭제 확인                                                                  | 12 삭제 완료                                                                      | 13 빈 상태                                                                      |                                                                                         |                                                                            |
| ![목표 삭제 확인](../audits/uf-06-dday-2026-08-25/11-dday-delete-confirm.jpg) | ![목표 삭제 완료](../audits/uf-06-dday-2026-08-25/12-dday-deleted.jpg)            | ![D-Day 빈 상태](../audits/uf-06-dday-2026-08-25/13-dday-empty.jpg)             |                                                                                         |                                                                            |

## UF-07. Workspace 초대·일정·목표·멤버

```mermaid
flowchart LR
  A[공간 없음] --> B[공간 만들기]
  B -->|입력 오류| B
  B --> C[OWNER 공간]
  C --> D[공유 일정]
  D -->|추가| E[일정 관리]
  C --> F[공유 D-Day]
  F -->|추가| G[목표 카드]
  C --> H[멤버]
  H -->|초대| I[발송 완료]
```

| 01 공간 없음                                                                           | 02 공간 생성 기본                                                                       | 03 공간 validation                                                                          | 04 공간 입력 완료                                                                           | 05 공간 생성 완료                                                                    |
| -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| ![공간 없음](../audits/uf-07-workspace-2026-08-25/01-workspace-empty.jpg)              | ![공간 생성 기본](../audits/uf-07-workspace-2026-08-25/02-workspace-create-default.jpg) | ![공간 validation](../audits/uf-07-workspace-2026-08-25/03-workspace-create-validation.jpg) | ![공간 입력 완료](../audits/uf-07-workspace-2026-08-25/04-workspace-create-filled.jpg)      | ![공간 생성 완료](../audits/uf-07-workspace-2026-08-25/05-workspace-created.jpg)     |
| 06 일정 없음                                                                           | 07 일정 form                                                                            | 08 일정 생성 완료                                                                           | 09 D-Day 없음                                                                               | 10 D-Day form                                                                        |
| ![일정 없음](../audits/uf-07-workspace-2026-08-25/06-workspace-tasks-empty.jpg)        | ![일정 form](../audits/uf-07-workspace-2026-08-25/07-workspace-task-form.jpg)           | ![일정 생성 완료](../audits/uf-07-workspace-2026-08-25/08-workspace-task-created.jpg)       | ![D-Day 없음](../audits/uf-07-workspace-2026-08-25/09-workspace-dday-empty.jpg)             | ![D-Day form](../audits/uf-07-workspace-2026-08-25/10-workspace-dday-form.jpg)       |
| 11 D-Day 생성 완료                                                                     | 12 멤버 목록                                                                            | 13 초대 form                                                                                | 14 초대 validation                                                                          | 15 초대 발송 완료                                                                    |
| ![D-Day 생성 완료](../audits/uf-07-workspace-2026-08-25/11-workspace-dday-created.jpg) | ![멤버 목록](../audits/uf-07-workspace-2026-08-25/12-workspace-members.jpg)             | ![초대 form](../audits/uf-07-workspace-2026-08-25/13-workspace-invite-form.jpg)             | ![초대 validation](../audits/uf-07-workspace-2026-08-25/14-workspace-invite-validation.jpg) | ![초대 발송 완료](../audits/uf-07-workspace-2026-08-25/15-workspace-invite-sent.jpg) |

## 갱신 규칙

1. 각 UF의 정상 흐름을 mock Web 390×844에서 먼저 캡처한다.
2. 입력 오류·시스템 오류·권한 제한·복구 상태를 같은 audit 폴더에 추가한다.
3. audit README에 재현 조건과 판정을 기록하고 이 보드의 해당 행과 화면 표를 갱신한다.
4. 화면 구조가 바뀌면 기존 파일명을 유지해 교체하지 않고 검증 날짜가 포함된 새 audit 묶음을 만든다.
5. Android·iOS 전용 권한, 키보드, safe area와 접근성 상태는 플랫폼을 명시해 분리한다.
