# Dooit Mobile 작업 규칙

이 저장소에서는 Dooit 모바일 클라이언트만 작업한다.

## 작업 범위

- 기본 작업 대상은 Expo, React Native, TypeScript 기반 모바일·웹 클라이언트다.
- 백엔드 구현과 데이터베이스 변경은 별도 `dooit-backend` 저장소에서 진행한다.
- API 변경이 필요하면 클라이언트 요구 사항과 예상 계약을 먼저 문서화한다.

## 검증

- 변경 후 `npm run validate`를 실행한다.
- 플랫폼별 코드를 수정하면 영향받는 Android, iOS, Web 환경을 명시한다.
- 새 의존성은 Expo SDK 56 및 React Native 0.85 호환성을 확인한 뒤 추가한다.
- 화면 수정이나 신규 사용자 기능은 [`docs/qa/PRODUCT_DESIGN_REVIEW_POLICY.md`](./docs/qa/PRODUCT_DESIGN_REVIEW_POLICY.md)에 따라 구현 전 Product Design 검토와 구현 후 실제 화면 감사를 진행한다.
- 로컬 Web 화면 캡처·조작은 ChatGPT 앱의 내장 브라우저를 기본으로 사용한다. 기존 Chrome tab·로그인 session·일반 browser profile이나 Chrome 전용 동작을 확인해야 할 때는 Chrome 확장을 사용한다.
- 선택한 브라우저로 로컬 앱에 접근할 수 없으면 같은 브라우저의 연결·주소·서버 상태를 먼저 복구한다. 다른 browser surface나 local Playwright로 바꿀 때는 audit에 사유와 실제 검증 환경을 기록한다.
- 신규 화면이나 정보 구조에 의미 있는 선택지가 있으면 시각안 3개를 먼저 비교하고, 선택된 방향 없이 구현하지 않는다.
- Figma는 사용자가 요청하거나 여러 화면 비교·공유·design library 관리가 필요한 경우에만 사용한다. Markdown·실제 캡처·코드를 제품 판단의 원본으로 유지한다.

## 변경 관리

- 기본 작업은 `main`에서 하나의 완결된 변경마다 커밋한다.
- 규모가 크거나 실험적이거나 병렬 작업이 필요한 경우에만 별도 브랜치를 사용한다.
- 브랜치 이름은 `feat/<topic>`, `fix/<topic>`, `chore/<topic>` 형식을 사용한다.
- 커밋 메시지는 접두사 없이 짧은 한국어 변경 요약만 사용한다. `feat:`, `fix:`, `test:`, `docs:`, `chore:` 같은 type 접두사는 붙이지 않는다.
- 요약은 명사형으로 작성하고 마침표를 붙이지 않는다. 예: `Task 알림 시각 설정 연결`, `Workspace Task 메뉴 초점 이동 개선`, `Android preview 빌드 상태 갱신`.
- 서로 독립적으로 설명할 수 있는 변경은 하나의 커밋에 섞지 않는다.
- 백엔드 변경은 이 저장소에 섞지 않고 `dooit-backend` 저장소에서 별도로 관리한다.
- 코드와 문서 변경 및 검증까지만 진행한 뒤 사용자 확인을 받는다.
- 사용자가 명시적으로 승인한 경우에만 커밋과 푸시를 진행한다.
- 실제 비밀 값과 로컬 환경 파일은 커밋하지 않는다.
