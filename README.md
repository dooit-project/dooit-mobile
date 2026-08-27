# ToDoLab Mobile

ToDoLab의 일정 관리 경험을 Android, iOS, Web에서 제공하는 크로스플랫폼 클라이언트입니다.

모바일 환경에 맞는 빠른 입력과 명확한 일정 탐색을 목표로 하며, 백엔드 API와 독립적인 배포 주기를 유지합니다.

## 기술 스택

| 영역            | 기술                           |
| --------------- | ------------------------------ |
| Framework       | Expo SDK 56, React Native 0.85 |
| Language        | TypeScript 6                   |
| UI              | React 19                       |
| Navigation      | Expo Router                    |
| Platforms       | Android, iOS, Web              |
| Package Manager | npm                            |

## 프로젝트 구조

```text
src/
├── app/         # Expo Router 화면과 route layout
├── components/  # 공통 UI
├── features/    # auth, task, calendar, notification 등 도메인 기능
├── providers/   # query, 인증 bootstrap, 세션·알림 lifecycle
├── services/    # API client, token, preference 저장
├── theme/       # token, theme, responsive 기준
├── types/       # API·도메인 타입
└── utils/       # 날짜·일정 공통 로직
```

화면, 도메인, API 계층의 책임이 섞이지 않도록 route는 조합에 집중하고 실제 기능은 `features/`, 외부 상태는 `services/`와 `providers/`에 둡니다.

## 제품 및 디자인 문서

백엔드의 기존 기능과 UI/UX를 기준으로 정리한 모바일 정보 구조, 단계별 구현 계획, 완료 기준은 [모바일 로드맵](./docs/product/ROADMAP.md)에서 관리합니다.

색상, 타이포그래피, 간격, 공통 컴포넌트와 상호작용 원칙은 [모바일 디자인 시스템](./docs/design/DESIGN.md)에서 관리합니다.

문서 전체 구조는 [문서 패키지 인덱스](./docs/README.md)에서 확인합니다. 세부 기준 문서는 다음 위치에서 확인합니다.

| 문서                                                                     | 용도                                               |
| ------------------------------------------------------------------------ | -------------------------------------------------- |
| [접근성 체크리스트](./docs/qa/ACCESSIBILITY_CHECKLIST.md)                | 읽기 순서, 글꼴 확대, 명암, screen reader 점검     |
| [성능 점검 기준](./docs/qa/PERFORMANCE_CHECKLIST.md)                     | 초기 진입, 긴 목록, Calendar 렌더링 성능 기준      |
| [플랫폼 품질 점검표](./docs/qa/PLATFORM_QUALITY_CHECKLIST.md)            | icon, splash, safe area, 키보드, 햅틱, 식별자 기준 |
| [릴리즈 체크리스트](./docs/qa/RELEASE_CHECKLIST.md)                      | 실제 사용·배포 후보 전 최종 확인 항목              |
| [Smoke test 체크리스트](./docs/qa/SMOKE_TEST_CHECKLIST.md)               | Android, iOS, Web mock/real 모드 검증 시나리오     |
| [화면 가이드](./docs/design/SCREEN_GUIDE.md)                             | 실제 화면 캡쳐와 화면별 사용 흐름 문서화           |
| [마켓·소개 이미지 준비](./docs/marketing/APP_STORE_ASSETS.md)            | 앱 마켓, 소개 페이지용 이미지와 문구 초안          |
| [컴포넌트 인벤토리](./docs/design/COMPONENT_INVENTORY.md)                | 공통 UI와 주요 도메인 컴포넌트 사용 기준           |
| [UX 리뷰 로그](./docs/design/UX_REVIEW_LOG.md)                           | 화면별 불편점, 결정 이유, 다음 UI/UX 수정 후보     |
| [백엔드 연동 Runbook](./docs/integration/BACKEND_INTEGRATION_RUNBOOK.md) | real API 연결 전 환경, endpoint, smoke test 순서   |
| [백엔드 요청 완료 상태](./docs/integration/BACKEND_STATUS_2026-08-27.md) | 완료된 서버 계약, 배포 한계와 프론트 후속 순서     |
| [Android 개인 APK Runbook](./docs/integration/ANDROID_APK_RUNBOOK.md)    | EAS APK 빌드, Tailscale API URL, 설치 smoke 절차   |
| [Web 배포 캐시 정책](./docs/integration/WEB_DEPLOYMENT_CACHE.md)         | 새 버전 자동 반영을 위한 index/asset cache 기준    |
| [오류 로깅과 개인정보 기준](./docs/qa/ERROR_LOGGING_PRIVACY.md)          | 오류 로깅 수집 범위와 원문 데이터 비수집 기준      |
| [반복 Task·일정 API 요구사항](./docs/api/API_RECURRENCE.md)              | 반복 series, occurrence, exception 백엔드 계약     |
| [로컬 알림 요구사항과 백엔드 책임](./docs/api/API_NOTIFICATIONS.md)      | 반복 일정과 로컬 알림 책임 분리                    |
| [검색 filter API 요구사항](./docs/api/API_SEARCH_FILTER.md)              | 통합 검색 filter, pagination, timezone 계약        |
| [일정 범위 API 요구사항](./docs/api/API_SCHEDULE_RANGE.md)               | 여러 날 일정과 Calendar 겹침 기준                  |
| [Today 순서 변경 API 요구사항](./docs/api/API_TODAY_REORDER.md)          | Today 실행 순서 변경 계약                          |
| [날짜·시간 API 요구사항](./docs/api/API_DATE_TIME.md)                    | LocalDate, LocalDateTime, timezone 기준            |

