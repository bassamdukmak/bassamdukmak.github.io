import { eq } from "drizzle-orm";
import { allowLeadSubmission, ensureLeadSchema, getDb } from "../../../db";
import { leads } from "../../../db/schema";
import { syncQueuedLeads } from "../../../lib/crm";

export const runtime = "edge";

type LeadPayload = Record<string, unknown> & {
  leadType?: string;
  idempotencyKey?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  country?: string;
  dateOfBirth?: string;
  nationality?: string;
  position?: string;
  currentClub?: string;
  playingLevel?: string;
  highlightUrl?: string;
  preferredRoute?: string;
  preferredHub?: string;
  readinessTimeline?: string;
  budgetReadiness?: string;
  familySupport?: string;
  referralName?: string;
  collectionInterest?: string;
  consent?: boolean;
  website?: string;
};

const LEAD_TYPES = new Set(["player", "partner", "kit_interest"]);
const POSITIONS = new Set([
  "goalkeeper",
  "defender",
  "midfielder",
  "forward",
]);
const PLAYING_LEVELS = new Set([
  "professional_academy_or_pro_youth",
  "semi_professional_or_regional",
  "competitive_club_top_local",
  "school_or_recreational",
]);
const PREFERRED_ROUTES = new Set([
  "football_degree",
  "football_only",
  "international_camps",
  "us_scholarship",
  "not_sure",
]);
const PREFERRED_HUBS = new Set([
  "dubai",
  "portugal_silves",
  "manchester_radcliffe",
  "no_preference",
]);
const READINESS_TIMELINES = new Set([
  "next_1_3_months",
  "next_3_6_months",
  "next_6_12_months",
  "exploring_future",
]);
const BUDGET_READINESS_OPTIONS = new Set([
  "ready_full_pricing",
  "needs_payment_plan",
  "exploring_unsure",
  "beyond_consideration",
]);
const FAMILY_SUPPORT_OPTIONS = new Set([
  "fully_involved_supportive",
  "aware_discussing",
  "player_only",
  "prefer_not_to_say",
]);
const PARTNER_INTERESTS = new Set([
  "club_academy",
  "education",
  "commercial_sponsor",
  "kit_fashion",
  "media_content",
  "technology",
  "community",
  "agent_recruitment",
  "other",
]);
const CONTACT_PREFERENCES = new Set(["whatsapp", "email"]);
const COLLECTION_INTERESTS = new Set([
  "matchday",
  "training",
  "coaches",
  "fan_supporter",
  "premium_limited",
  "not_sure",
]);

