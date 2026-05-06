# Lingkod-Ani Mobile

Flutter mobile companion for AEWs and barangay staff.

## Why this app exists

The main Lingkod-Ani web dashboard stays as the full operations center.
This mobile app is the field companion for:

- quick staff login
- overview counts
- recent SMS concerns
- farmer lookup
- knowledge search with the same backend

Farmers still use SMS. Staff can now use both web and mobile.

## Architecture

- No Django added
- Same Lingkod-Ani backend and Firebase-based identity model
- Mobile uses:
  - Firebase Identity Toolkit REST sign-in
  - existing Next.js API routes
  - new mobile-focused API routes under `/api/mobile/*`

## Default config

The app defaults to:

- `API_BASE_URL=https://lingkod-ani.com`
- no bundled Firebase web API key

Provide the Firebase values at build time:

```bash
flutter run --dart-define=API_BASE_URL=https://lingkod-ani.com --dart-define=FIREBASE_WEB_API_KEY=YOUR_KEY
```

## Real Android push notifications

The mobile app now includes real Firebase Cloud Messaging registration and
backend token storage for urgent case alerts.

To make Android push notifications live, add the missing Android Firebase app
ID during your local build:

```bash
flutter run --dart-define-from-file=firebase_push.env
```

Use [firebase_push.env.example](C:/Users/hwawei/Desktop/LINGKOD-ANI%20DEMO/lingkodani-demo/mobile_app/firebase_push.env.example)
as your template and fill in:

- `MOBILE_FIREBASE_ANDROID_APP_ID`
- `FIREBASE_WEB_API_KEY`

The backend route `/api/mobile/push` will register the device token and subscribe
the device to the Lingkod-Ani staff alert topic. Urgent live SMS cases can then
fan out to logged-in staff devices.

If the Android Firebase app ID is missing, the mobile app will continue working,
but push registration safely stays disabled instead of breaking sign-in.

Before the first physical-device run, you can check your local Android readiness with:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\verify-android-readiness.ps1
```

This checks:

- `flutter` in PATH
- `adb` in PATH
- `google-services.json`
- `firebase_push.env`
- the required Firebase Android keys

It will also run `flutter doctor -v` and show connected Android devices when those tools are available.

Official Firebase references:

- [Flutter setup](https://firebase.google.com/docs/flutter/setup)
- [Cloud Messaging for Flutter](https://firebase.google.com/docs/cloud-messaging/flutter/get-started)
- [Send messages with the Admin SDK](https://firebase.google.com/docs/cloud-messaging/send/admin-sdk)

## Useful commands

```bash
flutter pub get
flutter analyze
flutter test
flutter run
flutter build appbundle --release
```

## Play internal testing checklist

1. Create an Android upload keystore.
2. Copy `mobile_app/android/key.properties.example` to `mobile_app/android/key.properties`.
3. Fill in the real keystore path, alias, and passwords.
   Use `../lingkodani-upload-keystore.jks` if the keystore sits directly inside `mobile_app/android/`.
4. Build the Android App Bundle:

```bash
flutter build appbundle --release
```

5. Upload the generated `.aab` from:

```text
mobile_app/build/app/outputs/bundle/release/app-release.aab
```

6. Use the public privacy policy URL for Play Console:

```text
https://lingkod-ani.com/privacy-policy
```

The Flutter Android release build now supports a real upload key. If
`mobile_app/android/key.properties` is missing, local release builds still fall
back to the debug signing config for validation, but Play Console uploads should
use your real upload keystore.

## Current scope

This first mobile pass is intentionally focused on the highest-value field workflows:

- login
- overview
- SMS feed
- farmers list
- knowledge search

The web dashboard remains the full admin and management surface.
