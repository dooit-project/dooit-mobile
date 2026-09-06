# Android 개인 APK Runbook

Dooit Mobile을 Expo Go나 Metro 없이 Android 기기에 직접 설치해 실제 production API와 연결하기 위한 절차다.

## 1. 현재 확정한 앱 식별자

| 항목                  | 값           | 메모                                                                             |
| --------------------- | ------------ | -------------------------------------------------------------------------------- |
| 앱 이름               | `Dooit`      | `app.json`                                                                       |
| Android package       | `pj.dooit`   | 개인 APK용 기준값. Play Store 또는 조직 도메인 정책이 생기면 출시 전 재검토한다. |
| iOS bundle identifier | `pj.dooit`   | iOS 배포는 후순위지만 Android와 같은 기준값을 먼저 맞춘다.                       |
| App version           | `1.0.0`      | `package.json`, `app.json`                                                       |
| Android versionCode   | `1`          | APK update install 전 증가 정책을 유지한다.                                      |
| Scheme                | `dooit`      | deep link 정책 확정 전까지 유지한다.                                             |
| Expo owner            | `hyunseung2` | `app.json`                                                                       |
| EAS project id        | 재연결 필요  | 현재 id가 기존 `todolab-mobile` project를 가리켜 새 `dooit-mobile` project 필요  |

식별자를 변경하면 기존 Android 앱과 다른 앱으로 설치될 수 있고, 기존 SecureStore 로그인 상태와 앱 데이터가 이어지지 않을 수 있다.

## 2. EAS profile

`eas.json`은 다음 profile을 기준으로 둔다.

| Profile       | 목적                           | Android artifact         | API mode |
| ------------- | ------------------------------ | ------------------------ | -------- |
| `development` | 개발 client 또는 device 디버깅 | APK                      | `mock`   |
| `preview`     | 개인 설치용 real API APK       | APK                      | `real`   |
| `production`  | 추후 store 또는 정식 후보      | 기본 production artifact | `real`   |

`preview`와 `production`은 `EXPO_PUBLIC_API_MODE=real`을 사용하고, production API의 고정 Cloudflare HTTPS origin을 `EXPO_PUBLIC_API_URL`로 주입한다. 이 URL은 공개 정보이며 서버 secret이 아니다.

## 3. Production API URL 주입

개인 APK의 production API origin은 공개 production HTTPS URL을 사용한다.

```text
EXPO_PUBLIC_API_URL=https://dooitapi.hsng.pe.kr
```

주의:

- `EXPO_PUBLIC_*` 값은 앱 번들에 포함되는 공개 값이다.
- token, password, API key, 서버 secret은 절대 넣지 않는다.
- `localhost`, `10.0.2.2`, LAN IP는 개인 production APK에 남기지 않는다.
- production APK는 HTTPS API 경로를 기본으로 하며, Android cleartext HTTP 허용 설정을 켜지 않는다.

## 4. 빌드 전 확인

```bash
npm run validate
npm run check:release-static
npm run check:eas-setup
```

확인할 것:

- `app.json`의 `android.package`와 `android.versionCode`
- 앱 표시 이름, scheme, icon/splash/favicon 파일 존재와 PNG 크기
- `eas.json`의 target profile
- 커밋된 `EXPO_PUBLIC_API_URL`이 있다면 HTTPS인지
- Android production APK config에서 cleartext traffic 허용을 켜지 않았는지
- `expo-notifications` production dependency와 native config plugin이 모두 포함됐는지
- EAS CLI가 설치되어 있고 `eas whoami` 로그인과 Expo project id 연결이 확인되는지
- `.expo` 로컬 상태가 실제로 Git에서 제외되는지
- `preview`, `production` profile의 `EXPO_PUBLIC_API_URL`이 production HTTPS URL인지
- `.env.local`이 커밋되지 않았는지
- 백엔드 production API가 Cloudflare HTTPS로 접근 가능한지

