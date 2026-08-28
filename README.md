# ToDoLab

> 생각난 일은 가볍게 기록하고, 오늘 해야 할 일은 선명하게.

ToDoLab은 할 일, 일정, D-Day와 반복 계획을 한 흐름에서 관리하는 크로스플랫폼 플래너입니다.
빠르게 적고 나중에 정리하는 순간부터, 개인 계획을 Workspace에서 함께 실행하는 순간까지 자연스럽게 이어집니다.

<p align="center">
  <strong>Android · iOS · Web</strong><br />
  Expo와 React Native로 만드는 조용하고 명확한 일정 관리 경험
</p>

## 이런 경험을 만들고 있어요

- **빠른 기록** — 날짜가 정해지지 않은 생각도 놓치지 않고 기록함에 저장합니다.
- **오늘에 집중** — 오늘 할 일과 일정, 최근 완료 항목을 한 화면에서 확인합니다.
- **시간을 한눈에** — Calendar, 반복 일정, D-Day로 가까운 계획과 긴 목표를 함께 봅니다.
- **다시 찾기 쉽게** — 검색과 완료 기록으로 과거의 할 일과 일정을 돌아봅니다.
- **함께 계획하기** — Workspace에서 일정, 목표와 멤버 권한을 분리해 관리합니다.
- **끊기지 않는 흐름** — 게스트로 바로 시작하고 필요할 때 계정에 데이터를 연결합니다.

## 화면 미리보기

| 오늘                                                                            | 빠른 기록                                                                                   | 캘린더                                                                                |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| <img src="./docs/screenshots/today.png" width="260" alt="ToDoLab Today 화면" /> | <img src="./docs/screenshots/quick-capture.png" width="260" alt="ToDoLab 빠른 기록 화면" /> | <img src="./docs/screenshots/calendar.png" width="260" alt="ToDoLab Calendar 화면" /> |

| 검색                                                                            | D-Day                                                                          | Task 상세                                                                                 |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| <img src="./docs/screenshots/search.png" width="260" alt="ToDoLab 검색 화면" /> | <img src="./docs/screenshots/dday.png" width="260" alt="ToDoLab D-Day 화면" /> | <img src="./docs/screenshots/task-detail.png" width="260" alt="ToDoLab Task 상세 화면" /> |

화면별 시나리오와 최신 검증 상태는 [사용자 흐름 카탈로그](./docs/product/USER_FLOW_CATALOG.md)와 [사용자 흐름 보드](./docs/product/USER_FLOW_BOARD.md)에서 확인할 수 있습니다.

## 현재 상태

핵심 사용자 기능과 Workspace 일정 공유의 프론트 구현은 대부분 완료됐습니다. 현재는 production 백엔드 계약, 최신 Android APK, 알림과 복구 흐름, 접근성을 실제 환경에서 검증하는 단계입니다.

- 게스트·회원가입·로그인·세션 복구
- Today·Inbox·완료 기록·Calendar·검색
- Task·일정·D-Day·반복 일정·개인 템플릿
- Workspace 생성·초대·역할별 일정과 목표 관리
- 로컬 알림 동기화와 알림 선택 이동
- mock/real API 분리와 Android·iOS·Web 공통 UI

진행 중인 항목과 출시 조건은 [제품 로드맵](./docs/product/ROADMAP.md)에 투명하게 기록합니다.

## 빠르게 실행하기

### 준비물

- Node.js LTS
- npm
- 네이티브 실행 시 Android Studio 또는 Xcode

### 설치

```bash
npm ci
cp .env.example .env.local
```

백엔드 없이 화면과 주요 흐름을 확인하려면 mock Web을 실행합니다.

```bash
npm run web:mock
```

플랫폼별 실행:

```bash
npm run android
npm run ios
npm run web
```

전체 검증:

```bash
npm run validate
```

## API 모드

ToDoLab Mobile은 화면 개발과 실제 백엔드 연동을 명확히 분리합니다.

