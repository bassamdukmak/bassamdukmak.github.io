import assert from "node:assert/strict";
import test from "node:test";
import { env as workerEnv } from "./cloudflare-workers.mock.mjs";
import { FakeD1 } from "./fake-d1.mjs";

const templateRoot = new URL("../", import.meta.url);
let workerSequence = 0;

async function worker() {
  const workerUrl = new URL("dist/server/index.js", templateRoot);
  workerUrl.searchParams.set("test", `${process.pid}-${workerSequence++}`);
  const workerModule = await import(workerUrl.href);
  return workerModule.default;
}

const runtimeEnv = {
  ASSETS: {
    fetch: async () => new Response("Not found", { status: 404 }),
  },
};

const runtimeContext = {
  waitUntil() {},
  passThroughOnException() {},
};

const configuredKeys = [
  "DB",
  "CRM_WEBHOOK_URL",
  "CRM_WEBHOOK_SECRET",
  "CRM_SYNC_SECRET",
  "GA4_MEASUREMENT_ID",
  "META_PIXEL_ID",
  "INSTAGRAM_USER_ID",
  "INSTAGRAM_ACCESS_TOKEN",
  "INSTAGRAM_GRAPH_BASE_URL",
  "INSTAGRAM_API_VERSION",
  "INSTAGRAM_PINNED_MEDIA_IDS",
];

function configureWorkerEnv(values = {}) {
  for (const key of configuredKeys) delete workerEnv[key];
  Object.assign(workerEnv, values);
}

function birthDateForAge(age) {
  const today = new Date();
  return `${today.getUTCFullYear() - age}-${String(
    today.getUTCMonth() + 1,
  ).padStart(2, "0")}-${String(today.getUTCDate()).padStart(2, "0")}`;
}

function validPlayer(overrides = {}) {
  return {
    leadType: "player",
    idempotencyKey: "test-idempotency-key-12345",
    fullName: "Test Player",
    email: "player@example.com",
    phone: "+971500000000",
    country: "United Arab Emirates",
    dateOfBirth: birthDateForAge(20),
    nationality: "Syrian",
    position: "midfielder",
    currentClub: "Test FC",
    playingLevel: "professional_academy_or_pro_youth",
    highlightUrl: "https://www.youtube.com/watch?v=phoenix-test",
    preferredRoute: "football_degree",
    preferredHub: "dubai",
    readinessTimeline: "next_3_6_months",
    budgetReadiness: "needs_payment_plan",
    familySupport: "fully_involved_supportive",
    referralName: "Coach Example",
    consent: true,
    formStartedAt: Date.now() - 5_000,
    ...overrides,
  };
}

function submitLead(app, payload, headers = {}) {
  return app.fetch(
    new Request("http://localhost/api/leads", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost",
        ...headers,
      },
      body: JSON.stringify(payload),
    }),
    runtimeEnv,
    runtimeContext,
  );
}