function text(value: unknown, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function optionalUrl(value: unknown) {
  const candidate = text(value, 1000);
  if (!candidate) return "";
  try {
    const url = new URL(candidate);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

function publicUrl(value: unknown) {
  const candidate = text(value, 1000);
  if (!candidate) return "";

  try {
    const url = new URL(candidate);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password
    ) {
      return "";
    }

    const hostname = url.hostname
      .toLowerCase()
      .replace(/^\[/, "")
      .replace(/\]$/, "")
      .replace(/\.$/, "");
    if (
      !hostname ||
      hostname === "localhost" ||
      hostname.endsWith(".localhost") ||
      hostname.endsWith(".local")
    ) {
      return "";
    }

    const ipv4Match = hostname.match(/^(\d{1,3})(?:\.(\d{1,3})){3}$/);
    if (ipv4Match) {
      const octets = hostname.split(".").map(Number);
      if (octets.some((octet) => octet > 255)) return "";
      const [first, second, third] = octets;
      const nonPublic =
        first === 0 ||
        first === 10 ||
        first === 127 ||
        (first === 100 && second >= 64 && second <= 127) ||
        (first === 169 && second === 254) ||
        (first === 172 && second >= 16 && second <= 31) ||
        (first === 192 &&
          (second === 168 ||
            (second === 0 && third === 0) ||
            (second === 0 && third === 2))) ||
        (first === 198 &&
          (second === 18 ||
            second === 19 ||
            (second === 51 && third === 100))) ||
        (first === 203 && second === 0 && third === 113) ||
        first >= 224;
      if (nonPublic) return "";
    } else if (hostname.includes(":")) {
      if (
        hostname === "::" ||
        hostname === "::1" ||
        /^(?:fc|fd|fe[89ab]|ff)/i.test(hostname)
      ) {
        return "";
      }
    } else if (!hostname.includes(".")) {
      return "";
    }

    return url.href;
  } catch {
    return "";
  }
}

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function parseDateOfBirth(value: unknown) {
  const candidate = text(value, 10);
  const match = candidate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  const now = new Date();
  let age = now.getUTCFullYear() - year;
  const birthdayHasPassed =
    now.getUTCMonth() > month - 1 ||
    (now.getUTCMonth() === month - 1 && now.getUTCDate() >= day);
  if (!birthdayHasPassed) age -= 1;

  return { iso: candidate, age };
}

function createdLeadMessage(leadType: string) {
  if (leadType === "player") {
    return "Thank you for submitting your player pathway assessment. Our team will review the details and contact you with the most suitable next step.";
  }
  if (leadType === "kit_interest") {
    return "Your home-kit order request has been received. Phoenix will contact you to confirm availability, payment and delivery.";
  }
  return "Your partnership enquiry has been received. Phoenix will review it and contact you about the appropriate next step.";
}

function leadReference(id: number) {
  return `PX-${String(id).padStart(5, "0")}`;
}

function duplicateLeadResponse(id: number) {
  return Response.json(
    {
      created: false,
      leadReference: leadReference(id),
      message:
        "Your enquiry is already safely received. Phoenix will review it and contact you about the appropriate next step.",
    },
    { status: 200 },
  );
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const contentType = request.headers.get("content-type") ?? "";
  const contentLength = Number(request.headers.get("content-length") ?? "0");

  let sameOrigin = false;
  try {
    sameOrigin = Boolean(
      origin && new URL(origin).host === new URL(request.url).host,
    );
  } catch {
    sameOrigin = false;
  }
  if (!sameOrigin) {
    return Response.json(
      { error: "This form can only be submitted from the Phoenix website." },
      { status: 403 },
    );
  }
  if (!contentType.toLowerCase().includes("application/json")) {
    return Response.json({ error: "Invalid form submission." }, { status: 415 });
  }
  if (contentLength > 40_000) {
    return Response.json({ error: "Form submission is too large." }, { status: 413 });
  }

  let payload: LeadPayload;
  try {
    payload = (await request.json()) as LeadPayload;
  } catch {
    return Response.json({ error: "Invalid form submission." }, { status: 400 });
  }

  if (text(payload.website, 120)) {
    return Response.json(
      {
        created: false,
        message:
          "Your enquiry has been received. Phoenix will review it and contact you about the appropriate next step.",
      },
      { status: 201 },
    );
  }

  const leadType = text(payload.leadType, 20);
  const idempotencyKey = text(payload.idempotencyKey, 80);
  const fullName = text(payload.fullName, 120);
  const email = text(payload.email, 160).toLowerCase();
  const phone = text(payload.phone, 50);
  const country = text(payload.country, 100);
  const consent = payload.consent === true;
  const applicantRole =
    leadType === "partner"
      ? "partner"
      : leadType === "kit_interest"
        ? "kit_interest"
        : "player";
  const guardianName = "";
  const parsedBirthDate =
    leadType === "player" ? parseDateOfBirth(payload.dateOfBirth) : null;
  const dateOfBirth = parsedBirthDate?.iso ?? "";
  const nationality =
    leadType === "player" ? text(payload.nationality, 100) : "";
  const playerAge = parsedBirthDate?.age ?? null;
  const preferredRoute =
    leadType === "player" ? text(payload.preferredRoute, 40) : "";
  const preferredHub =
    leadType === "player" ? text(payload.preferredHub, 40) : "";
  const accommodationPreference = "";
  const position =
    leadType === "player" ? text(payload.position, 40) : "";
  const currentClub =
    leadType === "player" ? text(payload.currentClub, 180) : "";
  const playingLevel =
    leadType === "player" ? text(payload.playingLevel, 60) : "";
  const highlightUrlInput =
    leadType === "player" ? text(payload.highlightUrl, 1000) : "";
  const highlightUrl =
    leadType === "player" ? publicUrl(payload.highlightUrl) : "";
  const educationLevel = "";
  const intendedStudy = "";
  const preferredIntake = "";
  const readinessTimeline =
    leadType === "player" ? text(payload.readinessTimeline, 60) : "";
  const budgetReadiness =
    leadType === "player" ? text(payload.budgetReadiness, 60) : "";
  const familySupport =
    leadType === "player" ? text(payload.familySupport, 60) : "";
  const referralName =
    leadType === "player" ? text(payload.referralName, 180) : "";
  const collectionInterest =
    leadType === "kit_interest" ? text(payload.collectionInterest, 100) : "";
  const formStartedAt = Number(payload.formStartedAt);
  const goal = "";
  const organization =
    leadType === "partner" ? text(payload.organization, 180) : "";
  const partnerInterest =
    leadType === "partner" ? text(payload.partnerInterest, 80) : "";
  const message =
    leadType === "player" ? "" : text(payload.message, 2000);
  const contactPreference =
    leadType === "partner" ? text(payload.contactPreference, 30) : "";

  if (!LEAD_TYPES.has(leadType)) {
    return Response.json(
      { error: "Choose a valid enquiry type." },
      { status: 400 },
    );
  }
  if (!idempotencyKey || idempotencyKey.length < 16) {
    return Response.json(
      { error: "The form session expired. Refresh the page and try again." },
      { status: 400 },
    );
  }
  if (fullName.length < 2 || !validEmail(email)) {
    return Response.json(
      { error: "Add a valid name and email address." },
      { status: 400 },
    );
  }
  const phoneDigits = phone.replace(/[^\d]/g, "").length;
  const phoneIsRequired = leadType === "player" || leadType === "partner";
  if (
    country.length < 2 ||
    (phoneIsRequired && phoneDigits < 7) ||
    (!phoneIsRequired && phone && phoneDigits < 7)
  ) {
    return Response.json(
      {
        error: phoneIsRequired
          ? "Add a valid phone number and current country."
          : "Add a valid current country and, if supplied, phone number.",
      },
      { status: 400 },
    );
  }
  if (!consent) {
    return Response.json(
      { error: "Consent is required so Phoenix can assess and contact you." },
      { status: 400 },
    );
  }
  if (
    !Number.isFinite(formStartedAt) ||
    Date.now() - formStartedAt < 2500 ||
    Date.now() - formStartedAt > 7_200_000
  ) {
    return Response.json(
      { error: "The form session expired. Refresh the page and try again." },
      { status: 400 },
    );
  }

  if (leadType === "player") {
    if (
      !parsedBirthDate ||
      parsedBirthDate.age < 18 ||
      parsedBirthDate.age > 25
    ) {
      return Response.json(
        {
          error:
            "Add a valid date of birth. Player evaluations are currently for ages 18–25. Camps and other age groups are announced separately.",
        },
        { status: 400 },
      );
    }
    if (nationality.length < 2) {
      return Response.json(
        { error: "Add the player's nationality." },
        { status: 400 },
      );
    }
    if (!POSITIONS.has(position)) {
      return Response.json(
        { error: "Choose a valid player position." },
        { status: 400 },
      );
    }
    if (currentClub.length < 2) {
      return Response.json(
        { error: "Add the player's current club or write Unattached." },
        { status: 400 },
      );
    }
    if (!PLAYING_LEVELS.has(playingLevel)) {
      return Response.json(
        { error: "Choose a valid current playing level." },
        { status: 400 },
      );
    }
    if (highlightUrlInput && !highlightUrl) {
      return Response.json(
        { error: "If provided, add a valid public match or highlight link." },
        { status: 400 },
      );
    }
    if (!PREFERRED_ROUTES.has(preferredRoute)) {
      return Response.json(
        { error: "Choose a valid pathway route." },
        { status: 400 },
      );
    }
    if (!PREFERRED_HUBS.has(preferredHub)) {
      return Response.json(
        { error: "Choose a valid preferred Phoenix hub." },
        { status: 400 },
      );
    }
    if (!READINESS_TIMELINES.has(readinessTimeline)) {
      return Response.json(
        { error: "Choose a valid readiness timeline." },
        { status: 400 },
      );
    }
    if (!BUDGET_READINESS_OPTIONS.has(budgetReadiness)) {
      return Response.json(
        { error: "Choose a valid family budget readiness option." },
        { status: 400 },
      );
    }
    if (!FAMILY_SUPPORT_OPTIONS.has(familySupport)) {
      return Response.json(
        { error: "Choose a valid family support option." },
        { status: 400 },
      );
    }
  }

  if (leadType === "partner") {
    if (organization.length < 2 || message.length < 20) {
      return Response.json(
        { error: "Complete the required partnership details." },
        { status: 400 },
      );
    }
    if (!PARTNER_INTERESTS.has(partnerInterest)) {
      return Response.json(
        { error: "Choose a valid partnership area." },
        { status: 400 },
      );
    }
    if (!CONTACT_PREFERENCES.has(contactPreference)) {
      return Response.json(
        { error: "Choose WhatsApp or email as the contact preference." },
        { status: 400 },
      );
    }
  }

  if (
    leadType === "kit_interest" &&
    !COLLECTION_INTERESTS.has(collectionInterest)
  ) {
    return Response.json(
      { error: "Choose the home-kit option you want to request." },
      { status: 400 },
    );
  }

  try {
    await ensureLeadSchema();
    if (!(await allowLeadSubmission(request))) {
      return Response.json(
        {
          error:
            "Too many requests were received from this connection. Wait ten minutes before trying again.",
        },
        { status: 429 },
      );
    }
    const db = getDb();
    const existing = await db
      .select({ id: leads.id })
      .from(leads)
      .where(eq(leads.idempotencyKey, idempotencyKey))
      .limit(1);

    if (existing[0]) {
      return duplicateLeadResponse(existing[0].id);
    }

    const values = {
      idempotencyKey,
      leadType,
      applicantRole,
      guardianName,
      fullName,
      email,
      phone,
      country,
      dateOfBirth,
      nationality,
      playerAge,
      preferredRoute,
      preferredHub,
      accommodationPreference,
      position,
      currentClub,
      playingLevel,
      highlightUrl,
      educationLevel,
      intendedStudy,
      preferredIntake,
      readinessTimeline,
      budgetReadiness,
      familySupport,
      referralName,
      collectionInterest,
      goal,
      organization,
      partnerInterest,
      message,
      contactPreference,
      consent,
      sourceUrl: optionalUrl(payload.sourceUrl),
      referrer: optionalUrl(payload.referrer),
      utmSource: text(payload.utmSource, 160),
      utmMedium: text(payload.utmMedium, 160),
      utmCampaign: text(payload.utmCampaign, 200),
      utmContent: text(payload.utmContent, 200),
      utmTerm: text(payload.utmTerm, 200),
      gclid: text(payload.gclid, 300),
      fbclid: text(payload.fbclid, 300),
      language: text(payload.language, 30) || "en",
      timezone: text(payload.timezone, 80),
      formVariant: text(payload.formVariant, 100),
      crmStatus: "queued",
      crmResponse: "",
    };

    let savedLead: { id: number };
    try {
      const [insertedLead] = await db.insert(leads).values(values).returning({
        id: leads.id,
      });
      if (!insertedLead) throw new Error("D1 did not return the saved lead.");
      savedLead = insertedLead;
    } catch (error) {
      const duplicate = await db
        .select({ id: leads.id })
        .from(leads)
        .where(eq(leads.idempotencyKey, idempotencyKey))
        .limit(1);
      if (duplicate[0]) return duplicateLeadResponse(duplicate[0].id);
      throw error;
    }

    try {
      await syncQueuedLeads(10);
    } catch (error) {
      console.error("CRM sync failed after lead save", error);
    }

    return Response.json(
      {
        created: true,
        leadReference: leadReference(savedLead.id),
        message: createdLeadMessage(leadType),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Lead save failed", error);
    return Response.json(
      {
        error:
          "The enquiry could not be saved right now. Please try again shortly.",
      },
      { status: 503 },
    );
  }
}
