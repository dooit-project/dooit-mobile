# 앱 밖 빠른 기록 기술 스파이크

Last updated: 2026-09-02

## 목적

Dooit의 “생각난 일은 가볍게 기록하고”를 앱을 직접 연 뒤 입력하는 단계 밖으로 확장할 수 있는지 Expo SDK 56 기준으로 판단한다. 이 문서는 기술 선택만 확정하며, 출시 후보에 새 native target이나 실험 API를 바로 포함하지 않는다.

## 현재 결론

| 후보                      | SDK 56 지원                              | 새 native build  | 판단                        |
| ------------------------- | ---------------------------------------- | ---------------- | --------------------------- |
| iOS 홈 화면 widget        | 공식 `expo-widgets` 사용 가능            | 필요             | iOS 후속 prototype          |
| Android 홈 화면 widget    | 공식 `expo-widgets` 미지원               | 필요             | 공식 SDK만으로는 보류       |
| 공유 메뉴 텍스트·URL 수신 | 공식 `expo-sharing`으로 Android·iOS 지원 | 필요             | 첫 cross-platform prototype |
| 홈 화면 quick action      | 공식 Expo SDK 패키지 없음                | 필요             | 제3자 패키지 검증 뒤 후속   |
| 음성 입력                 | 별도 문제 정의 필요                      | 구현에 따라 다름 | 보류                        |

기존 로드맵의 “widget → 공유 메뉴 → Shortcut”은 플랫폼 공통 구현 순서로 쓰기 어렵다. **공유 메뉴 → iOS widget → quick action** 순서로 검증한다.

## 근거와 제약

### Widget

- Expo SDK 56의 `expo-widgets` 권장 버전은 `~56.0.27`이고 iOS 홈 화면 widget과 Live Activity만 지원한다.
- Expo Go에서는 사용할 수 없으므로 development build 또는 preview build가 필요하다.
- widget은 별도 격리 runtime에서 실행된다. React Native component, hook, context, async 작업과 앱의 메모리 상태를 직접 사용할 수 없다.
- 빠른 기록 버튼은 앱을 `dooit://` 경로로 열어 composer에 focus하는 진입점부터 검증한다. widget 안에서 인증 API를 직접 호출하지 않는다.
- App Group과 widget extension target이 추가되므로 기존 Android 출시 후보와 분리된 iOS prototype build에서 확인한다.

### 공유 메뉴

- Expo SDK 56의 `expo-sharing` 권장 버전은 `~56.0.26`이다.
- Android share intent와 iOS Share Extension을 config plugin으로 설정할 수 있고, Expo Router의 `+native-intent.ts`에서 수신 경로를 분리할 수 있다.
- 수신 기능은 공식 문서상 experimental이다. 특히 iOS는 Share Extension이 main app을 여는 방식이므로 Apple이 공식 지원하는 extension 내부 처리 방식과 다르다.
- 1차 범위는 단일 `text/plain`과 URL만 받는다. 이미지·파일·다중 payload는 제외한다.
- 수신 직후 자동 저장하지 않는다. 앱에서 제목을 확인·수정한 뒤 기존 quick capture mutation으로 기록함에 저장한다.
- 로그아웃·게스트 bootstrap·세션 갱신 중에는 payload를 메모리 또는 extension 공유 영역에 제한적으로 보존하고, 인증 준비 뒤 확인 화면을 보여 줘야 한다.

### Quick action

- SDK 56 공식 패키지는 확인되지 않았다.
- 제3자 `expo-quick-actions`는 SDK 56 대응 버전을 명시하지만, 출시 의존성으로 채택하기 전에 Android·iOS cold start, Expo Router 이동, 유지보수 상태와 config plugin 산출물을 검증해야 한다.
- 첫 action 후보는 `빠른 기록` 하나다. 검색·오늘 계획 등으로 범위를 넓히지 않는다.

## 구현 순서

### S1. 공유 메뉴 prototype

1. Product Design에서 수신 확인 화면 3안을 비교한다.
2. `expo-sharing`을 설치하고 text·URL activation rule과 Android `text/plain` intent filter만 설정한다.
3. `+native-intent.ts`에서 일반 deep link와 공유 payload 경로를 구분한다.
4. 공유 제목 미리보기, 수정, `기록함에 저장`, 취소를 제공한다.
5. 기존 Task 생성 API와 idempotency 정책을 재사용한다.
6. development/preview profile에서만 native 설정을 켤 수 있는지 검증한다. 어렵다면 별도 `prototype/outside-capture` 브랜치와 전용 build profile로 격리한다.
7. Android·iOS의 foreground·background·cold start, 게스트·로그인·만료 세션을 실제 build에서 확인한다.

### S2. iOS widget prototype

1. 작은 widget 하나에 `빠른 기록` 진입만 제공한다.
2. app이 종료된 상태에서 deep link → 인증 bootstrap → composer focus를 확인한다.
3. 기록 목록, 완료, 통계는 넣지 않는다.
4. iOS 16.4 최소 지원과 light·dark·tinted rendering을 확인한다.

### S3. Quick action 재평가

공유 메뉴와 iOS widget의 실제 사용성이 확인된 뒤 `expo-quick-actions` 또는 자체 config plugin을 비교한다. 채택 시 `빠른 기록` deep link 하나만 먼저 연결한다.

## 완료 조건

- prototype이 기존 production/preview 출시 후보의 native 설정과 분리된다.
- 공유한 text·URL이 사용자 확인 없이 서버에 저장되지 않는다.
- 중복 수신·재실행·취소 뒤 payload가 다시 나타나지 않는다.
- 게스트·회원·만료 세션에서 데이터 유실과 다른 계정 저장이 없다.
- Android와 iOS 실제 build 결과를 smoke log에 남긴다.

## 공식 참고

- [Expo SDK 56 Widgets](https://docs.expo.dev/versions/v56.0.0/sdk/widgets/)
- [Expo SDK 56 Sharing](https://docs.expo.dev/versions/v56.0.0/sdk/sharing/)
- [Expo iOS App Extensions](https://docs.expo.dev/build-reference/app-extensions/)