test("server-renders the Phoenix club homepage", async () => {
  configureWorkerEnv();
  const app = await worker();
  const response = await app.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html", host: "localhost" },
    }),
    runtimeEnv,
    runtimeContext,
  );

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(
    html,
    /<title>Phoenix United FC \| Football Club in Dubai<\/title>/i,
  );
  assert.match(html, /property="og:image" content="http:\/\/localhost\/og-share\.png"/i);
  assert.match(html, /built to rise/i);
  assert.match(html, /UAE FA Licensed/i);
  assert.match(html, /More than the 90 minutes/i);
  assert.match(html, /Built from experience/i);
  assert.match(html, /People who believed in the vision/i);
  assert.match(html, /Manchester roots/i);
  assert.match(html, /Radcliffe FC/i);
  assert.match(html, /Manchester/i);
  assert.match(html, /Silves FC/i);
  assert.match(html, /media\/phoenix-number-10-hero-v2\.webp/i);
  assert.match(html, /partners\/uae-fa\.svg/i);
  assert.match(html, /partners\/radcliffe-crest\.svg/i);
  assert.match(html, /partners\/silves-crest\.webp/i);
  assert.match(html, /partners\/wimbledon-wealth-white\.png/i);
  assert.match(html, /partners\/cheat-daze-transparent\.png/i);
  assert.match(html, /partners\/farellys-transparent\.png/i);
  assert.match(html, /partners\/spsa-white\.png/i);
  assert.match(html, /JoeThompsonFoundation/i);
  const orderedPartnerAssets = [
    "partners/uae-fa.svg",
    "partners/radcliffe-crest.svg",
    "partners/silves-crest.webp",
    "partners/wimbledon-wealth-white.png",
    "partners/cheat-daze-transparent.png",
    "partners/farellys-transparent.png",
  ].map((asset) => html.indexOf(asset));
  assert.ok(orderedPartnerAssets.every((position, index) => index === 0 || position > orderedPartnerAssets[index - 1]));
  for (const partner of [
    "UAE FA",
    "Radcliffe FC",
    "Silves FC",
    "Wimbledon Wealth",
    "Farellys",
    "Cheat Daze",
    "SPSA · Assess. Train. Succeed.",
  ]) {
    assert.equal(
      (html.match(new RegExp(`aria-label="Visit ${partner}"`, "gi")) ?? [])
        .length,
      2,
    );
  }
  assert.match(html, /href="https:\/\/wimbledonwealth\.com\/"/i);
  assert.match(html, /href="https:\/\/spsa-center\.com\/"/i);
  assert.match(html, /2026\/27 League Fixtures/i);
  assert.match(html, /32(?:<!-- -->)? fixtures · Two rounds/i);
  assert.match(html, /opponents\/pass\.png/i);
  assert.match(html, /opponents\/alshahama\.png/i);
  assert.ok((html.match(/Watch on Smashi TV/gi) ?? []).length >= 32);
  assert.doesNotMatch(html, /Our identity|Rebirth in the badge/i);
  assert.match(html, /Press &amp; announcements/i);
  assert.match(html, /Ex-Stockport player bounces back from cancer to set up Dubai club/i);
  assert.match(html, /bbc\.co\.uk\/news\/articles\/ce34wnvql9vo/i);
  assert.match(html, /Start Your Pathway/i);
  assert.match(html, /phoenix_utdfc/);
  assert.equal(
    (html.match(/aria-label="View Phoenix United post on Instagram"/gi) ?? [])
      .length,
    6,
  );
  for (const postId of [
    "DbTUyXZMALJ",
    "DcED-LpDNxZ",
    "Db3XkPUjCwh",
    "DcJUFVBCxjb",
    "DcJM863DIOp",
    "DcGvCg5CT8P",
  ]) {
    assert.match(html, new RegExp(postId));
  }
  assert.doesNotMatch(html, /Loading latest Instagram posts/i);
  assert.doesNotMatch(
    html,
    /codex-preview|SkeletonPreview|react-loading-skeleton/i,
  );
  assert.doesNotMatch(html, /AI-generated|AI concept image/i);
});

test("server-renders the complete Phoenix pathway assessment", async () => {
  configureWorkerEnv();
  const app = await worker();
  const response = await app.fetch(
    new Request("http://localhost/pathway", {
      headers: { accept: "text/html", host: "localhost" },
    }),
    runtimeEnv,
    runtimeContext,
  );

  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(
    html,
    /<title>Phoenix Football Network \| Football\. Degree\. Pathway\.<\/title>/i,
  );
  assert.match(html, /property="og:image" content="http:\/\/localhost\/og-share\.png"/i);
  assert.match(html, /Train with purpose/i);
  assert.match(html, /Play with direction/i);
  assert.match(html, /Football \+ Degree/i);
  assert.match(html, /Manchester/i);
  assert.match(html, /Silves, Algarve/i);
  assert.match(html, /Silves FC/i);
  assert.match(html, /media\/silves-stadium\.webp/i);
  assert.match(html, /media\/pathway-player-signing\.webp/i);
  assert.match(html, /media\/pathway-graduate-footballer\.webp/i);
  assert.match(html, /class="outcome-image-stack"/i);
  assert.doesNotMatch(html, /US College Route/i);
  assert.match(html, /About you/i);
  assert.match(html, /Football background/i);
  assert.match(html, /Route &amp; readiness/i);
  assert.match(html, /Date of birth/i);
  assert.match(html, /Nationality/i);
  assert.match(html, /Current country of residence/i);
  assert.match(html, /Phone \/ WhatsApp|WhatsApp number/i);
  assert.match(html, /data-form-variant="pathway-assessment-v4"/i);
  assert.doesNotMatch(html, /aria-label="Enquiry type"/i);
  assert.doesNotMatch(html, /assessment-partnership/i);
  assert.match(html, /<form\b[^>]*noValidate/i);
  assert.doesNotMatch(html, /guardianName|educationLevel|accommodationPreference/i);
  assert.doesNotMatch(html, /guaranteed scholarship|guaranteed contract/i);
});

test("server-renders partnership enquiries only on the Network page", async () => {
  configureWorkerEnv();
  const app = await worker();
  const response = await app.fetch(
    new Request("http://localhost/network", {
      headers: { accept: "text/html", host: "localhost" },
    }),
    runtimeEnv,
    runtimeContext,
  );

  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /media\/silves-team-huddle\.webp/i);
  assert.match(html, /media\/network-silves-aerial\.webp/i);
  for (const asset of [
    "network-football-programmes.webp",
    "network-camps-showcases.webp",
    "network-tournaments-events.webp",
    "network-education-study.webp",
  ]) {
    assert.match(html, new RegExp(`media/${asset}`));
  }
  assert.match(html, /id="partnership-enquiry"/i);
  assert.match(html, /data-form-variant="partnership-enquiry-v1"/i);
  assert.match(html, /Start a partnership conversation/i);
  assert.match(html, /assessment-partnership/i);
  assert.doesNotMatch(html, /aria-label="Enquiry type"/i);
  assert.doesNotMatch(html, /Player Pathway Assessment/i);
});

