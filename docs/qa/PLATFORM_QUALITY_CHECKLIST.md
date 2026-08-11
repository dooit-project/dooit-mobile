# 플랫폼 품질 점검표

Android, iOS, Web 출시 전 확인할 플랫폼 품질 기준이다. 새 의존성이나 빌드 설정을 추가하기 전에 현재 앱 설정과 실제 화면 동작을 이 문서 기준으로 확인한다.

## 앱 아이콘과 splash

현재 설정:

- 앱 이름: `ToDoLab`
- app slug: `todolab-mobile`
- scheme: `todolab`
- orientation: portrait
- user interface style: automatic
- 공통 icon: `assets/images/icon.png` — 1024×1024 PNG
- iOS icon: `assets/expo.icon`
- Android adaptive icon:
  - foreground: `assets/images/android-icon-foreground.png` — 512×512 PNG
  - background: `assets/images/android-icon-background.png` — 512×512 PNG
  - monochrome: `assets/images/android-icon-monochrome.png` — 432×432 PNG
  - background color: `#E6F4FE`
- Web favicon: `assets/images/favicon.png` — 48×48 PNG
- Splash icon: `assets/images/splash-icon.png` — 228×213 PNG
- Splash background: `#FFFFFF`
- Android splash image width: 76

점검 기준:

- Android adaptive icon preview에서 foreground가 잘리지 않는다.
- Android monochrome icon이 단색 테마에서 의미를 잃지 않는다.
- iOS icon이 라운드 마스크 안에서 여백이 과하거나 부족하지 않다.
- Splash background와 앱 첫 화면 background 전환이 튀지 않는다. 현재 앱의 흰 배경 중심 테마에 맞춰 splash도 흰색을 사용한다.
- Splash icon은 저해상도 기기에서도 흐릿해 보이지 않는다.

남은 실기기 확인:

- Android adaptive icon preview에서 foreground, background, monochrome이 모두 자연스럽게 합성되는지
- iOS icon이 실제 홈 화면 라운드 마스크 안에서 너무 작거나 크지 않은지
- Splash 흰 배경에서 앱 첫 화면으로 넘어갈 때 logo 크기와 배경 전환이 튀지 않는지

## 상태바와 safe area

현재 앱은 `expo-status-bar`의 `style="auto"`와 공통 `Screen`의 `SafeAreaView`를 사용한다.

현재 설정:

- Expo `userInterfaceStyle`: `automatic`
- Status bar style: `auto`
- Android predictive back gesture: `false`

점검 기준:

- light/dark theme에서 status bar 아이콘 대비가 충분하다.
- Today 하단 빠른 기록 composer가 iOS home indicator, Android navigation bar, 하단 tab과 겹치지 않는다.
- KeyboardAvoidingView가 열린 상태에서도 입력 완료 버튼이 가려지지 않는다.
- Task detail, Search, Completed처럼 뒤로 가기 icon button이 있는 화면은 notch와 겹치지 않는다.
- Web 320px 폭에서도 content max width와 safe inset이 이상하게 중첩되지 않는다.

현재 실행 환경 메모:

- 2026-08-02 재확인 기준 Codex 작업 환경에서는 `xcrun`은 있으나 `simctl` utility를 찾을 수 없고 `adb`도 설치되어 있지 않아 iOS/Android simulator 또는 Android device 목록을 확인할 수 없다.
- 네이티브 safe area, OS font scale 1.5, VoiceOver/TalkBack, Android navigation bar 겹침은 Xcode Command Line Tools와 Android Platform Tools가 준비된 로컬 환경 또는 실제 기기에서 별도 확인한다.

## 키보드 동작

현재 기준:

- `Screen` scroll 화면은 `automaticallyAdjustKeyboardInsets`, `keyboardDismissMode="on-drag"`, `keyboardShouldPersistTaps="handled"`를 사용한다.
- Today는 하단 composer를 위해 `KeyboardAvoidingView`를 별도로 둔다.
- 하단 tab은 `tabBarHideOnKeyboard`를 사용한다.

점검 기준:

- 빠른 기록 input focus 시 composer가 키보드 위에 자연스럽게 올라온다.
- Task 작성/수정 화면에서 제목 → 설명 → 카테고리 이동이 어색하지 않다.
- 검색 화면에서 키보드가 열린 상태로 필터 chip을 눌러도 입력값이 사라지지 않는다.
- Android back 버튼 첫 동작은 키보드 닫기, 다음 동작은 화면 뒤로 가기여야 한다.
- Web에서는 Tab 순서가 시각 순서를 크게 벗어나지 않아야 한다.

## 날짜 선택

현재 앱은 native date picker 의존성 없이 Today week strip, Calendar month grid, Completed week picker, Task date quick actions로 날짜를 선택한다.

점검 기준:

- Today week strip과 Calendar month grid의 선택 날짜 표현이 다르게 느껴지지 않는다.
- Completed week picker는 선택 날짜와 완료 count를 함께 보여준다.
- Task date quick actions는 오늘·내일·7일 후·기록함을 44pt 이상 터치 영역으로 제공한다.
- 날짜 변경 후 목록 query key와 화면 label이 같은 날짜를 가리킨다.
- 시간대 기준은 `toApiLocalDate`와 백엔드 date contract를 따른다.

## 햅틱

현재 앱은 haptic 의존성을 사용하지 않는다. 도입 시 Expo SDK 56 호환성을 먼저 확인한다.

도입 후보:

- Task 완료
- 일정 완료
- D-Day 목표 생성
- 빠른 기록 저장
- 오류가 아닌 성공 feedback

