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
- the current Firebase web API key used by the web app

You can override them at build time:

```bash
flutter run --dart-define=API_BASE_URL=https://lingkod-ani.com --dart-define=FIREBASE_WEB_API_KEY=YOUR_KEY
```

## Useful commands

```bash
flutter pub get
flutter analyze
flutter test
flutter run
```

## Current scope

This first mobile pass is intentionally focused on the highest-value field workflows:

- login
- overview
- SMS feed
- farmers list
- knowledge search

The web dashboard remains the full admin and management surface.