test("server-renders the planned store without a false checkout", async () => {
  configureWorkerEnv();
  const app = await worker();
  const response = await app.fetch(
    new Request("http://localhost/store", {
      headers: { accept: "text/html", host: "localhost" },
    }),
    runtimeEnv,
    runtimeContext,
  );

  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(
    html,
    /<title>Phoenix Home Kit \| Limited First Release<\/title>/i,
  );
  assert.match(
    html,
    /name="twitter:title" content="Phoenix Home Kit \| Limited First Release"/i,
  );
  assert.match(html, /property="og:image" content="http:\/\/localhost\/og\.png"/i);
  assert.match(html, /Limited first release · Black home kit/i);
  assert.match(html, /Shirt only/i);
  assert.match(html, /AED 150/i);
  assert.match(html, /£30/i);
  assert.match(html, /Full kit with shorts/i);
  assert.match(html, /AED 200/i);
  assert.match(html, /£40/i);
  assert.match(html, /This is an order request, not an online payment checkout/i);
  assert.match(html, /\/kits\/matchday-black-front\.webp/i);
  assert.match(html, />Back<\/button>/i);
  assert.match(html, />Shorts<\/button>/i);
  assert.doesNotMatch(html, /type="radio"/i);
  assert.doesNotMatch(html, /\/kits\/[^"']+\.jpe?g/i);
  assert.doesNotMatch(html, /sand|midnight|training-blue|warm-up/i);
  assert.doesNotMatch(html, /Add to cart|Proceed to checkout|Buy now/i);
});

test("privacy page renders route-specific social metadata", async () => {
  configureWorkerEnv();
  const app = await worker();
  const response = await app.fetch(
    new Request("http://localhost/privacy", {
      headers: { accept: "text/html", host: "localhost" },
    }),
    runtimeEnv,
    runtimeContext,
  );

  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(
    html,
    /property="og:title" content="Website Privacy Notice \| Phoenix United FC"/i,
  );
  assert.match(
    html,
    /property="og:url" content="http:\/\/localhost\/privacy"/i,
  );
  assert.match(
    html,
    /name="twitter:title" content="Website Privacy Notice \| Phoenix United FC"/i,
  );
  assert.doesNotMatch(
    html,
    /property="og:title" content="Phoenix United FC \| A football club/i,
  );
});

test("lead endpoint rejects incomplete submissions before storage", async () => {
  configureWorkerEnv();
  const app = await worker();
  const response = await submitLead(app, {
    leadType: "player",
    idempotencyKey: "test-idempotency-key-12345",
  });

  assert.equal(response.status, 400);
  const body = await response.json();
  assert.match(body.error, /valid name and email/i);
});

test("lead endpoint derives age from DOB and rejects players outside 18–25", async () => {
  configureWorkerEnv();
  const app = await worker();

  for (const age of [17, 26]) {
    const response = await submitLead(
      app,
      validPlayer({
        dateOfBirth: birthDateForAge(age),
        idempotencyKey: `test-age-${age}-key-123456789`,
      }),
    );

    assert.equal(response.status, 400);
    const body = await response.json();
    assert.match(body.error, /currently for ages 18–25/i);
    assert.doesNotMatch(body.error, /@phoenixutd\.com/i);
  }
});

test("player assessment rejects incomplete or invalid qualification fields", async () => {
  configureWorkerEnv();
  const app = await worker();
  const invalidCases = [
    [{ fullName: "A" }, /valid name and email/i],
    [{ email: "not-an-email" }, /valid name and email/i],
    [{ phone: "123456" }, /phone number and current country/i],
    [{ country: "" }, /phone number and current country/i],
    [{ consent: false }, /consent is required/i],
    [{ dateOfBirth: "not-a-date" }, /valid date of birth/i],
    [{ nationality: "" }, /nationality/i],
    [{ position: "striker" }, /player position/i],
    [{ currentClub: "" }, /current club/i],
    [{ playingLevel: "" }, /playing level/i],
    [{ playingLevel: "elite_invitation" }, /playing level/i],
    [{ highlightUrl: "http://127.0.0.1/highlights" }, /valid public match/i],
    [{ preferredRoute: "guaranteed_contract" }, /pathway route/i],
    [{ preferredHub: "algarve" }, /preferred phoenix hub/i],
    [{ readinessTimeline: "" }, /readiness timeline/i],
    [{ budgetReadiness: "" }, /budget readiness/i],
    [{ familySupport: "" }, /family support/i],
  ];

  for (const [overrides, expectedError] of invalidCases) {
    const response = await submitLead(
      app,
      validPlayer({
        ...overrides,
        idempotencyKey: `invalid-player-${crypto.randomUUID()}`,
      }),
    );

    assert.equal(response.status, 400);
    const body = await response.json();
    assert.match(body.error, expectedError);
  }
});

test("player DOB and supplied assessment answers are persisted", async () => {
  const database = new FakeD1();
  configureWorkerEnv({ DB: database });
  const app = await worker();
  const response = await submitLead(
    app,
    validPlayer({ idempotencyKey: "supplied-assessment-123456789" }),
  );
  assert.equal(response.status, 201);
  assert.equal(database.leads[0].applicant_role, "player");
  assert.equal(database.leads[0].date_of_birth, birthDateForAge(20));
  assert.equal(database.leads[0].player_age, 20);
  assert.equal(database.leads[0].nationality, "Syrian");
  assert.equal(database.leads[0].readiness_timeline, "next_3_6_months");
  assert.equal(database.leads[0].budget_readiness, "needs_payment_plan");
  assert.equal(database.leads[0].family_support, "fully_involved_supportive");
  assert.equal(database.leads[0].referral_name, "Coach Example");
});

test("partnership enquiry validation and persistence remain unchanged", async () => {
  const database = new FakeD1();
  configureWorkerEnv({ DB: database });
  const app = await worker();
  const response = await submitLead(app, {
    leadType: "partner",
    idempotencyKey: "partner-enquiry-unchanged-123456789",
    fullName: "Partner Contact",
    email: "partner@example.com",
    phone: "+971501111111",
    country: "United Arab Emirates",
    organization: "Example Football Group",
    partnerInterest: "club_academy",
    message:
      "We would like to discuss a structured club partnership with Phoenix.",
    dateOfBirth: birthDateForAge(22),
    nationality: "Stale nationality",
    preferredRoute: "football_degree",
    preferredHub: "dubai",
    position: "midfielder",
    currentClub: "Stale Player FC",
    playingLevel: "professional_academy_or_pro_youth",
    highlightUrl: "https://youtube.com/watch?v=stale-player",
    readinessTimeline: "next_1_3_months",
    budgetReadiness: "ready_full_pricing",
    familySupport: "fully_involved_supportive",
    referralName: "Stale referrer",
    collectionInterest: "matchday",
    contactPreference: "whatsapp",
    consent: true,
    formStartedAt: Date.now() - 5_000,
  });

  assert.equal(response.status, 201);
  assert.equal(database.leads.length, 1);
  assert.equal(database.leads[0].lead_type, "partner");
  assert.equal(database.leads[0].applicant_role, "partner");
  assert.equal(database.leads[0].organization, "Example Football Group");
  assert.equal(database.leads[0].guardian_name, "");
  assert.equal(database.leads[0].date_of_birth, "");
  assert.equal(database.leads[0].nationality, "");
  assert.equal(database.leads[0].preferred_hub, "");
  assert.equal(database.leads[0].accommodation_preference, "");
  assert.equal(database.leads[0].player_age, null);
  assert.equal(database.leads[0].preferred_route, "");
  assert.equal(database.leads[0].position, "");
  assert.equal(database.leads[0].current_club, "");
  assert.equal(database.leads[0].playing_level, "");
  assert.equal(database.leads[0].highlight_url, "");
  assert.equal(database.leads[0].education_level, "");
  assert.equal(database.leads[0].intended_study, "");
  assert.equal(database.leads[0].preferred_intake, "");
  assert.equal(database.leads[0].readiness_timeline, "");
  assert.equal(database.leads[0].budget_readiness, "");
  assert.equal(database.leads[0].family_support, "");
  assert.equal(database.leads[0].referral_name, "");
  assert.equal(database.leads[0].collection_interest, "");
  assert.equal(database.leads[0].goal, "");

  const invalidAreaResponse = await submitLead(app, {
    leadType: "partner",
    idempotencyKey: "partner-enquiry-invalid-area-123456789",
    fullName: "Another Partner Contact",
    email: "another-partner@example.com",
    phone: "+971502222222",
    country: "United Arab Emirates",
    organization: "Another Football Group",
    partnerInterest: "bespoke_sponsorship_tier",
    message:
      "We would like to discuss a structured partnership with Phoenix United.",
    contactPreference: "email",
    consent: true,
    formStartedAt: Date.now() - 5_000,
  });
  assert.equal(invalidAreaResponse.status, 400);
  assert.match((await invalidAreaResponse.json()).error, /partnership area/i);
  assert.equal(database.leads.length, 1);
});

test("home-kit order request accepts the Store payload and preserves order details", async () => {
  const database = new FakeD1();
  configureWorkerEnv({ DB: database });
  const app = await worker();
  const response = await submitLead(app, {
    leadType: "kit_interest",
    idempotencyKey: "kit-interest-store-form-123456789",
    fullName: "Kit Supporter",
    email: "supporter@example.com",
    phone: "+447700900123",
    country: "Canada",
    collectionInterest: "matchday",
    message:
      "Product: Full kit with shorts — AED 200 / £40\nPreferred size: M\nQuantity: 2",
    consent: true,
    formStartedAt: Date.now() - 5_000,
    website: "",
    sourceUrl: "https://phoenixutd.com/store?utm_source=instagram",
    referrer: "https://www.instagram.com/",
    utmSource: "instagram",
    utmMedium: "social",
    utmCampaign: "kit-preview",
    formVariant: "home-kit-order-request-v1",
  });

  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), {
    created: true,
    leadReference: "PX-00001",
    message:
      "Your home-kit order request has been received. Phoenix will contact you to confirm availability, payment and delivery.",
  });
  assert.equal(database.leads[0].lead_type, "kit_interest");
  assert.equal(database.leads[0].applicant_role, "kit_interest");
  assert.equal(database.leads[0].phone, "+447700900123");
  assert.equal(database.leads[0].collection_interest, "matchday");
  assert.match(database.leads[0].message, /Preferred size: M/);
  assert.match(database.leads[0].message, /Quantity: 2/);
  assert.equal(database.leads[0].utm_source, "instagram");
  assert.equal(database.leads[0].form_variant, "home-kit-order-request-v1");

  const invalidCollection = await submitLead(app, {
    leadType: "kit_interest",
    idempotencyKey: "kit-interest-invalid-collection-123456789",
    fullName: "Another Supporter",
    email: "another@example.com",
    country: "United Kingdom",
    collectionInterest: "secret_drop",
    consent: true,
    formStartedAt: Date.now() - 5_000,
  });
  assert.equal(invalidCollection.status, 400);
  assert.match((await invalidCollection.json()).error, /choose the home-kit option/i);
  assert.equal(database.leads.length, 1);
});

