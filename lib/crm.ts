import { env } from "cloudflare:workers";
import { asc, eq } from "drizzle-orm";
import { ensureLeadSchema, getDb } from "../db";
import { leads } from "../db/schema";

type CrmEnvironment = {
  CRM_WEBHOOK_URL?: string;
  CRM_WEBHOOK_SECRET?: string;
};

export type CrmSyncSummary = {
  configured: boolean;
  attempted: number;
  synced: number;
  queued: number;
};

export function leadReference(id: number) {
  return `PX-${String(id).padStart(5, "0")}`;
}

export function crmPayloadForLead(lead: typeof leads.$inferSelect) {
  const reference = leadReference(lead.id);
  return {
    event: "phoenix.website.lead.created",
    leadReference: reference,
    stage: "New",
    submittedAt: lead.createdAt,
    leadType: lead.leadType,
    applicantRole: lead.applicantRole,
    guardianName: lead.guardianName,
    fullName: lead.fullName,
    email: lead.email,
    phone: lead.phone,
    country: lead.country,
    dateOfBirth: lead.dateOfBirth,
    nationality: lead.nationality,
    playerAge: lead.playerAge,
    position: lead.position,
    currentClub: lead.currentClub,
    playingLevel: lead.playingLevel,
    highlightUrl: lead.highlightUrl,
    educationLevel: lead.educationLevel,
    intendedStudy: lead.intendedStudy,
    preferredRoute: lead.preferredRoute,
    preferredHub: lead.preferredHub,
    accommodationPreference: lead.accommodationPreference,
    preferredIntake: lead.preferredIntake,
    readinessTimeline: lead.readinessTimeline,
    budgetReadiness: lead.budgetReadiness,
    familySupport: lead.familySupport,
    referralName: lead.referralName,
    collectionInterest: lead.collectionInterest,
    goal: lead.goal,
    organization: lead.organization,
    partnerInterest: lead.partnerInterest,
    message: lead.message,
    contactPreference: lead.contactPreference,
    consent: lead.consent,
    sourceUrl: lead.sourceUrl,
    referrer: lead.referrer,
    utmSource: lead.utmSource,
    utmMedium: lead.utmMedium,
    utmCampaign: lead.utmCampaign,
    utmContent: lead.utmContent,
    utmTerm: lead.utmTerm,
    gclid: lead.gclid,
    fbclid: lead.fbclid,
    language: lead.language,
    timezone: lead.timezone,
    formVariant: lead.formVariant,
  };
}

async function deliverLead(
  lead: typeof leads.$inferSelect,
  webhookUrl: string,
  webhookSecret?: string,
) {
  const attemptedAt = new Date().toISOString();
  const reference = leadReference(lead.id);

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": reference,
        ...(webhookSecret
          ? { Authorization: `Bearer ${webhookSecret}` }
          : {}),
      },
      body: JSON.stringify(crmPayloadForLead(lead)),
      signal: AbortSignal.timeout(3500),
    });

    const responseText = (await response.text()).slice(0, 500);
    await getDb()
      .update(leads)
      .set({
        crmStatus: response.ok ? "synced" : "queued",
        crmResponse: responseText || `HTTP ${response.status}`,
        crmAttempts: lead.crmAttempts + 1,
        crmLastAttemptAt: attemptedAt,
        updatedAt: attemptedAt,
      })
      .where(eq(leads.id, lead.id));

    return response.ok;
  } catch (error) {
    await getDb()
      .update(leads)
      .set({
        crmStatus: "queued",
        crmResponse:
          error instanceof Error ? error.message.slice(0, 500) : "CRM error",
        crmAttempts: lead.crmAttempts + 1,
        crmLastAttemptAt: attemptedAt,
        updatedAt: attemptedAt,
      })
      .where(eq(leads.id, lead.id));
    return false;
  }
}

export async function syncQueuedLeads(limit = 25): Promise<CrmSyncSummary> {
  const runtimeEnv = env as unknown as CrmEnvironment;
  if (!runtimeEnv.CRM_WEBHOOK_URL || !runtimeEnv.CRM_WEBHOOK_SECRET) {
    return { configured: false, attempted: 0, synced: 0, queued: 0 };
  }

  await ensureLeadSchema();
  const queuedLeads = await getDb()
    .select()
    .from(leads)
    .where(eq(leads.crmStatus, "queued"))
    .orderBy(asc(leads.createdAt))
    .limit(Math.max(1, Math.min(limit, 100)));

  const results = await Promise.all(
    queuedLeads.map((lead) =>
      deliverLead(
        lead,
        runtimeEnv.CRM_WEBHOOK_URL as string,
        runtimeEnv.CRM_WEBHOOK_SECRET,
      ),
    ),
  );
  const synced = results.filter(Boolean).length;

  return {
    configured: true,
    attempted: results.length,
    synced,
    queued: results.length - synced,
  };
}
