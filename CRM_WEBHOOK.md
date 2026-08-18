# Phoenix website CRM webhook

The website stores every accepted lead before attempting CRM delivery. CRM
timeouts and non-2xx responses leave the lead queued for retry.

## Request

```http
POST /your-phoenix-lead-endpoint
Content-Type: application/json
Authorization: Bearer <CRM_WEBHOOK_SECRET>
Idempotency-Key: PX-00001
```

```json
{
  "event": "phoenix.website.lead.created",
  "leadReference": "PX-00001",
  "stage": "New",
  "submittedAt": "2026-07-26 18:42:10",
  "leadType": "player",
  "applicantRole": "player",
  "guardianName": "Example Guardian",
  "fullName": "Example Player",
  "email": "player@example.com",
  "phone": "+971500000000",
  "country": "United Arab Emirates",
  "playerAge": 20,
  "position": "midfielder",
  "currentClub": "Example FC",
  "playingLevel": "semi_professional",
  "highlightUrl": "https://www.youtube.com/watch?v=example-player",
  "educationLevel": "secondary_school",
  "intendedStudy": "Business Management",
  "preferredRoute": "football_degree",
  "preferredHub": "dubai",
  "accommodationPreference": "residential",
  "preferredIntake": "September 2026",
  "goal": "I want to develop in a demanding football environment while completing my degree.",
  "organization": "",
  "partnerInterest": "",
  "message": "",
  "contactPreference": "whatsapp",
  "consent": true,
  "sourceUrl": "https://phoenixutd.com/?utm_source=instagram&utm_campaign=founding-class",
  "referrer": "https://www.instagram.com/",
  "utmSource": "instagram",
  "utmMedium": "social",
  "utmCampaign": "founding-class",
  "utmContent": "training-reel",
  "utmTerm": "",
  "gclid": "",
  "fbclid": "example-click-id",
  "language": "en-AE",
  "timezone": "Asia/Dubai",
  "formVariant": "pathway-assessment-v3"
}
```

Partnership leads use the same contract with `leadType: "partner"`,
`applicantRole: "partner"`, and populated `organization`, `partnerInterest`,
and `message` fields. Player-only fields remain present as empty strings or
`null`, preserving one stable CRM contract.

## Player assessment values

- `applicantRole`: `player`, `parent_guardian`, or `agent_adviser`
- `preferredRoute`: `football_degree`, `football_only`, `us_scholarship`,
  `international_camps`, or `not_sure`
- `preferredHub`: `dubai`, `manchester`, `portugal`, or `us_route`
- `accommodationPreference`: `residential`, `non_residential`, or `discuss`
- `contactPreference`: `whatsapp` or `email`

The website accepts player assessments only for ages 18–25. It also requires
the parent or guardian name, position, current club (or `Unattached`), playing
level, a public HTTP(S) highlight link, education level, preferred intake, a
goal of at least 20 characters, valid contact details, and consent.

## Response and retry rules

- Return any `2xx` response only after the CRM has durably accepted the lead.
- The CRM must treat `Idempotency-Key` as unique and return success for a
  repeated request that was already accepted.
- Any timeout, network error, or non-2xx response keeps the lead queued.
- The website stores at most the first 500 characters of the CRM response for
  delivery diagnostics.

The protected `POST /api/leads/sync` endpoint drains up to 50 queued leads when
called with `Authorization: Bearer <CRM_SYNC_SECRET>`.