test("honeypot submissions are acknowledged without touching storage", async () => {
  configureWorkerEnv();
  const app = await worker();
  const response = await submitLead(
    app,
    validPlayer({ website: "https://spam.example" }),
  );

  assert.equal(response.status, 201);
  const body = await response.json();
  assert.equal(body.created, false);
  assert.equal(body.leadReference, undefined);
});

test("complete player assessment is persisted before an authenticated CRM delivery", async (t) => {
  const database = new FakeD1();
  const webhookSecret = "crm-webhook-secret-for-tests";
  configureWorkerEnv({
    DB: database,
    CRM_WEBHOOK_URL: "https://crm.example.test/webhooks/phoenix",
    CRM_WEBHOOK_SECRET: webhookSecret,
  });
  const app = await worker();
  let capturedRequest;

  t.mock.method(globalThis, "fetch", async (input, init) => {
    assert.equal(database.leads.length, 1, "lead must exist before delivery");
    assert.equal(database.leads[0].crm_status, "queued");
    capturedRequest = { input, init };
    return new Response("accepted", { status: 202 });
  });

  const payload = validPlayer({
    idempotencyKey: "completed-assessment-success-123456789",
    fullName: "Samir Haddad",
    email: "SAMIR@example.com",
    dateOfBirth: birthDateForAge(21),
    nationality: "Syrian",
    position: "forward",
    currentClub: "Al Nasr U21",
    playingLevel: "semi_professional_or_regional",
    highlightUrl: "https://www.youtube.com/watch?v=samir-phoenix",
    preferredRoute: "football_degree",
    preferredHub: "dubai",
    readinessTimeline: "next_3_6_months",
    budgetReadiness: "ready_full_pricing",
    familySupport: "fully_involved_supportive",
    referralName: "Coach Karim",
    sourceUrl:
      "https://phoenixutd.com/?utm_source=instagram&utm_campaign=founding-class",
    referrer: "https://www.instagram.com/",
    utmSource: "instagram",
    utmMedium: "social",
    utmCampaign: "founding-class",
    utmContent: "training-reel",
    utmTerm: "football degree",
    gclid: "google-click",
    fbclid: "meta-click",
    language: "en-AE",
    timezone: "Asia/Dubai",
    formVariant: "pathway-assessment-v4",
  });
  const response = await submitLead(app, payload);
  const responseBody = await response.json();

  assert.equal(response.status, 201);
  assert.deepEqual(responseBody, {
    created: true,
    leadReference: "PX-00001",
    message:
      "Thank you for submitting your player pathway assessment. Our team will review the details and contact you with the most suitable next step.",
  });
  assert.equal(database.leads.length, 1);
  assert.equal(database.leads[0].email, "samir@example.com");
  assert.equal(database.leads[0].applicant_role, "player");
  assert.equal(database.leads[0].guardian_name, "");
  assert.equal(database.leads[0].date_of_birth, birthDateForAge(21));
  assert.equal(database.leads[0].nationality, "Syrian");
  assert.equal(database.leads[0].player_age, 21);
  assert.equal(database.leads[0].preferred_hub, "dubai");
  assert.equal(database.leads[0].readiness_timeline, "next_3_6_months");
  assert.equal(database.leads[0].budget_readiness, "ready_full_pricing");
  assert.equal(database.leads[0].family_support, "fully_involved_supportive");
  assert.equal(database.leads[0].crm_status, "synced");
  assert.equal(database.leads[0].crm_attempts, 1);
  assert.deepEqual(
    database.events.map((event) => event.type),
    ["insert", "update"],
  );

  assert.equal(
    String(capturedRequest.input),
    "https://crm.example.test/webhooks/phoenix",
  );
  assert.equal(capturedRequest.init.method, "POST");
  const headers = new Headers(capturedRequest.init.headers);
  assert.equal(headers.get("content-type"), "application/json");
  assert.equal(headers.get("authorization"), `Bearer ${webhookSecret}`);
  assert.equal(headers.get("idempotency-key"), "PX-00001");
  assert.deepEqual(JSON.parse(capturedRequest.init.body), {
    event: "phoenix.website.lead.created",
    leadReference: "PX-00001",
    stage: "New",
    submittedAt: database.leads[0].created_at,
    leadType: "player",
    applicantRole: "player",
    guardianName: "",
    fullName: "Samir Haddad",
    email: "samir@example.com",
    phone: "+971500000000",
    country: "United Arab Emirates",
    dateOfBirth: birthDateForAge(21),
    nationality: "Syrian",
    playerAge: 21,
    position: "forward",
    currentClub: "Al Nasr U21",
    playingLevel: "semi_professional_or_regional",
    highlightUrl: "https://www.youtube.com/watch?v=samir-phoenix",
    educationLevel: "",
    intendedStudy: "",
    preferredRoute: "football_degree",
    preferredHub: "dubai",
    accommodationPreference: "",
    preferredIntake: "",
    readinessTimeline: "next_3_6_months",
    budgetReadiness: "ready_full_pricing",
    familySupport: "fully_involved_supportive",
    referralName: "Coach Karim",
    collectionInterest: "",
    goal: "",
    organization: "",
    partnerInterest: "",
    message: "",
    contactPreference: "",
    consent: true,
    sourceUrl:
      "https://phoenixutd.com/?utm_source=instagram&utm_campaign=founding-class",
    referrer: "https://www.instagram.com/",
    utmSource: "instagram",
    utmMedium: "social",
    utmCampaign: "founding-class",
    utmContent: "training-reel",
    utmTerm: "football degree",
    gclid: "google-click",
    fbclid: "meta-click",
    language: "en-AE",
    timezone: "Asia/Dubai",
    formVariant: "pathway-assessment-v4",
  });
});