| 모드   | 용도                                                                 |
| ------ | -------------------------------------------------------------------- |
| `mock` | 백엔드 없이 회원가입, Today, Calendar와 Workspace 흐름을 확인합니다. |
| `real` | `EXPO_PUBLIC_API_URL`에 설정한 실제 API와 통신합니다.                |

`.env.local` 예시:

```dotenv
EXPO_PUBLIC_API_MODE=mock
EXPO_PUBLIC_API_URL=http://localhost:8080
```

> `EXPO_PUBLIC_*` 값은 앱 번들에 포함됩니다. 토큰, 비밀번호, API key 같은 비밀 값은 넣지 않습니다.

실제 백엔드로 Web을 실행할 때:

```bash
npm run web:real -- --port 8090 --clear
```

플랫폼별 로컬 API 주소와 production export 절차는 [백엔드 연동 Runbook](./docs/integration/BACKEND_INTEGRATION_RUNBOOK.md)을 따릅니다.

## 기술 스택

| 영역         | 기술                                     |
| ------------ | ---------------------------------------- |
| App          | Expo SDK 56, React Native 0.85, React 19 |
| Language     | TypeScript 6                             |
| Navigation   | Expo Router                              |
| Server state | TanStack Query                           |
| Platforms    | Android, iOS, Static Web                 |
| Quality      | Jest, ESLint, Prettier, TypeScript       |

## 프로젝트 구조

```text
src/
├── app/         # Expo Router 화면과 route layout
├── components/  # 공통 UI
├── features/    # auth, task, calendar, workspace 등 도메인 기능
├── providers/   # query, 인증 bootstrap, 세션·알림 lifecycle
├── services/    # API client, token, preference 저장
├── theme/       # design token, theme, responsive 기준
├── types/       # API·도메인 타입
└── utils/       # 날짜·일정 공통 로직
```

route는 화면 조합에 집중하고, 사용자 기능은 `features/`, 외부 상태와 lifecycle은 `services/`와 `providers/`에 둡니다.

## 문서 둘러보기

| 문서                                                        | 무엇을 볼 수 있나요?                         |
| ----------------------------------------------------------- | -------------------------------------------- |
| [문서 인덱스](./docs/README.md)                             | 제품·디자인·API·QA 문서 전체 지도            |
| [제품 로드맵](./docs/product/ROADMAP.md)                    | 구현 범위, 현재 단계와 다음 우선순위         |
| [사용자 흐름 카탈로그](./docs/product/USER_FLOW_CATALOG.md) | UF-01~UF-08 정상·예외·복구 시나리오          |
| [디자인 시스템](./docs/design/DESIGN.md)                    | 색상, 타이포그래피, 레이아웃과 상호작용 원칙 |
| [화면 가이드](./docs/design/SCREEN_GUIDE.md)                | 화면별 목적, 행동과 캡처 기준                |
| [Smoke test](./docs/qa/SMOKE_TEST_CHECKLIST.md)             | Android·iOS·Web 실제 검증 순서               |
| [릴리즈 체크리스트](./docs/qa/RELEASE_CHECKLIST.md)         | 배포 후보의 최종 통과 조건                   |

## 우리가 중요하게 보는 것

- 사용자가 지금 해야 할 다음 행동이 분명한가
- 저장·완료·이동 결과가 같은 화면에서 확인되는가
- 로딩·빈 상태·오류·복구도 정상 흐름처럼 설계됐는가
- 글꼴 확대와 화면 읽기 사용에서도 핵심 기능이 유지되는가
- 개인 데이터와 Workspace 데이터가 섞이지 않는가

## 관련 저장소

- [todolab-backend](https://github.com/todolab-project/todolab-backend) — API, 인증, 데이터와 서버 애플리케이션

---

<p align="center">
  작은 기록이 오늘의 실행으로 이어지도록.
</p>
