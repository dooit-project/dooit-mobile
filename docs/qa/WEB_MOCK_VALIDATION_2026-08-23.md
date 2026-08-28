# Web mock 비시각 검증 기록

Last updated: 2026-08-23

## 범위

- 기준 frontend commit: `510dcec`
- API mode: `mock`
- Expo SDK 56 static Web export
- 직접 경로 산출물, fallback, asset 이름과 service worker 포함 여부

정적 검증 뒤 연결된 Chrome에서 실제 클릭과 viewport 검증을 추가했다. 로그인·게스트·Today·Calendar·Workspace 목록, 빠른 등록, 직접 경로 새로고침과 기본 keyboard focus는 확인했다. Chrome zoom 150% 적용 여부와 Workspace 생성·상세 흐름은 아직 남아 있다.

## 연결된 Chrome 검증

### 통과

- mock 로그인 form에 임의 이메일과 8자 이상 비밀번호를 제출하면 `/?linked=1`의 Today로 이동한다.
- 로그인 뒤 새로고침해도 Today session이 유지된다.
- 로그아웃하면 기존 작성 내용을 유지하는 게스트 상태로 전환되고, 같은 origin 저장과 복구 한계 안내가 표시된다.
- Today에서 Calendar와 더보기로 이동하고, 더보기에서 공유 공간 목록에 진입할 수 있다.
- 빠른 등록으로 날짜 없는 항목을 만들면 제목, 기록함 저장 상태, `오늘 할 일로 이동`, `내용 확인`이 표시되고 정리 화면 cache에 반영된다.
- `/calendar`, `/tasks/1`, `/workspaces` 직접 접근과 새로고침 뒤 각 화면의 핵심 heading 또는 콘텐츠가 유지된다.
- 320px·390px·430px에서 document-level 가로 overflow가 발생하지 않는다.
- Workspace 목록에서 Tab·Shift+Tab 순서가 뒤로 가기와 `새 공간`으로 이동하고, 브라우저 기본 focus outline이 보인다.

### 발견 사항

- 빠른 등록 composer는 input focus와 저장 성공 상태에서 `Escape`로 닫히며, 입력 중 닫은 draft는 다시 열었을 때 유지된다. 2026-08-24 재검증했다.
- mock 추천 API가 날짜 없는 Inbox 항목을 그대로 추천에도 포함해 같은 Task가 `추천`과 `기록함` 양쪽에 나타나고 Today의 정리 개수에도 두 번 합산된다. 최신 기록 preview와 `하루 정리`를 분리하는 제품안 구현 시 중복 노출을 함께 제거해야 한다.
- 연결된 Chrome에서 zoom 단축키를 보냈지만 CSS viewport와 device pixel ratio가 변하지 않아 150% 적용을 판정할 수 없었다.
- mock 계정으로 보이는 Workspace가 없어 목록의 빈 상태까지만 확인했다. 생성·상세·역할별 흐름은 별도 검증이 필요하다.

## 통과한 항목

### Static export

다음 명령으로 mock Web export가 성공했다.

```bash
EXPO_PUBLIC_API_MODE_OVERRIDE=mock npx expo export --platform web
```

- 총 22개 static route가 생성됐다.
- JS bundle은 content hash가 포함된 파일명으로 생성됐다.
- export에 의도하지 않은 service worker 파일은 생성되지 않았다.
- favicon 산출물이 생성됐다.

### 직접 경로

다음 경로의 HTML 또는 dynamic route template이 export에 포함됐다.

```text
/
/start
/login
/register
/password-reset
/calendar
/completed
/dday
/profile
/search
/settings
/templates
/today/review
/tasks/new
/tasks/[taskId]
/workspaces
/workspaces/[workspaceId]
```

`npm run check:web-route-fallback`이 통과했고 export 결과에 `_redirects`가 포함됐다. 실제 host가 이 파일의 200 rewrite를 적용하는지는 운영 배포에서 다시 확인해야 한다.

### 코드·자동화로 확인한 흐름 기반

- 인증 정보가 없으면 공개 `/start`에서 로그인·게스트 시작을 선택한다.
- mock API는 로그인, 게스트 생성·복원, Today·Calendar와 Workspace 기본 흐름을 지원한다.
- 날짜 없는 빠른 등록은 Inbox cache에 반영되고 Today의 정리 데이터가 함께 갱신된다.
- Workspace 개인·공유 query key와 알림 identifier가 분리된다.
- 이 문서의 Web export 검증 후 전체 자동 검증 기준선은 [`ROADMAP.md`](../product/ROADMAP.md)에서 관리한다.

## 아직 확인하지 못한 항목

| 항목                                      | 상태            | 필요한 환경                                 |
| ----------------------------------------- | --------------- | ------------------------------------------- |
| 로그인·게스트 실제 form 제출과 route 전환 | mock 통과       | 운영 인증은 real API에서 재검증             |
| Today·Calendar·Workspace 클릭 흐름        | 부분 통과       | Workspace 생성·상세는 추가 검증             |
| 직접 경로 주소 입력과 새로고침            | local mock 통과 | 운영 host fallback은 별도 검증              |
| browser zoom 150% reflow                  | 미검증          | 320px부터 desktop viewport를 제어할 browser |
| Tab·Shift+Tab·Enter·Escape와 focus 표시   | 통과            | Escape composer 동작을 2026-08-24 재검증    |
| cache response header                     | 미검증          | 실제 정적 host                              |
| Web 인증·CORS·production 데이터           | 차단            | 운영 backend URL·CORS·DB                    |

## 다음 브라우저 검증 순서

1. `/start`에서 게스트 시작 후 빈 Today 확인
2. 로그아웃·로그인과 새로고침 뒤 세션 상태 확인
3. 빠른 등록으로 날짜 없는 항목 생성 후 결과와 기록함 진입 확인
4. Calendar와 Workspace 조회·생성·상세 이동 확인
5. `/login`, `/calendar`, `/tasks/{id}`, `/workspaces/{id}` 주소 직접 입력과 새로고침
6. 320px·390px·430px·desktop 및 zoom 150%
7. Tab·Shift+Tab·Enter·Space·Escape 순서와 focus 표시 캡처

화면 캡처가 확보되기 전에는 UX·접근성 통과나 Web 운영 준비 완료로 판정하지 않는다.