test("duplicate submissions return the original reference without inserting again", async () => {
  const database = new FakeD1();
  configureWorkerEnv({ DB: database });
  const app = await worker();
  const payload = validPlayer({
    idempotencyKey: "duplicate-submission-123456789",
  });

  const firstResponse = await submitLead(app, payload);
  const firstBody = await firstResponse.json();
  const duplicateResponse = await submitLead(app, payload);
  const duplicateBody = await duplicateResponse.json();

  assert.equal(firstResponse.status, 201);
  assert.equal(firstBody.created, true);
  assert.equal(duplicateResponse.status, 200);
  assert.deepEqual(duplicateBody, {
    created: false,
    leadReference: "PX-00001",
    message:
      "Your enquiry is already safely received. Phoenix will review it and contact you about the appropriate next step.",
  });
  assert.equal(database.leads.length, 1);
  assert.equal(
    database.events.filter((event) => event.type === "insert").length,
    1,
  );
});

test("concurrent duplicate submissions resolve to one stored lead", async () => {
  const database = new FakeD1();
  configureWorkerEnv({ DB: database });
  const app = await worker();
  const payload = validPlayer({
    idempotencyKey: "concurrent-duplicate-123456789",
  });

  const responses = await Promise.all([
    submitLead(app, payload),
    submitLead(app, payload),
  ]);
  const bodies = await Promise.all(responses.map((response) => response.json()));

  assert.deepEqual(
    responses.map((response) => response.status).sort(),
    [200, 201],
  );
  assert.deepEqual(
    bodies.map((body) => body.created).sort(),
    [false, true],
  );
  assert.ok(bodies.every((body) => body.leadReference === "PX-00001"));
  assert.equal(database.leads.length, 1);
});

