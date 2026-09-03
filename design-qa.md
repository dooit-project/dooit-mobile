# iOS Quick Capture Widget Design QA

final result: blocked

## Comparison target

- Source visual truth: [`docs/audits/quick-capture-widget-2026-09-03/reference-selected.png`](./docs/audits/quick-capture-widget-2026-09-03/reference-selected.png)
- Implementation: `src/widgets/quick-capture-widget.ios.tsx`
- Native target: iOS `systemSmall`
- Interaction target: `dooit://tasks/new?quickCapture=1`

## Implemented fidelity surfaces

- Typography: `dooit` brand, `빠른 기록` heading, two-line helper, large `+` action hierarchy retained.
- Spacing/layout: single compact action with 18pt content inset; lists, schedules, and metrics omitted.
- Colors: Dooit white, muted blue, and neutral text adapted for light·dark·tinted rendering modes.
- Decoration: image concept's background marks and shadow intentionally removed for a quiet native widget surface.
- Accessibility: the whole widget has one label and hint, and one deep-link action.

## Static and bundle evidence

- `expo-widgets ~56.0.27` and `@expo/ui ~56.0.26` aligned with Expo SDK 56.
- Default app config excludes `expo-widgets`.
- Prototype config creates only `QuickCaptureWidget` with `systemSmall`, `pj.dooit.ExpoWidgetsTarget`, and `group.pj.dooit`.
- iOS Expo export completes with the widget-enabled environment.
- `quickCapture=1` enables title `TextInput` autofocus and is covered by a unit test.

## Blocking evidence

- The active developer directory is `/Library/Developer/CommandLineTools`; full Xcode is unavailable.
- `xcodebuild` cannot run and `simctl` is absent, so a WidgetKit home-screen screenshot cannot be captured locally.
- A browser capture cannot represent an iOS home-screen widget, dark/tinted WidgetKit rendering, or app-terminated cold-start behavior.

## Required follow-up

1. Build the `quick-capture-widget` EAS profile for iOS or open the project on a Mac with full Xcode and an iOS simulator runtime.
2. Capture `systemSmall` in light, dark, and tinted modes.
3. Compare the native capture with the selected source in one image and fix visible mismatches.
4. Verify widget tap from an app-terminated state through auth bootstrap to focused composer.
5. Change `final result` to `passed` only after those checks succeed.
