# Live Mode Setup

## 1. Environment

Copy `.env.example` to `.env.local` and set:

```env
APP_MODE=live
NEXT_PUBLIC_APP_MODE=live
ENABLE_REAL_SMS=false
NEXT_PUBLIC_ENABLE_REAL_SMS=false
```

Add your Firebase web config:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

For server-side webhook, scheduler, seeding, and delivery-status routes, add one Firebase Admin option.

Option A: direct env values

```env
FIREBASE_ADMIN_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="[PASTE_YOUR_ESCAPED_PRIVATE_KEY_HERE]"
```

Option B: downloaded service-account JSON path

```env
FIREBASE_ADMIN_CREDENTIALS_PATH=C:\path\to\lingkod-ani-firebase-adminsdk.json
```

Option C: Google-style credential path

```env
GOOGLE_APPLICATION_CREDENTIALS=C:\path\to\lingkod-ani-firebase-adminsdk.json
```

Option D: full JSON blob in one variable

```env
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"...","private_key":"[PASTE_ESCAPED_PRIVATE_KEY_HERE]","client_email":"..."}
```

Option E: application default credentials

```env
FIREBASE_USE_APPLICATION_DEFAULT=true
```

Use Option E only if this machine already has Google application default credentials configured.

To get a service-account JSON from Firebase Console:

1. Open your Firebase project.
2. Go to `Project settings`.
3. Open the `Service accounts` tab.
4. Click `Generate new private key`.
5. Save the JSON file somewhere outside version control, or in the repo root using a git-ignored name like `firebase-admin-lingkod-ani.json`.

## 2. Firestore rules

Deploy `firestore.rules` to your Firebase project.

These starter rules require authenticated access for:

- `farmers`
- `smsMessages`
- `auditLogs`
- `outboundMessages`
- `resources`
- `marketPrices`
- `alertHistory`
- `assistanceRecords`
- `fieldVisitTasks`
- `knowledgeArticles`
- `vouchers`
- `users`
- `systemSettings`
- `logbookEntries`

## 3. Firebase Authentication

Enable **Email/Password** sign-in in your Firebase project.

Create at least one admin user in Firebase Authentication. That account will be used by the live-mode login page.

## 4. Seed data

Run:

```bash
npm run seed:firestore
```

This seeds:

- `farmers`
- `smsMessages`
- `auditLogs`
- `resources`
- `marketPrices`
- `alertHistory`
- `assistanceRecords`
- `fieldVisitTasks`
- `knowledgeArticles`
- `vouchers`

## 5. Firebase CLI and Console flow

If you have not connected the CLI yet, run:

```bash
npx firebase-tools login
npx firebase-tools use --add lingkod-ani
npx firebase-tools deploy --only firestore:rules --project lingkod-ani
npm run firebase:doctor
```

In Firebase Console, make sure you also:

1. Enable `Firestore Database`.
2. Enable `Authentication` with `Email/Password`.
3. Register the web app and copy its Firebase web config into `.env.local`.
4. Generate the Firebase Admin service-account JSON if you want to seed or use server-side live webhooks.

## 6. Inbound SMS

Use the webhook endpoint:

```bash
POST /api/webhooks/inbound-sms
```

In `APP_MODE=live`, inbound SMS is persisted directly to Firestore.

## 7. Outbound SMS

Supported live provider modes:

- `generic`
- `smsgate`
- `twilio`
- `semaphore`

Set:

```env
LIVE_SMS_PROVIDER=generic
```

For server-side timeout automation, also set:

```env
SYSTEM_AUTOMATION_TOKEN=your_secure_random_token
CRON_SECRET=your_secure_random_token
```

For SMSGate:

```env
LIVE_SMS_PROVIDER=smsgate
SMSGATE_USERNAME=your_smsgate_username
SMSGATE_PASSWORD=your_smsgate_password
SMSGATE_DEVICE_ID=your_device_id
SMSGATE_BASE_URL=https://api.sms-gate.app/3rdparty/v1
SMSGATE_SEND_ENDPOINT=
SMSGATE_SIM_NUMBER=1
SMSGATE_DEVICE_ACTIVE_WITHIN=12h
SMSGATE_SKIP_PHONE_VALIDATION=true
SMSGATE_WEBHOOK_SIGNING_KEY=
```

Notes:

- Use the SMSGate cloud server whenever your Lingkod-Ani app is deployed on the internet.
- `SMSGATE_SEND_ENDPOINT` is optional. Leave it blank for the normal cloud API. Use it only if you intentionally want to hit the phone's local server endpoint directly.
- If you set a Signing Key in the SMSGate app, put the same value into `SMSGATE_WEBHOOK_SIGNING_KEY`.

For Twilio:

```env
LIVE_SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_FROM_NUMBER=...
```

For Semaphore:

```env
LIVE_SMS_PROVIDER=semaphore
SEMAPHORE_API_KEY=...
SEMAPHORE_SENDER_NAME=...
```

For a generic outbound webhook:

```env
LIVE_SMS_PROVIDER=generic
GENERIC_SMS_WEBHOOK_URL=https://your-endpoint.example/send
GENERIC_SMS_WEBHOOK_TOKEN=...
```

## 8. Android SMS gateway plan

You do not need to use your personal phone as the permanent gateway.

- Staff and officials can keep using the Lingkod-Ani web app on their own phones or computers.
- Only one Android device needs the SIM and SMS gateway app.
- For pilot use, a spare office Android is the safest setup.
- Your personal phone is still fine for short testing.

Recommended setup:

1. Put the barangay SIM in one always-on Android phone.
2. Install the SMS gateway app on that phone.
3. Turn on the app's `Cloud server` mode and keep the device `ONLINE`.
4. Put the cloud `Username`, `Password`, and `Device ID` into Lingkod-Ani's `.env.local` as the `SMSGATE_*` values.
5. Register these webhook events in SMSGate:
   - `sms:received` -> `POST /api/webhooks/inbound-sms`
   - `sms:sent` -> `POST /api/webhooks/outbound-sms/status`
   - `sms:delivered` -> `POST /api/webhooks/outbound-sms/status`
   - `sms:failed` -> `POST /api/webhooks/outbound-sms/status`
6. If you use SMSGate's `Signing Key`, copy it into `SMSGATE_WEBHOOK_SIGNING_KEY`.
7. Keep that gateway phone plugged in, with battery optimization disabled.

Important:

- No SIM means no real inbound or outbound SMS. The app can be configured without a SIM, but it cannot actually send or receive farmer texts until a working SIM is installed.
- Make sure the SIM can both send and receive SMS and has enough load or a plan for pilot traffic.

## 9. Current limitation

Live mode now uses Firestore-backed records, but authentication and Firestore security should still be hardened before field deployment.

## 10. Overdue SMS automation

To process overdue `pending_approval` SMS on the server side, call:

```bash
curl -X POST http://localhost:3000/api/system/process-overdue-sms \
  -H "Authorization: Bearer YOUR_SYSTEM_AUTOMATION_TOKEN"
```

To process due follow-up messages, call:

```bash
curl -X POST http://localhost:3000/api/system/process-follow-ups \
  -H "Authorization: Bearer YOUR_SYSTEM_AUTOMATION_TOKEN"
```

This route is intended for a scheduler such as:

- Vercel Cron
- GitHub Actions cron
- Firebase scheduled functions
- an external uptime/cron service

The processor sends fallback replies for overdue messages and persists:

- `autoReplySentAt`
- audit log entries
- logbook entries
- outbound message records

## 11. Outbound delivery receipts

If your SMS provider can send delivery callbacks, point it to:

```bash
POST /api/webhooks/outbound-sms/status
```

Use `OUTBOUND_STATUS_WEBHOOK_TOKEN` or reuse `INBOUND_SMS_WEBHOOK_TOKEN` for webhook authorization.