test("lead rate limiting rejects the thirteenth request in ten minutes", async () => {
  const database = new FakeD1();
  configureWorkerEnv({ DB: database });
  const app = await worker();
  const payload = validPlayer({
    idempotencyKey: "rate-limit-duplicate-123456789",
  });
  const statuses = [];

  for (let attempt = 0; attempt < 13; attempt += 1) {
    const response = await submitLead(app, payload, {
      "cf-connecting-ip": "203.0.113.8",
    });
    statuses.push(response.status);
  }

  assert.equal(statuses[0], 201);
  assert.ok(statuses.slice(1, 12).every((status) => status === 200));
  assert.equal(statuses[12], 429);
  assert.equal(database.leads.length, 1);
});

test("CRM timeout remains queued and the protected sync endpoint retries it", async (t) => {
  const database = new FakeD1();
  const syncSecret = "manual-sync-secret-123456";
  configureWorkerEnv({
    DB: database,
    CRM_WEBHOOK_URL: "https://crm.example.test/webhooks/phoenix",
    CRM_WEBHOOK_SECRET: "crm-webhook-secret-for-tests",
    CRM_SYNC_SECRET: syncSecret,
  });
  const app = await worker();
  let shouldTimeout = true;
  let deliveryAttempts = 0;

  t.mock.method(globalThis, "fetch", async () => {
    deliveryAttempts += 1;
    if (shouldTimeout) throw new Error("CRM request timed out");
    return new Response(null, { status: 204 });
  });

  const response = await submitLead(
    app,
    validPlayer({ idempotencyKey: "timeout-retry-key-123456789" }),
  );
  const responseBody = await response.json();

  assert.equal(response.status, 201);
  assert.equal(responseBody.created, true);
  assert.equal(database.leads[0].crm_status, "queued");
  assert.equal(database.leads[0].crm_attempts, 1);
  assert.match(database.leads[0].crm_response, /timed out/i);

  const unauthorized = await app.fetch(
    new Request("http://localhost/api/leads/sync", {
      method: "POST",
      headers: { authorization: "Bearer wrong-secret" },
    }),
    runtimeEnv,
    runtimeContext,
  );
  assert.equal(unauthorized.status, 401);
  assert.equal(deliveryAttempts, 1);

  shouldTimeout = false;
  const retryResponse = await app.fetch(
    new Request("http://localhost/api/leads/sync", {
      method: "POST",
      headers: { authorization: `Bearer ${syncSecret}` },
    }),
    runtimeEnv,
    runtimeContext,
  );

  assert.equal(retryResponse.status, 200);
  assert.deepEqual(await retryResponse.json(), {
    configured: true,
    attempted: 1,
    synced: 1,
    queued: 0,
  });
  assert.equal(deliveryAttempts, 2);
  assert.equal(database.leads[0].crm_status, "synced");
  assert.equal(database.leads[0].crm_attempts, 2);
});