`npm run check:eas-setup`은 Expo 로그인과 올바른 `eas init` 전에는 실패하는 것이 정상이다. 계정 확인에는 `api.expo.dev` 네트워크 접근이 필요하며, project ID 존재뿐 아니라 실제 연결 project의 slug가 `dooit-mobile`인지도 확인한다.

## 5. EAS project 연결

Expo 계정 로그인이 끝난 뒤 `@hyunseung2/dooit-mobile` project를 새로 만들고 연결한다. 현재 `app.json`의 project id는 기존 `@hyunseung2/todolab-mobile`을 가리키므로 유효한 연결로 판정하지 않는다.

```bash
eas login
eas init
```

연결 뒤 Expo dashboard의 slug가 `dooit-mobile`인지, `app.json`의 `expo.extra.eas.projectId`가 새 project id인지 확인한다. 기존 project id는 재사용하지 않으며 `.expo/` 로컬 상태는 Git에 커밋하지 않는다.

## 6. 개인 APK 생성

EAS 계정과 project 연결이 끝난 뒤 preview APK를 생성한다.

```bash
eas build --platform android --profile preview
```

생성될 APK의 로컬 보관 파일명은 아래 명령으로 먼저 확인한다.

```bash
npm run apk:filename
```

EAS artifact URL을 받은 뒤에는 APK를 Git 저장소 밖 개인 보관 위치에 저장한다.

```bash
npm run apk:save -- --url <EAS_APK_ARTIFACT_URL>
```

빌드 id와 배포된 백엔드 버전을 받은 뒤 smoke log에 붙여 넣을 release note를 생성한다.

```bash
npm run apk:release-note -- \
  --build-id <EAS_BUILD_ID> \
  --backend <BACKEND_COMMIT_OR_IMAGE> \
  --device <DEVICE_AND_OS>
```

현재 앱 version, versionCode, frontend commit, preview API mode·URL과 예상 APK 파일명은 저장소 설정에서 자동으로 채운다. 아직 확인하지 않은 migration, rollback, smoke 결과는 `확인 필요` 또는 `BLOCKED`로 남겨 추측으로 통과 처리하지 않는다.

기본 저장 위치와 파일명:

```text
~/Downloads/dooit-apk/dooit-android-preview-v<version>-<versionCode>-<shortCommit>.apk
```

빌드 결과 APK를 Android 기기에 설치한 뒤 다음을 확인한다.

- Expo Go와 Metro 없이 cold start 된다.
- 로그인 후 access token이 SecureStore에 저장되고 앱 재시작 뒤 복원된다.
- Today, Calendar, Search, D-Day 주요 흐름이 production DB로 동작한다.
- Tailscale이 꺼져 있을 때 오류 문구와 재시도 동선이 이해된다.

## 7. 업데이트 운영

### APK 보관과 전달

- APK 파일은 Git 저장소에 커밋하지 않는다.
- 개인 사용 단계의 APK는 EAS build artifact link 또는 로컬 `~/Downloads/dooit-apk/` 같은 개인 보관 위치에 둔다.
- 파일명은 `dooit-android-preview-v<version>-<versionCode>-<shortCommit>.apk` 형식으로 남긴다.
- Android 기기로 전달할 때는 EAS QR/link, USB 파일 전송, 또는 본인만 접근 가능한 cloud storage를 사용한다.
- 공유 link를 만들면 설치 완료 후 만료하거나 접근 권한을 회수한다.

### 설치 권한

- Android의 “출처를 알 수 없는 앱 설치” 권한은 APK를 설치할 때만 임시로 켠다.
- 설치가 끝나면 사용한 앱, 예: Chrome, Files, Drive의 설치 권한을 다시 끈다.
- 권한을 계속 켜 두는 방식은 개인 APK 단계에서도 기본값으로 두지 않는다.

### 업데이트와 release note