도입하지 않을 곳:

- 화면 이동마다 반복되는 진동
- filter chip 선택처럼 자주 누르는 보조 행동
- 실패/오류에 강한 진동을 반복하는 패턴

점검 기준:

- iOS와 Android에서 같은 강도의 haptic이 과하게 느껴지지 않는다.
- Web에서는 haptic 없이 같은 성공 문구와 상태 변화가 제공된다.
- haptic 실패가 주요 action 실패로 이어지지 않는다.

## 로컬 알림

현재 구현:

- 최초 실행에서는 권한을 요청하지 않고, 미래 일정 저장 또는 설정의 명시적 행동 뒤에만 요청한다.
- 향후 30일 알림 후보를 조회해 실제 전달 시각이 가까운 50개를 예약한다.
- 시간 일정은 시작 시각, 종일 일정은 해당 날짜 오전 9시에 알린다.
- Task 생성·수정·완료·재개·이동·삭제, 앱 활성화, 계정 전환 때 예약을 갱신한다.
- 변경 없는 예약은 fingerprint가 같으면 유지하고, `suppressLocalNotification=true` 후보는 예약하지 않는다.
- 알림 선택 시 Task 상세로 이동하며 로그아웃 시 ToDoLab 예약만 정리한다.

남은 실기기 확인:

- Android 13 이상과 iOS에서 최초 권한 허용·거부 및 설정 화면 복귀 후 상태가 맞는지 확인한다.
- foreground에서 배너·목록·소리가 표시되고 background와 cold start 알림 선택이 Task 상세로 이동하는지 확인한다.
- 시간 일정은 시작 시각, 종일 일정은 오전 9시에 한 번만 수신되는지 확인한다.
- 완료·삭제·Inbox 이동·반복 occurrence 건너뛰기 뒤 기존 예약이 제거되는지 확인한다.
- 로그아웃과 다른 계정 로그인 뒤 이전 계정 제목이 알림에 남지 않는지 확인한다.
- 시간대 또는 기기 날짜 변경 후 앱 활성화 동기화가 예약 시각을 다시 맞추는지 확인한다.

## 빌드 식별자

출시 빌드 전 확정 필요:

- Android package
- iOS bundle identifier
- EAS profile
- 앱 표시 이름
- scheme 유지 여부: `todolab`

식별자는 확정됐으며 store 제출 전 versionCode·buildNumber와 배포 범위를 결정한다.

현재 상태:

- `app.json`에 `scheme: "todolab"`은 설정되어 있다.
- Android package는 `com.todolab.mobile`로 설정했다.
- iOS bundle identifier는 `com.todolab.mobile`로 설정했다.
- Android versionCode는 `1`로 시작한다.
- 앱 표시 이름은 `ToDoLab`, scheme은 `todolab`으로 유지한다.
- `npm run check:release-assets`로 앱 이름, slug, scheme, icon/splash/favicon 경로와 PNG 크기를 자동 점검한다.
- `eas.json`에 `development`, `preview`, `production` profile을 추가했다.
- Expo project `owner`는 `hyunseung2`, project id는 `f49103dc-1d93-47a9-8972-4b5a4cc9e395`로 연결했다.
- `runtimeVersion`, OTA `updates` 정책은 아직 정하지 않았다.

확정 시 입력 위치:

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "..."
    },
    "android": {
      "package": "..."
    }
  }
}
```

현재 `eas.json` profile을 변경할 때는 다음 결정을 함께 확인한다.

- development build 필요 여부
- preview/internal distribution 사용 여부
- production auto increment 정책
- Android artifact: apk 또는 aab
- iOS simulator build 필요 여부
- 환경별 `EXPO_PUBLIC_API_MODE`, `EXPO_PUBLIC_API_URL` 주입 방식

후보 형식:

| 항목                  | 후보 또는 기준       | 확정 필요                                |
| --------------------- | -------------------- | ---------------------------------------- |
| Android package       | `com.todolab.mobile` | 개인 APK 기준 확정, store 전 재검토      |
| iOS bundle identifier | `com.todolab.mobile` | 개인 APK 기준 확정, Apple Team 전 재검토 |
| EAS project owner     | `hyunseung2`         | 개인 APK 기준 확정                       |
| scheme                | `todolab` 유지       | 필요 시                                  |

식별자 또는 EAS project를 변경하면 같은 커밋에서 확인할 항목:

- `app.json` 식별자
- `eas.json`
- README 실행/빌드 설명
- Release checklist의 배포 식별자 항목
- `npm run validate`

## Android signing credential

현재 방침:

- 개인 APK 단계에서는 EAS managed credential을 우선 사용한다.
- 실제 keystore, password, key alias, key password는 저장소와 문서에 남기지 않는다.
- `.gitignore`는 `.jks`, `.p8`, `.p12`, `.key`, `.mobileprovision`, `.pem`을 제외한다.

EAS 연결 후 확인:

- `eas credentials --platform android`에서 managed credential이 생성 또는 연결되어 있는지 확인한다. 2026-08-03 preview profile 기준 EAS managed JKS credential을 확인했다.
- credential 접근 권한이 Expo 개인 계정 또는 조직에 남아 있는지 확인한다. 2026-08-03 현재 `hyunseung2` owner project에서 접근 가능하다.
- keystore export가 필요하면 안전한 vault에 별도 보관하고, 저장소에는 `EAS managed` 또는 `secure vault backup`처럼 비밀 없는 상태만 기록한다.
- credential을 변경하면 기존 APK update install과 Play Store 업로드 호환성에 영향을 줄 수 있으므로 release note에 남긴다.