test("a queue infrastructure error never turns a saved lead into a resubmit", async (t) => {
  const database = new FakeD1();
  database.failQueuedSelect = true;
  configureWorkerEnv({
    DB: database,
    CRM_WEBHOOK_URL: "https://crm.example.test/webhooks/phoenix",
    CRM_WEBHOOK_SECRET: "crm-webhook-secret-for-tests",
  });
  const app = await worker();
  const fetchMock = t.mock.method(globalThis, "fetch", async () => {
    throw new Error("Webhook should not be reached");
  });
  t.mock.method(console, "error", () => {});

  const response = await submitLead(
    app,
    validPlayer({ idempotencyKey: "queue-read-failure-123456789" }),
  );
  const body = await response.json();

  assert.equal(response.status, 201);
  assert.equal(body.created, true);
  assert.equal(body.leadReference, "PX-00001");
  assert.equal(database.leads.length, 1);
  assert.equal(database.leads[0].crm_status, "queued");
  assert.equal(fetchMock.mock.callCount(), 0);
});

test("CRM delivery stays queued until both endpoint and bearer secret are configured", async (t) => {
  const database = new FakeD1();
  configureWorkerEnv({
    DB: database,
    CRM_WEBHOOK_URL: "https://crm.example.test/webhooks/phoenix",
  });
  const app = await worker();
  const fetchMock = t.mock.method(globalThis, "fetch", async () => {
    throw new Error("Unauthenticated webhook delivery is forbidden");
  });

  const response = await submitLead(
    app,
    validPlayer({ idempotencyKey: "missing-bearer-secret-123456789" }),
  );

  assert.equal(response.status, 201);
  assert.equal(database.leads[0].crm_status, "queued");
  assert.equal(database.leads[0].crm_attempts, 0);
  assert.equal(fetchMock.mock.callCount(), 0);
});

