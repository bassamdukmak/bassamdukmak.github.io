import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

let schemaReady: Promise<void> | undefined;

export function getD1() {
  const runtimeEnv = env as unknown as { DB?: D1Database };
  if (!runtimeEnv.DB) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Set the `d1` field in .openai/hosting.json to `DB` or let the hosting platform inject the real binding before using the database.",
    );
  }
  return runtimeEnv.DB;
}

export function getDb() {
  return drizzle(getD1(), { schema });
}

export async function ensureLeadSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      const d1 = getD1();
      await d1.batch([
        d1.prepare(`
          CREATE TABLE IF NOT EXISTS leads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            idempotency_key TEXT NOT NULL UNIQUE,
            lead_type TEXT NOT NULL,
            applicant_role TEXT NOT NULL DEFAULT '',
            guardian_name TEXT NOT NULL DEFAULT '',
            full_name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT NOT NULL,
            country TEXT NOT NULL,
            date_of_birth TEXT NOT NULL DEFAULT '',
            nationality TEXT NOT NULL DEFAULT '',
            player_age INTEGER,
            preferred_route TEXT NOT NULL DEFAULT '',
            preferred_hub TEXT NOT NULL DEFAULT '',
            accommodation_preference TEXT NOT NULL DEFAULT '',
            position TEXT NOT NULL DEFAULT '',
            current_club TEXT NOT NULL DEFAULT '',
            playing_level TEXT NOT NULL DEFAULT '',
            highlight_url TEXT NOT NULL DEFAULT '',
            education_level TEXT NOT NULL DEFAULT '',
            intended_study TEXT NOT NULL DEFAULT '',
            preferred_intake TEXT NOT NULL DEFAULT '',
            readiness_timeline TEXT NOT NULL DEFAULT '',
            budget_readiness TEXT NOT NULL DEFAULT '',
            family_support TEXT NOT NULL DEFAULT '',
            referral_name TEXT NOT NULL DEFAULT '',
            collection_interest TEXT NOT NULL DEFAULT '',
            goal TEXT NOT NULL DEFAULT '',
            organization TEXT NOT NULL DEFAULT '',
            partner_interest TEXT NOT NULL DEFAULT '',
            message TEXT NOT NULL DEFAULT '',
            contact_preference TEXT NOT NULL DEFAULT '',
            consent INTEGER NOT NULL DEFAULT 0,
            source_url TEXT NOT NULL DEFAULT '',
            referrer TEXT NOT NULL DEFAULT '',
            utm_source TEXT NOT NULL DEFAULT '',
            utm_medium TEXT NOT NULL DEFAULT '',
            utm_campaign TEXT NOT NULL DEFAULT '',
            utm_content TEXT NOT NULL DEFAULT '',
            utm_term TEXT NOT NULL DEFAULT '',
            gclid TEXT NOT NULL DEFAULT '',
            fbclid TEXT NOT NULL DEFAULT '',
            language TEXT NOT NULL DEFAULT 'en',
            timezone TEXT NOT NULL DEFAULT '',
            form_variant TEXT NOT NULL DEFAULT '',
            crm_status TEXT NOT NULL DEFAULT 'queued',
            crm_response TEXT NOT NULL DEFAULT '',
            crm_attempts INTEGER NOT NULL DEFAULT 0,
            crm_last_attempt_at TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
          )
        `),
        d1.prepare(
          "CREATE INDEX IF NOT EXISTS leads_created_at_idx ON leads(created_at)",
        ),
        d1.prepare(
          "CREATE INDEX IF NOT EXISTS leads_email_phone_idx ON leads(email, phone)",
        ),
        d1.prepare(
          "CREATE INDEX IF NOT EXISTS leads_crm_status_idx ON leads(crm_status)",
        ),
        d1.prepare(`
          CREATE TABLE IF NOT EXISTS lead_rate_limits (
            bucket_key TEXT PRIMARY KEY,
            count INTEGER NOT NULL DEFAULT 1,
            expires_at INTEGER NOT NULL
          )
        `),
        d1.prepare(
          "CREATE INDEX IF NOT EXISTS lead_rate_limits_expiry_idx ON lead_rate_limits(expires_at)",
        ),
      ]);

      const columnResult = await d1
        .prepare("PRAGMA table_info(leads)")
        .all<{ name: string }>();
      const columns = new Set(
        (columnResult.results ?? []).map((column) => column.name),
      );
      const upgrades = [];
      if (!columns.has("guardian_name")) {
        upgrades.push(
          d1.prepare(
            "ALTER TABLE leads ADD COLUMN guardian_name TEXT NOT NULL DEFAULT ''",
          ),
        );
      }
      if (!columns.has("preferred_hub")) {
        upgrades.push(
          d1.prepare(
            "ALTER TABLE leads ADD COLUMN preferred_hub TEXT NOT NULL DEFAULT ''",
          ),
        );
      }
      if (!columns.has("accommodation_preference")) {
        upgrades.push(
          d1.prepare(
            "ALTER TABLE leads ADD COLUMN accommodation_preference TEXT NOT NULL DEFAULT ''",
          ),
        );
      }
      if (!columns.has("date_of_birth")) {
        upgrades.push(
          d1.prepare(
            "ALTER TABLE leads ADD COLUMN date_of_birth TEXT NOT NULL DEFAULT ''",
          ),
        );
      }
      if (!columns.has("nationality")) {
        upgrades.push(
          d1.prepare(
            "ALTER TABLE leads ADD COLUMN nationality TEXT NOT NULL DEFAULT ''",
          ),
        );
      }
      if (!columns.has("readiness_timeline")) {
        upgrades.push(
          d1.prepare(
            "ALTER TABLE leads ADD COLUMN readiness_timeline TEXT NOT NULL DEFAULT ''",
          ),
        );
      }
      if (!columns.has("budget_readiness")) {
        upgrades.push(
          d1.prepare(
            "ALTER TABLE leads ADD COLUMN budget_readiness TEXT NOT NULL DEFAULT ''",
          ),
        );
      }
      if (!columns.has("family_support")) {
        upgrades.push(
          d1.prepare(
            "ALTER TABLE leads ADD COLUMN family_support TEXT NOT NULL DEFAULT ''",
          ),
        );
      }
      if (!columns.has("referral_name")) {
        upgrades.push(
          d1.prepare(
            "ALTER TABLE leads ADD COLUMN referral_name TEXT NOT NULL DEFAULT ''",
          ),
        );
      }
      if (!columns.has("collection_interest")) {
        upgrades.push(
          d1.prepare(
            "ALTER TABLE leads ADD COLUMN collection_interest TEXT NOT NULL DEFAULT ''",
          ),
        );
      }
      if (!columns.has("crm_attempts")) {
        upgrades.push(
          d1.prepare(
            "ALTER TABLE leads ADD COLUMN crm_attempts INTEGER NOT NULL DEFAULT 0",
          ),
        );
      }
      if (!columns.has("crm_last_attempt_at")) {
        upgrades.push(
          d1.prepare(
            "ALTER TABLE leads ADD COLUMN crm_last_attempt_at TEXT NOT NULL DEFAULT ''",
          ),
        );
      }
      if (upgrades.length) await d1.batch(upgrades);
    })().catch((error) => {
      schemaReady = undefined;
      throw error;
    });
  }
  await schemaReady;
}

export async function allowLeadSubmission(request: Request) {
  const clientIp =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (!clientIp) return true;

  await ensureLeadSchema();
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const expiresAt = now + windowMs;
  const bucket = Math.floor(now / windowMs);
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${bucket}:${clientIp}`),
  );
  const bucketKey = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  const d1 = getD1();
  const result = await d1
    .prepare(
      `INSERT INTO lead_rate_limits (bucket_key, count, expires_at)
       VALUES (?, 1, ?)
       ON CONFLICT(bucket_key) DO UPDATE SET count = count + 1
       RETURNING count`,
    )
    .bind(bucketKey, expiresAt)
    .first<{ count: number }>();

  if (Math.random() < 0.05) {
    await d1
      .prepare("DELETE FROM lead_rate_limits WHERE expires_at < ?")
      .bind(now)
      .run();
  }

  return (result?.count ?? 1) <= 12;
}
