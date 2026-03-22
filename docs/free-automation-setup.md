# Free Automation Setup

Kung wala pang Vercel Pro, puwede pa ring magpatakbo ng mas madalas na automation checks ang Lingkod-Ani gamit ang libreng external scheduler.

## Pinakasimpleng Libreng Opsyon: GitHub Actions

May naka-ready nang workflows sa:

- `.github/workflows/automation-overdue.yml`
- `.github/workflows/automation-followups.yml`

### Ano ang ginagawa nila

- `automation-overdue.yml` tumatama sa `/api/system/process-overdue-sms` kada `15 minutes`
- `automation-followups.yml` tumatama sa `/api/system/process-follow-ups` kada `30 minutes`

Pareho silang gumagamit ng secure bearer token, kaya hindi open sa public ang endpoints.

## Kailangan mong i-set sa GitHub Secrets

Sa GitHub repository:

1. Open `Settings`
2. Open `Secrets and variables`
3. Open `Actions`
4. Add these repository secrets:

### `LINGKOD_ANI_BASE_URL`

Halimbawa:

```text
https://lingkod-ani.com
```

### `SYSTEM_AUTOMATION_TOKEN`

Dapat pareho ito ng value ng `SYSTEM_AUTOMATION_TOKEN` sa Vercel Production environment variables.

## Kailangan ding i-set sa Vercel

Sa Vercel Production environment variables, siguraduhing mayroon nito:

```text
SYSTEM_AUTOMATION_TOKEN=isang-mahabang-random-secret
```

Kung gusto mo, puwede mong gamitin ang existing value ng `CRON_SECRET`, pero mas malinaw kung hiwalay ang `SYSTEM_AUTOMATION_TOKEN`.

## Bakit ito maganda sa free setup

- hindi nakaasa sa Vercel Hobby daily-only cron
- puwede pa ring mag-run nang mas madalas
- may manual `Run workflow` button pa sa GitHub Actions kung gusto mong i-trigger agad

## Optional na Libreng Alternatibo

Puwede ring gumamit ng Cloudflare Workers Cron Triggers bilang external scheduler, pero mas simple para sa karamihan ang GitHub Actions dahil nasa GitHub na ang codebase at walang hiwalay na worker project na ise-setup.

## Paalala

- Ang GitHub Actions scheduler ay best-effort at puwedeng may maliit na delay minsan.
- Dahil may automation lock na ang app, ligtas na may fallback daily Vercel cron pa rin habang naka-on ang GitHub Actions.