test("Instagram feed fails closed when the Meta connection is not configured", async () => {
  configureWorkerEnv();
  const app = await worker();
  const response = await app.fetch(
    new Request("http://localhost/api/instagram"),
    runtimeEnv,
    runtimeContext,
  );

  assert.equal(response.status, 200);
  assert.equal(
    response.headers.get("cache-control"),
    "public, max-age=60, s-maxage=300",
  );
  assert.deepEqual(await response.json(), {
    connected: false,
    posts: [],
    profileUrl: "https://www.instagram.com/phoenix_utdfc/",
  });
});

test("Instagram feed returns configured pins first and then the newest safe posts", async (t) => {
  configureWorkerEnv({
    INSTAGRAM_USER_ID: "123456789012345",
    INSTAGRAM_ACCESS_TOKEN: "server-side-instagram-token",
    INSTAGRAM_API_VERSION: "v25.0",
    INSTAGRAM_PINNED_MEDIA_IDS: "9003,9001",
  });
  const app = await worker();
  let requestedUrl = "";

  t.mock.method(globalThis, "fetch", async (input) => {
    requestedUrl = String(input);
    return Response.json({
      data: [
        {
          id: "9001",
          caption: "Pinned club moment",
          media_type: "IMAGE",
          media_url: "https://cdn.example.com/9001.jpg",
          permalink: "https://www.instagram.com/p/9001/",
          timestamp: "2026-08-01T12:00:00+0000",
        },
        {
          id: "9002",
          caption: "Newest training post",
          media_type: "IMAGE",
          media_url: "https://cdn.example.com/9002.jpg",
          permalink: "https://www.instagram.com/p/9002/",
          timestamp: "2026-08-11T12:00:00+0000",
        },
        {
          id: "9003",
          caption: "Pinned match reel",
          media_type: "VIDEO",
          media_url: "https://cdn.example.com/9003.mp4",
          thumbnail_url: "https://cdn.example.com/9003.jpg",
          permalink: "https://www.instagram.com/reel/9003/",
          timestamp: "2026-07-20T12:00:00+0000",
        },
        ...Array.from({ length: 7 }, (_, index) => ({
          id: String(9010 + index),
          caption: `Phoenix post ${index}`,
          media_type: "CAROUSEL_ALBUM",
          media_url: `https://cdn.example.com/${9010 + index}.jpg`,
          permalink: `https://www.instagram.com/p/${9010 + index}/`,
          timestamp: `2026-08-${String(10 - index).padStart(2, "0")}T12:00:00+0000`,
        })),
        {
          id: "9999",
          caption: "Unsafe image URL",
          media_type: "IMAGE",
          media_url: "http://internal.example.com/image.jpg",
          permalink: "https://www.instagram.com/p/9999/",
          timestamp: "2026-08-12T12:00:00+0000",
        },
      ],
    });
  });

  const response = await app.fetch(
    new Request("http://localhost/api/instagram"),
    runtimeEnv,
    runtimeContext,
  );
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.connected, true);
  assert.equal(body.posts.length, 8);
  assert.deepEqual(
    body.posts.slice(0, 3).map((post) => post.id),
    ["9003", "9001", "9002"],
  );
  assert.equal(body.posts[0].imageUrl, "https://cdn.example.com/9003.jpg");
  assert.ok(body.posts.every((post) => post.id !== "9999"));
  assert.match(requestedUrl, /^https:\/\/graph\.instagram\.com\/v25\.0\/123456789012345\/media\?/);
  assert.match(requestedUrl, /limit=24/);
  assert.match(requestedUrl, /access_token=server-side-instagram-token/);
  assert.doesNotMatch(JSON.stringify(body), /server-side-instagram-token/);
});

test("tracking config exposes only validated public measurement IDs", async () => {
  configureWorkerEnv({
    GA4_MEASUREMENT_ID: "G-ABC1234567",
    META_PIXEL_ID: "123456789012345",
  });
  const app = await worker();
  const validResponse = await app.fetch(
    new Request("http://localhost/api/tracking-config"),
    runtimeEnv,
    runtimeContext,
  );

  assert.equal(validResponse.status, 200);
  assert.equal(
    validResponse.headers.get("cache-control"),
    "public, max-age=300",
  );
  assert.deepEqual(await validResponse.json(), {
    ga4MeasurementId: "G-ABC1234567",
    metaPixelId: "123456789012345",
  });

  configureWorkerEnv({
    GA4_MEASUREMENT_ID: "G-ABC123<script>",
    META_PIXEL_ID: "12345<script>",
  });
  const invalidResponse = await app.fetch(
    new Request("http://localhost/api/tracking-config"),
    runtimeEnv,
    runtimeContext,
  );
  assert.deepEqual(await invalidResponse.json(), {
    ga4MeasurementId: "",
    metaPixelId: "",
  });
});
