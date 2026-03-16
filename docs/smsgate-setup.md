# SMSGate Setup

Use this guide when Lingkod-Ani will send and receive real SMS through the SMSGate Android app.

## 1. What you need

- One Android phone with the SMSGate app installed
- One working SIM card that can send and receive SMS
- Mobile signal and internet connection on that phone
- A public HTTPS URL for your Lingkod-Ani app
- The phone left online, plugged in, and allowed to run in the background

Without a SIM card, SMSGate cannot send or receive real farmer messages.

## 2. Best mode

Use the SMSGate `Cloud server` mode for Lingkod-Ani.

This is the simplest setup because your deployed app can call the SMSGate cloud API directly. The phone's `Local server` mode is mainly useful only when your server can reach the phone on the same network.

## 3. Values to copy from SMSGate

From the app's `Cloud server` section, copy:

- `Username`
- `Password`
- `Device ID`

Optional:

- `Signing Key` from `Settings -> Webhooks`

## 4. Lingkod-Ani environment

Set these in `.env.local`:

```env
LIVE_SMS_PROVIDER=smsgate
NEXT_PUBLIC_LIVE_SMS_PROVIDER=smsgate
ENABLE_REAL_SMS=false
NEXT_PUBLIC_ENABLE_REAL_SMS=false

SMSGATE_USERNAME=...
SMSGATE_PASSWORD=...
SMSGATE_DEVICE_ID=...
SMSGATE_BASE_URL=https://api.sms-gate.app/3rdparty/v1
SMSGATE_SIM_NUMBER=1
SMSGATE_DEVICE_ACTIVE_WITHIN=12h
SMSGATE_SKIP_PHONE_VALIDATION=true
SMSGATE_WEBHOOK_SIGNING_KEY=
```

Leave `ENABLE_REAL_SMS=false` until the webhook test succeeds.

## 5. Webhooks to register in SMSGate

Register these webhook URLs:

- `sms:received` -> `https://your-domain/api/webhooks/inbound-sms`
- `sms:sent` -> `https://your-domain/api/webhooks/outbound-sms/status`
- `sms:delivered` -> `https://your-domain/api/webhooks/outbound-sms/status`
- `sms:failed` -> `https://your-domain/api/webhooks/outbound-sms/status`

If you set a Signing Key in SMSGate, use the same value in `SMSGATE_WEBHOOK_SIGNING_KEY`.

## 6. Order of testing

1. Turn on `Cloud server`.
2. Keep the phone `ONLINE`.
3. Install the SIM.
4. Confirm the SIM can send and receive a normal text in the phone's default SMS app.
5. Register the four webhook events above.
6. Run `npm.cmd run firebase:doctor`.
7. Send a test SMS from another phone to the gateway phone.
8. Confirm it appears in Lingkod-Ani `SMS Feed`.
9. Turn on `ENABLE_REAL_SMS=true` only after inbound works.
10. Send a reply from Lingkod-Ani and confirm SMSGate sends it.

## 7. Common issues

- No SIM: real SMS will not work.
- No mobile signal: delivery will fail even if the app is online.
- Battery optimization on: Android may stop the app in the background.
- Wrong webhook URL: inbound SMS will arrive on the phone but not in Lingkod-Ani.
- Missing signing key match: webhook requests will be rejected.
- Wrong `Device ID`: outbound send requests may target the wrong device or fail.
