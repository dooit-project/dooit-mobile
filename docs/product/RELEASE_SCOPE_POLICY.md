# 배포 범위와 버전·OTA 정책

> 최종 갱신: 2026-08-23

이 문서는 EAS profile의 존재와 실제 공개 승인을 분리하고, ToDoLab 모바일·Web의 현재 배포 범위와 승격 조건을 정한다.

## 현재 배포 범위

| 대상                | 현재 범위           | 공개 전 승격 조건                                                  |
| ------------------- | ------------------- | ------------------------------------------------------------------ |
| Android             | 내부 `preview` APK  | production API·실기기 smoke, signing 복구, AAB·Play 정책 확정      |
| iOS                 | 로컬·내부 검증 준비 | Apple Team, `buildNumber`, 실기기 QA, 개인정보·App Store 자료 확정 |
| Web                 | 로컬·preview 검증   | 운영 HTTPS origin, CORS·CSP·cache·직접 경로·인증 smoke 통과        |
| Google Play         | 공개하지 않음       | Android 공개 조건과 스토어 심사 자료 완료                          |
| Apple App Store     | 공개하지 않음       | iOS 공개 조건과 스토어 심사 자료 완료                              |
| EAS Update 기반 OTA | 사용하지 않음       | 채널·runtime 호환·rollback 검증과 별도 공개 승인                   |

- 현 단계의 배포 후보는 Android 내부 `preview` APK 하나다.
- `eas.json`의 `production` profile은 설정 뼈대일 뿐 Store 제출이나 공개 배포 승인이 아니다.
- 임시 API 주소나 개인 네트워크 주소를 사용하는 artifact는 내부 검증 범위를 넘지 않는다.
- iOS와 Web은 제품 범위에 포함하지만 운영 환경이 준비되기 전까지 공개하지 않는다.

## 버전 기준

- 사용자에게 보이는 앱 버전은 `app.json`의 `expo.version`을 단일 기준으로 삼고 semantic version 형식을 사용한다.
- Android `versionCode`와 iOS `buildNumber`는 Store가 artifact를 구분하는 개발자 버전이다. 같은 앱 버전으로 다시 배포하더라도 이전 제출보다 반드시 증가시킨다.
- 현재 `cli.appVersionSource`는 `local`이므로 공개 후보를 만들기 전 `app.json`의 값을 저장소에서 검토한다.
- Android production profile의 `autoIncrement`는 production build에만 적용한다. 내부 preview APK의 versionCode와 파일명은 release note에서 직접 대조한다.
- 첫 iOS artifact를 만들기 전에 `ios.buildNumber`를 추가하고 release note에 앱 버전과 함께 기록한다.
- 버전 변경은 기능 코드와 섞지 않고 릴리즈 준비 커밋으로 분리한다.

## OTA 기준

현재 앱에는 `expo-updates`, `updates` URL, `runtimeVersion`이 없으며 OTA를 사용하지 않는다. 이 상태에서는 native build와 정적 Web 배포만 릴리즈 수단으로 본다.

OTA를 도입할 때는 다음을 한 변경 단위로 처리한다.

1. `expo-updates`와 EAS Update project·channel을 명시한다.
2. `runtimeVersion`은 앱 버전에 맞춘 `appVersion` policy로 시작한다.
3. native module, Expo SDK, 권한 또는 config plugin이 바뀌면 앱 버전을 올리고 새 native build를 먼저 배포한다.
4. Android·iOS preview channel에서 호환성, cold start, offline start와 rollback을 검증한다.
5. production channel 승격은 해당 native build가 설치된 사용자만 대상으로 하고 release note에 update group을 기록한다.

`runtimeVersion`이 다른 update는 설치된 native runtime과 호환되지 않는 것으로 취급한다. JS만 바뀌었다는 이유로 preview 검증 없이 production OTA를 발행하지 않는다.

## 공개 승격 순서

```text
local/mock
  → Android preview APK + Web preview
  → production API 실기기·브라우저 smoke
  → Android Store 또는 iOS internal 후보
  → 플랫폼별 공개 승인
  → 필요성이 확인된 뒤 OTA preview
  → OTA production 승인
```

플랫폼은 함께 공개할 필요가 없다. 먼저 조건을 충족한 플랫폼만 별도로 승격하고, 앱 화면이나 소개 문서에는 실제로 접근 가능한 플랫폼만 표시한다.

## 관련 문서

- Android 내부 APK 절차: [`ANDROID_APK_RUNBOOK.md`](../integration/ANDROID_APK_RUNBOOK.md)
- Web 운영 보안: [`WEB_SECURITY_POLICY.md`](../integration/WEB_SECURITY_POLICY.md)
- Web cache 기준: [`WEB_DEPLOYMENT_CACHE.md`](../integration/WEB_DEPLOYMENT_CACHE.md)
- 출시 판정: [`RELEASE_CHECKLIST.md`](../qa/RELEASE_CHECKLIST.md)
- Expo runtime version: <https://docs.expo.dev/eas-update/runtime-versions/>
- Expo 앱 버전 관리: <https://docs.expo.dev/build-reference/app-versions/>
