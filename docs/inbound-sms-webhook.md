# Inbound SMS Webhook

The app now accepts inbound SMS payloads at:

`POST /api/webhooks/inbound-sms`

This route is provider-tolerant and currently accepts:

- Generic JSON: `phone`, `message`
- Twilio-style form payloads: `From`, `Body`, `MessageSid`
- Semaphore-style payloads: `sender`, `message`, `message_id`
- SMSGate JSON events such as `sms:received` with nested `payload.sender`, `payload.message`, and `payload.messageId`

The webhook does not write directly into browser state. Instead it:

1. normalizes the inbound payload
2. analyzes the SMS
3. places it into an in-memory server queue
4. lets the client-side data provider pull it into the demo state

This is appropriate for local demos and development. It is not durable storage.

## Generic test

```bash
curl -X POST http://localhost:3000/api/webhooks/inbound-sms \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"+639171234567\",\"message\":\"Baha na po sa mababang bahagi ng taniman namin.\"}"
```

## Twilio-style test

```bash
curl -X POST http://localhost:3000/api/webhooks/inbound-sms \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=%2B639171234567&Body=May peste po sa palay namin&MessageSid=SM123"
```

## Optional auth

If you set `INBOUND_SMS_WEBHOOK_TOKEN`, the webhook expects either:

- `x-webhook-token: <token>`
- `Authorization: Bearer <token>`

If you use SMSGate's `Signing Key`, you can also set:

```env
SMSGATE_WEBHOOK_SIGNING_KEY=your_signing_key
```

The route will then verify `X-Timestamp` and `X-Signature` headers from SMSGate.

## SMSGate example

```json
{
  "event": "sms:received",
  "payload": {
    "messageId": "lingkodani-001",
    "sender": "+639171234567",
    "message": "May peste po sa palay namin.",
    "receivedAt": "2026-03-15T09:00:00Z"
  }
}
```

## Demo behavior

The client polls:

`POST /api/webhooks/inbound-sms/consume`

and imports queued inbound messages into the shared app state so they appear in:

- SMS Feed
- Dashboard stats
- Active Issues
- Risk Center
- Reports