## 로컬 개발

### 요구 사항

- Node.js LTS
- npm
- Android Studio 또는 Xcode(네이티브 시뮬레이터 사용 시)

### 설치

```bash
npm ci
```

### 환경변수

예제 파일을 복사해 로컬 API 주소를 설정합니다.

```bash
cp .env.example .env.local
```

```dotenv
EXPO_PUBLIC_API_URL=http://localhost:8080
EXPO_PUBLIC_API_MODE=mock
```

`EXPO_PUBLIC_*` 값은 앱 번들에 포함되므로 API 주소처럼 공개 가능한 값만 사용하고, 토큰·비밀번호·서버 비밀 키는 넣지 않습니다.

`EXPO_PUBLIC_API_MODE`를 생략하면 기본값은 `mock`입니다. 로컬 UI 개발은 백엔드 없이 mock으로 먼저 확인하고, 실제 백엔드 연동 테스트 때는 `.env.local`을 고치기보다 override script를 사용합니다.

API 모드:

| 값     | 설명                                                        |
| ------ | ----------------------------------------------------------- |
| `real` | `EXPO_PUBLIC_API_URL`로 실제 백엔드 API에 연결합니다.       |
| `mock` | 백엔드 없이 로컬 in-memory 더미 데이터로 화면을 확인합니다. |

플랫폼별 로컬 백엔드 주소:

| 실행 환경             | API 주소 예시                    |
| --------------------- | -------------------------------- |
| Web, iOS Simulator    | `http://localhost:8080`          |
| Android Emulator      | `http://10.0.2.2:8080`           |
| 실제 Android/iOS 기기 | `http://<개발 PC의 LAN IP>:8080` |

백엔드가 기본 포트 `8080`을 사용한다면 Expo Web은 기본 포트를 사용하거나 다른 포트로 실행해 충돌을 피합니다.

### 실행

```bash
npm start
```

```bash
npm run android
npm run ios
npm run web
```

로컬 Web에서 모드를 명확히 나눠 확인할 때는 다음 script를 사용합니다.

```bash
npm run web:mock
npm run web:real -- --port 8090 --clear
```

`web:real`은 `EXPO_PUBLIC_API_MODE_OVERRIDE=real`과 `EXPO_PUBLIC_API_URL_OVERRIDE=http://localhost:8080`을 사용하므로 `.env.local`이 mock이어도 실제 백엔드에 연결됩니다.

운영 Web export는 mock 혼입과 HTTP API 연결을 막는 전용 명령을 사용합니다.

```bash
EXPO_PUBLIC_API_MODE=real \
EXPO_PUBLIC_API_URL=https://api.example.com \
npm run web:export:production
```

검사를 통과해야 `expo export --platform web`이 실행됩니다. 실제 운영 API URL은 배포 환경에서 주입하고 저장소에는 비밀 값이나 로컬 환경 파일을 커밋하지 않습니다.

### Smoke test 실행

백엔드 없이 앱 흐름을 먼저 확인하려면 `.env.local`을 mock 모드로 둡니다.

```dotenv
EXPO_PUBLIC_API_MODE=mock
```

mock 모드에서는 임의 이메일과 8자 이상 비밀번호로 회원가입·로그인 흐름을 확인할 수 있습니다.

백엔드 연동 화면을 확인할 때는 real 모드 script와 플랫폼별 API URL 기준을 함께 확인합니다.

```bash
npm run web:real -- --port 8090 --clear
```

화면별 확인 순서는 [Smoke test 체크리스트](./docs/qa/SMOKE_TEST_CHECKLIST.md)를 따릅니다.

API 단독 smoke는 다음 script를 사용합니다.

```bash
EXPO_PUBLIC_API_URL=http://localhost:8080 npm run smoke:auth:real
EXPO_PUBLIC_API_URL=http://localhost:8080 npm run smoke:guest:real
EXPO_PUBLIC_API_URL=http://localhost:8080 npm run smoke:workspace-roles:real
EXPO_PUBLIC_API_URL=http://localhost:8080 npm run smoke:recurrence:real
EXPO_PUBLIC_API_URL=http://localhost:8080 npm run smoke:recurrence-actions:real
```

반복 일정 smoke는 2026-08-02 기준 생성, Today/Calendar occurrence 조회, 완료, 미룸, 건너뛰기, notification candidates 제외 조건까지 통과했습니다. 최신 상태는 [Smoke test 로그](./docs/qa/SMOKE_TEST_LOG.md)를 확인합니다.

### 검증

```bash
npm run validate
```

개별 검증은 `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run docs:check`, `npm test`로 실행합니다. 코드 포맷을 적용하려면 `npm run format`을 사용합니다.

## 개발 원칙

- 플랫폼별 차이는 격리하고 핵심 사용자 흐름은 공통으로 유지합니다.
- 서버 상태와 화면 상태의 책임을 분리합니다.
- 백엔드 API 계약 변경은 호환성과 배포 순서를 함께 검토합니다.
- 접근성, 로딩, 오류, 빈 상태를 정상 흐름과 같은 수준으로 설계합니다.

## 관련 저장소

- [todolab-backend](https://github.com/todolab-project/todolab-backend) — ToDoLab 백엔드 및 서버 애플리케이션