- 같은 package로 update install하려면 `android.versionCode`를 증가시킨다.
- release 후보마다 앱 commit, 백엔드 commit/image, API URL, 기기, 검증 결과를 [`SMOKE_TEST_LOG.md`](../qa/SMOKE_TEST_LOG.md)에 기록한다.
- release note에는 version, versionCode, frontend commit, backend commit 또는 image tag, API base URL, migration 필요 여부, rollback 가능 여부를 남긴다.
- 백엔드 API breaking change가 있으면 호환 APK 설치와 smoke test가 끝나기 전까지 기존 API를 제거하지 않는다.
- Play Store 배포는 개인 APK 사용이 안정된 뒤 별도로 결정한다.

Release note 최소 형식:

```text
Dooit Android APK
Version:
VersionCode:
Frontend commit:
Backend commit/image:
API URL:
Required backend migration: yes/no
Breaking API dependency:
Smoke result:
Rollback target:
Notes:
```

### Rollback 기준

- rollback은 같은 signing credential과 낮지 않은 데이터 호환성을 전제로 한다.
- Android는 낮은 `versionCode` APK로 바로 downgrade 설치가 제한될 수 있으므로, 이전 버전으로 되돌릴 가능성이 있으면 데이터 삭제 또는 재설치 필요 여부를 먼저 확인한다.
- SecureStore token, local cache, 백엔드 schema가 이전 APK와 호환되는지 확인한다.
- signing keystore는 EAS managed credential 또는 별도 보관 위치를 정하되 저장소에 넣지 않는다.

## 8. Signing credential 운영

기본 방침:

- 개인 APK 단계에서는 EAS managed Android credential을 우선 사용한다.
- keystore 파일, keystore password, key alias, key password는 저장소에 커밋하지 않는다.
- 로컬 파일로 보관해야 하는 경우에도 `.jks`, `.keystore`, `.key`, `.pem`은 `.gitignore`에 의해 제외되어야 한다.

기록할 수 있는 정보:

| 항목                 | 저장 가능 여부 | 메모                                                                |
| -------------------- | -------------- | ------------------------------------------------------------------- |
| credential 소유 방식 | 가능           | `EAS managed` 또는 `local backup exists`처럼 비밀 없는 수준         |
| Expo 계정/조직명     | 가능           | 팀 정책상 공개 가능한 경우만                                        |
| 복구 담당자          | 가능           | 개인 이름 대신 역할명 권장                                          |
| keystore 파일 경로   | 주의           | 개인 로컬 경로는 문서에 남기지 않는다. 보관 시스템 이름 정도만 기록 |
| keystore password    | 금지           | 어떤 문서에도 남기지 않는다                                         |
| key alias/password   | 금지           | 어떤 문서에도 남기지 않는다                                         |

EAS project 연결 후 확인할 것:

```bash
eas credentials --platform android
```

현재 preview credential 확인 결과:

```text
Android credential: EAS managed JKS
Application identifier: pj.dooit
SHA1 fingerprint: 97:3E:D0:6D:E7:2F:14:96:C8:32:25:92:07:05:2E:B3:BA:86:14:24
SHA256 fingerprint: 9C:F2:93:D1:4A:41:B9:9E:E3:DD:7F:24:C0:CC:89:22:DD:11:65:08:A5:55:4B:B4:AD:3D:BE:FA:DA:48:46:13
Checked at: 2026-08-03
```

확인 결과는 비밀 값을 제외하고 release smoke log에 다음 수준으로만 기록한다.

```text
Android credential: EAS managed
Keystore backup: not exported / exported to secure vault
Checked at: YYYY-MM-DD
```

credential을 잃어버리면 같은 package의 update install 또는 Play Store 배포가 어려워질 수 있다. 따라서 APK가 실제 사용 단계로 들어가기 전에는 EAS managed credential 접근 권한과 복구 절차를 반드시 확인한다.
