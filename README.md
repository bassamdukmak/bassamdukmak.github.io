# Phoenix United FC

Conversion-led website and player-evaluation intake for Phoenix United FC.
It runs on vinext/Cloudflare, stores every accepted enquiry in D1, captures
campaign attribution, and can deliver queued leads to the club CRM by webhook.

## Local development

```bash
npm install
npm run dev
npm run build
npm test
```

Local D1 state is stored under `.wrangler/`.

## Lead delivery

The form saves to D1 before returning success. Set these runtime variables to
activate CRM delivery:

```bash
CRM_WEBHOOK_URL=https://crm.example/webhooks/phoenix
CRM_WEBHOOK_SECRET=replace-with-the-crm-bearer-secret
CRM_SYNC_SECRET=replace-with-a-long-queue-drain-secret
```

`CRM_WEBHOOK_URL` and `CRM_WEBHOOK_SECRET` must be configured together. The
site keeps leads queued instead of attempting unauthenticated CRM delivery when
either value is missing.

Each CRM request includes an `Idempotency-Key` such as `PX-00001`. Failed
deliveries stay queued and are retried on later submissions. An authorised
operator can also drain up to 50 queued records:

```bash
curl -X POST https://site.example/api/leads/sync \
  -H "Authorization: Bearer $CRM_SYNC_SECRET"
```

The exact field contract and sample request are documented in
`CRM_WEBHOOK.md`.

## Campaign measurement

Google Analytics and Meta Pixel load only after the visitor accepts analytics
and advertising measurement. Configure their public measurement IDs as hosted
runtime values:

```bash
GA4_MEASUREMENT_ID=G-XXXXXXXXXX
META_PIXEL_ID=123456789012345
```

A `generate_lead` / `Lead` conversion is recorded only when a new lead has
been saved successfully. UTM parameters and click IDs are stored with the lead
regardless of the visitor's tracking choice.

## Live Instagram feed

The footer loads the latest public media from the official Instagram API for a
Phoenix professional account. Configure these hosted runtime values:

```bash
INSTAGRAM_USER_ID=replace-with-the-instagram-user-id
INSTAGRAM_ACCESS_TOKEN=replace-with-a-long-lived-server-token
INSTAGRAM_GRAPH_BASE_URL=https://graph.instagram.com
INSTAGRAM_API_VERSION=v25.0
```

The access token stays server-side. If Meta is unavailable or the connection is
not configured, the site links directly to `@phoenix_utdfc` instead of showing
stale local photos.

Meta's media endpoint does not expose the profile's pinned state. To keep known
pinned posts first, add their comma-separated media IDs:

```bash
INSTAGRAM_PINNED_MEDIA_IDS=media-id-one,media-id-two
```

## Project map

- `app/page.tsx` — conversion page and short player/partner lead forms
- `app/api/leads/route.ts` — validation, persistence, and delivery trigger
- `app/api/leads/sync/route.ts` — protected queue drain
- `app/api/instagram/route.ts` — server-only Instagram media connection
- `db/` and `drizzle/` — lead schema and migrations
- `PRODUCT.md` and `DESIGN.md` — approved content and visual guardrails
