"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { trackPhoenixLead } from "./site-chrome";

type LeadMode = "player" | "partner";
type FormStatus = "idle" | "saving" | "saved" | "duplicate" | "error";
type PreferredRoute =
  | "football_degree"
  | "football_only"
  | "international_camps"
  | "not_sure";
type PreferredHub =
  | "dubai"
  | "portugal_silves"
  | "manchester_radcliffe"
  | "no_preference";

type AssessmentForm = {
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  nationality: string;
  country: string;
  position: string;
  currentClub: string;
  playingLevel: string;
  highlightUrl: string;
  preferredRoute: PreferredRoute | "";
  preferredHub: PreferredHub | "";
  readinessTimeline: string;
  budgetReadiness: string;
  familySupport: string;
  referralName: string;
  organization: string;
  partnerInterest: string;
  message: string;
  contactPreference: string;
  consent: boolean;
  website: string;
};

type FieldErrors = Partial<Record<keyof AssessmentForm, string>>;

type Attribution = {
  sourceUrl: string;
  referrer: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
  utmTerm: string;
  gclid: string;
  fbclid: string;
};

const EMPTY_FORM: AssessmentForm = {
  fullName: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  nationality: "",
  country: "",
  position: "",
  currentClub: "",
  playingLevel: "",
  highlightUrl: "",
  preferredRoute: "",
  preferredHub: "",
  readinessTimeline: "",
  budgetReadiness: "",
  familySupport: "",
  referralName: "",
  organization: "",
  partnerInterest: "",
  message: "",
  contactPreference: "whatsapp",
  consent: false,
  website: "",
};

const ASSESSMENT_STEPS = [
  { number: 1, label: "About you" },
  { number: 2, label: "Football background" },
  { number: 3, label: "Route & readiness" },
] as const;

const ROUTES: ReadonlyArray<{
  value: PreferredRoute;
  label: string;
}> = [
  {
    value: "football_degree",
    label: "Football and a university degree (Education Programme)",
  },
  {
    value: "football_only",
    label: "Football and accommodation only, no degree (Pro Pathway)",
  },
  { value: "international_camps", label: "A short-term camp first" },
  { value: "not_sure", label: "Not sure yet, help me decide" },
];

const HUBS: ReadonlyArray<{ value: PreferredHub; label: string }> = [
  { value: "dubai", label: "Dubai" },
  { value: "portugal_silves", label: "Silves" },
  { value: "manchester_radcliffe", label: "Manchester (Radcliffe)" },
  { value: "no_preference", label: "No preference, best fit" },
];

const PLAYING_LEVELS = [
  {
    value: "professional_academy_or_pro_youth",
    label: "Professional academy or pro club youth system",
  },
  {
    value: "semi_professional_or_regional",
    label: "Semi-professional or regional representative team",
  },
  {
    value: "competitive_club_top_local",
    label: "Competitive club, top local league",
  },
  {
    value: "school_or_recreational",
    label: "School team or recreational",
  },
] as const;

const READINESS_OPTIONS = [
  { value: "next_1_3_months", label: "Next 1 to 3 months" },
  { value: "next_3_6_months", label: "3 to 6 months" },
  { value: "next_6_12_months", label: "6 to 12 months" },
  { value: "exploring_future", label: "Just exploring for the future" },
] as const;

const BUDGET_OPTIONS = [
  { value: "ready_full_pricing", label: "Ready at full published pricing" },
  {
    value: "needs_payment_plan",
    label: "Would need a structured payment plan",
  },
  { value: "exploring_unsure", label: "Exploring, not sure yet" },
  {
    value: "beyond_consideration",
    label: "Beyond what we can consider right now",
  },
] as const;

const FAMILY_SUPPORT_OPTIONS = [
  {
    value: "fully_involved_supportive",
    label: "Yes, fully involved and supportive",
  },
  {
    value: "aware_discussing",
    label: "Aware, still discussing as a family",
  },
  { value: "player_only", label: "Player only so far" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
] as const;

const PLAYER_STEP_ONE_FIELDS = new Set<keyof AssessmentForm>([
  "fullName",
  "email",
  "phone",
  "dateOfBirth",
  "nationality",
  "country",
]);

const PLAYER_STEP_TWO_FIELDS = new Set<keyof AssessmentForm>([
  "position",
  "currentClub",
  "playingLevel",
  "highlightUrl",
]);

function readAttribution(): Attribution {
  const params = new URLSearchParams(window.location.search);
  return {
    sourceUrl: window.location.href,
    referrer: document.referrer,
    utmSource: params.get("utm_source") ?? "",
    utmMedium: params.get("utm_medium") ?? "",
    utmCampaign: params.get("utm_campaign") ?? "",
    utmContent: params.get("utm_content") ?? "",
    utmTerm: params.get("utm_term") ?? "",
    gclid: params.get("gclid") ?? "",
    fbclid: params.get("fbclid") ?? "",
  };
}

function currentTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  } catch {
    return "";
  }
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function ageFromDateOfBirth(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
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
  if (
    now.getUTCMonth() < month - 1 ||
    (now.getUTCMonth() === month - 1 && now.getUTCDate() < day)
  ) {
    age -= 1;
  }
  return age;
}

function isPublicHighlightUrl(value: string) {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;

    const hostname = url.hostname.toLowerCase();
    if (
      !hostname ||
      hostname === "localhost" ||
      hostname.endsWith(".local") ||
      hostname === "0.0.0.0" ||
      hostname === "::1" ||
      /^127\./.test(hostname) ||
      /^10\./.test(hostname) ||
      /^192\.168\./.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(hostname)
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

function validateContact(form: AssessmentForm, partner = false) {
  const errors: FieldErrors = {};

  if (form.fullName.trim().length < 2) {
    errors.fullName = partner
      ? "Enter your full name."
      : "Enter the player’s full name.";
  }
  if (!isValidEmail(form.email)) {
    errors.email = "Enter a valid email address.";
  }
  if (form.phone.replace(/[^\d]/g, "").length < 7) {
    errors.phone = "Enter a valid WhatsApp number.";
  }
  if (form.country.trim().length < 2) {
    errors.country = partner
      ? "Enter your current country."
      : "Enter the player’s current country of residence.";
  }

  return errors;
}

function validatePlayerStep(form: AssessmentForm, step: number) {
  const errors: FieldErrors = {};

  if (step === 1) {
    Object.assign(errors, validateContact(form));
    const age = ageFromDateOfBirth(form.dateOfBirth);
    if (age === null || age < 18 || age > 25) {
      errors.dateOfBirth =
        "Enter a valid date of birth for a player aged 18 to 25.";
    }
    if (form.nationality.trim().length < 2) {
      errors.nationality = "Enter the player’s nationality.";
    }
  }

  if (step === 2) {
    if (!form.position) {
      errors.position = "Choose the player’s position.";
    }
    if (form.currentClub.trim().length < 2) {
      errors.currentClub = "Enter the current club or academy.";
    }
    if (!form.playingLevel) {
      errors.playingLevel = "Choose the current playing level.";
    }
    if (form.highlightUrl.trim() && !isPublicHighlightUrl(form.highlightUrl)) {
      errors.highlightUrl =
        "If included, use a valid public link beginning with http:// or https://.";
    }
  }

  if (step === 3) {
    if (!form.preferredRoute) {
      errors.preferredRoute = "Choose what you are looking for.";
    }
    if (!form.preferredHub) {
      errors.preferredHub = "Choose the location that interests you most.";
    }
    if (!form.readinessTimeline) {
      errors.readinessTimeline = "Choose when you would be ready to join.";
    }
    if (!form.budgetReadiness) {
      errors.budgetReadiness = "Choose the closest budget-readiness answer.";
    }
    if (!form.familySupport) {
      errors.familySupport = "Choose the closest family-support answer.";
    }
    if (!form.consent) {
      errors.consent =
        "Consent is required so Phoenix can assess and contact you.";
    }
  }

  return errors;
}

function validatePlayerForm(form: AssessmentForm) {
  return {
    ...validatePlayerStep(form, 1),
    ...validatePlayerStep(form, 2),
    ...validatePlayerStep(form, 3),
  };
}

function validatePartnershipForm(form: AssessmentForm) {
  const errors: FieldErrors = {
    ...validateContact(form, true),
  };

  if (form.organization.trim().length < 2) {
    errors.organization = "Enter the organisation name.";
  }
  if (!form.partnerInterest) {
    errors.partnerInterest = "Choose a partnership area.";
  }
  if (form.message.trim().length < 20) {
    errors.message = "Add at least 20 characters about the conversation.";
  }
  if (!form.contactPreference) {
    errors.contactPreference = "Choose how Phoenix should contact you.";
  }
  if (!form.consent) {
    errors.consent =
      "Consent is required so Phoenix can assess and contact you.";
  }

  return errors;
}

function firstPlayerErrorStep(errors: FieldErrors) {
  const fields = Object.keys(errors) as Array<keyof AssessmentForm>;
  if (fields.some((field) => PLAYER_STEP_ONE_FIELDS.has(field))) return 1;
  if (fields.some((field) => PLAYER_STEP_TWO_FIELDS.has(field))) return 2;
  return 3;
}

function optionLabel(
  options: ReadonlyArray<{ value: string; label: string }>,
  value: string,
) {
  return options.find((option) => option.value === value)?.label ?? "Not selected";
}

export default function PathwayAssessment({ mode: leadMode }: { mode: LeadMode }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<AssessmentForm>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<FormStatus>("idle");
  const [feedback, setFeedback] = useState("");
  const [leadReference, setLeadReference] = useState("");
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [formStartedAt] = useState(() => Date.now());
  const formRef = useRef<HTMLFormElement>(null);
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  const successHeadingRef = useRef<HTMLHeadingElement>(null);
  const shouldFocusStepHeading = useRef(false);

  useEffect(() => {
    if (!shouldFocusStepHeading.current) return;
    shouldFocusStepHeading.current = false;
    stepHeadingRef.current?.focus();
  }, [step]);

  useEffect(() => {
    if (status === "saved" || status === "duplicate") {
      successHeadingRef.current?.focus();
    }
  }, [status]);

  function updateField<K extends keyof AssessmentForm>(
    name: K,
    value: AssessmentForm[K],
  ) {
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
    if (status === "error") {
      setStatus("idle");
      setFeedback("");
    }
  }

  function moveToStep(nextStep: number) {
    shouldFocusStepHeading.current = true;
    setStep(Math.max(1, Math.min(nextStep, 3)));
    setFieldErrors({});
    setStatus("idle");
    setFeedback("");
  }

  function focusFirstInvalidField() {
    window.requestAnimationFrame(() => {
      const invalidElement = formRef.current?.querySelector<HTMLElement>(
        '[aria-invalid="true"]',
      );
      if (invalidElement instanceof HTMLFieldSetElement) {
        invalidElement
          .querySelector<HTMLElement>("input, button, select, textarea")
          ?.focus();
      } else {
        invalidElement?.focus();
      }
    });
  }

  function continueAssessment() {
    const errors = validatePlayerStep(form, step);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setStatus("error");
      setFeedback("Complete the highlighted details before continuing.");
      focusFirstInvalidField();
      return;
    }
    moveToStep(step + 1);
  }

  async function submitLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "saving") return;

    if (leadMode === "player" && step < 3) {
      continueAssessment();
      return;
    }

    const errors =
      leadMode === "player"
        ? validatePlayerForm(form)
        : validatePartnershipForm(form);

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setStatus("error");
      setFeedback(
        leadMode === "player"
          ? "Complete the highlighted assessment details before submitting."
          : "Complete the highlighted partnership details before submitting.",
      );

      if (leadMode === "player") {
        const errorStep = firstPlayerErrorStep(errors);
        if (errorStep !== step) {
          shouldFocusStepHeading.current = true;
          setStep(errorStep);
        } else {
          focusFirstInvalidField();
        }
      } else {
        focusFirstInvalidField();
      }
      return;
    }

    setFieldErrors({});
    setStatus("saving");
    setFeedback(
      leadMode === "player"
        ? "Saving your player pathway assessment…"
        : "Saving your partnership enquiry…",
    );

    try {
      const payload =
        leadMode === "player"
          ? {
              leadType: "player",
              fullName: form.fullName,
              email: form.email,
              phone: form.phone,
              dateOfBirth: form.dateOfBirth,
              nationality: form.nationality,
              country: form.country,
              position: form.position,
              currentClub: form.currentClub,
              playingLevel: form.playingLevel,
              highlightUrl: form.highlightUrl,
              preferredRoute: form.preferredRoute,
              preferredHub: form.preferredHub,
              readinessTimeline: form.readinessTimeline,
              budgetReadiness: form.budgetReadiness,
              familySupport: form.familySupport,
              referralName: form.referralName,
              consent: form.consent,
              website: form.website,
            }
          : {
              leadType: "partner",
              fullName: form.fullName,
              email: form.email,
              phone: form.phone,
              country: form.country,
              organization: form.organization,
              partnerInterest: form.partnerInterest,
              message: form.message,
              contactPreference: form.contactPreference,
              consent: form.consent,
              website: form.website,
            };

      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          ...readAttribution(),
          idempotencyKey,
          formStartedAt,
          language: navigator.language || "en",
          timezone: currentTimezone(),
          formVariant:
            leadMode === "player"
              ? "pathway-assessment-v4"
              : "partnership-enquiry-v1",
        }),
      });

      const result = (await response.json().catch(() => ({}))) as {
        created?: boolean;
        error?: string;
        leadReference?: string;
        message?: string;
      };

      if (!response.ok) {
        throw new Error(result.error || "The enquiry could not be saved.");
      }
      if (
        (result.created !== true && result.created !== false) ||
        !result.leadReference
      ) {
        throw new Error("Phoenix could not confirm that the enquiry was saved.");
      }

      setLeadReference(result.leadReference);
      setStatus(result.created ? "saved" : "duplicate");
      setFeedback(
        result.message ||
          (result.created
            ? leadMode === "player"
              ? "Thank you for submitting your player pathway assessment. Our team will review the details and contact you with the most suitable next step."
              : "Thank you for submitting your partnership enquiry. The Phoenix team will review it and contact you about a useful next conversation."
            : "Your enquiry is already safely received. Phoenix will review it and contact you about the appropriate next step."),
      );

      if (result.created && form.consent) {
        void trackPhoenixLead(leadMode, result.leadReference).catch(() => {
          // Measurement failure must never turn a safely stored lead into an error.
        });
      }
    } catch (error) {
      setStatus("error");
      setFeedback(
        error instanceof Error
          ? `${error.message} Please retry in a moment.`
          : "The enquiry could not be saved. Please retry in a moment.",
      );
      window.requestAnimationFrame(() => {
        document.getElementById("assessment-form-feedback")?.focus();
      });
    }
  }

  const playerContactFields = (
    <div className="field-grid">
      <label className="field full">
        <span>Player’s full name</span>
        <input
          name="fullName"
          autoComplete="name"
          value={form.fullName}
          onChange={(event) => updateField("fullName", event.target.value)}
          placeholder="First and last name"
          aria-invalid={Boolean(fieldErrors.fullName)}
          aria-describedby={
            fieldErrors.fullName ? "assessment-fullName-error" : undefined
          }
          required
        />
        {fieldErrors.fullName ? (
          <small className="field-error" id="assessment-fullName-error">
            {fieldErrors.fullName}
          </small>
        ) : null}
      </label>

      <label className="field">
        <span>Email</span>
        <input
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          value={form.email}
          onChange={(event) => updateField("email", event.target.value)}
          placeholder="name@email.com"
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={
            fieldErrors.email ? "assessment-email-error" : undefined
          }
          required
        />
        {fieldErrors.email ? (
          <small className="field-error" id="assessment-email-error">
            {fieldErrors.email}
          </small>
        ) : null}
      </label>

      <label className="field">
        <span>WhatsApp number</span>
        <input
          type="tel"
          name="phone"
          autoComplete="tel"
          inputMode="tel"
          value={form.phone}
          onChange={(event) => updateField("phone", event.target.value)}
          placeholder="+971 …"
          aria-invalid={Boolean(fieldErrors.phone)}
          aria-describedby={
            fieldErrors.phone ? "assessment-phone-error" : undefined
          }
          required
        />
        {fieldErrors.phone ? (
          <small className="field-error" id="assessment-phone-error">
            {fieldErrors.phone}
          </small>
        ) : null}
      </label>

      <label className="field">
        <span>Date of birth</span>
        <input
          type="date"
          name="dateOfBirth"
          autoComplete="bday"
          value={form.dateOfBirth}
          onChange={(event) => updateField("dateOfBirth", event.target.value)}
          aria-invalid={Boolean(fieldErrors.dateOfBirth)}
          aria-describedby={
            fieldErrors.dateOfBirth
              ? "assessment-dateOfBirth-error assessment-dateOfBirth-help"
              : "assessment-dateOfBirth-help"
          }
          required
        />
        {fieldErrors.dateOfBirth ? (
          <small className="field-error" id="assessment-dateOfBirth-error">
            {fieldErrors.dateOfBirth}
          </small>
        ) : null}
        <small id="assessment-dateOfBirth-help">
          This assessment is currently for players aged 18 to 25.
        </small>
      </label>

      <label className="field">
        <span>Nationality</span>
        <input
          name="nationality"
          autoComplete="country-name"
          value={form.nationality}
          onChange={(event) => updateField("nationality", event.target.value)}
          placeholder="Nationality"
          aria-invalid={Boolean(fieldErrors.nationality)}
          aria-describedby={
            fieldErrors.nationality
              ? "assessment-nationality-error"
              : undefined
          }
          required
        />
        {fieldErrors.nationality ? (
          <small className="field-error" id="assessment-nationality-error">
            {fieldErrors.nationality}
          </small>
        ) : null}
      </label>

      <label className="field full">
        <span>Current country of residence</span>
        <input
          name="country"
          autoComplete="country-name"
          value={form.country}
          onChange={(event) => updateField("country", event.target.value)}
          placeholder="Country"
          aria-invalid={Boolean(fieldErrors.country)}
          aria-describedby={
            fieldErrors.country ? "assessment-country-error" : undefined
          }
          required
        />
        {fieldErrors.country ? (
          <small className="field-error" id="assessment-country-error">
            {fieldErrors.country}
          </small>
        ) : null}
      </label>
    </div>
  );

  if (status === "saved" || status === "duplicate") {
    return (
      <div
        id="application-form"
        className={`application-shell assessment-shell assessment-${status}`}
        data-form-variant={leadMode === "player" ? "pathway-assessment-v4" : "partnership-enquiry-v1"}
      >
        <div className="success-state assessment-success" role="status">
          <p className="form-kicker">
            {status === "saved"
              ? "Assessment safely received"
              : "Already safely received"}
          </p>
          <h3 ref={successHeadingRef} tabIndex={-1}>
            {status === "saved"
              ? "Phoenix will take it from here."
              : "No need to submit twice."}
          </h3>
          <p>{feedback}</p>
          <p className="lead-reference">Reference {leadReference}</p>
          <div className="success-actions">
            <Link
              className="button button-primary"
              href={leadMode === "player" ? "/" : "/network"}
            >
              {leadMode === "player" ? "Return to the Club" : "Return to the Network"}
            </Link>
            <a
              className="button button-secondary"
              href="https://www.instagram.com/phoenix_utdfc"
              target="_blank"
              rel="noreferrer"
            >
              Follow the club
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      id="application-form"
      className="application-shell assessment-shell"
      data-form-variant={leadMode === "player" ? "pathway-assessment-v4" : "partnership-enquiry-v1"}
    >
      <form
        ref={formRef}
        onSubmit={submitLead}
        noValidate
        aria-describedby={feedback ? "assessment-form-feedback" : undefined}
        aria-busy={status === "saving"}
      >
        <div className="form-topline assessment-topline">
          <div>
            <p className="form-kicker">
              {leadMode === "player" ? "Player pathway" : "Partnership"}
            </p>
            <h3 id="application-form-title" tabIndex={-1}>
              {leadMode === "player"
                ? "Player Pathway Assessment"
                : "Start a partnership conversation"}
            </h3>
          </div>
          <span className="short-form-note">
            {leadMode === "player"
              ? `Step ${step} of 3`
              : "Partnership enquiry"}
          </span>
        </div>

        <p className="assessment-form-intro">
          {leadMode === "player"
            ? "Tell us about yourself and we will recommend the right route. This is not a sign-up; it is how we make sure any next step is the right one."
            : "Tell Phoenix who you represent and what a useful first conversation should cover."}
        </p>

        {leadMode === "player" ? (
          <>
            <nav
              className="assessment-progress-nav"
              aria-label="Player assessment progress"
            >
              <ol className="step-counter assessment-progress">
                {ASSESSMENT_STEPS.map((assessmentStep) => (
                  <li
                    key={assessmentStep.number}
                    className={
                      assessmentStep.number < step
                        ? "complete"
                        : assessmentStep.number === step
                          ? "active"
                          : ""
                    }
                    aria-current={
                      assessmentStep.number === step ? "step" : undefined
                    }
                  >
                    <span
                      className={assessmentStep.number <= step ? "active" : ""}
                      aria-hidden="true"
                    >
                      {String(assessmentStep.number).padStart(2, "0")}
                    </span>
                    <small>{assessmentStep.label}</small>
                  </li>
                ))}
              </ol>
            </nav>

            <div className="form-step assessment-step">
              {step === 1 ? (
                <>
                  <div className="assessment-step-heading">
                    <p className="form-kicker">01 / About you</p>
                    <h4 ref={stepHeadingRef} tabIndex={-1}>
                      Tell us about the player.
                    </h4>
                    <p>
                      These details let Phoenix confirm eligibility and contact
                      the player about a suitable next step.
                    </p>
                  </div>
                  {playerContactFields}
                </>
              ) : null}

              {step === 2 ? (
                <>
                  <div className="assessment-step-heading">
                    <p className="form-kicker">02 / Football background</p>
                    <h4 ref={stepHeadingRef} tabIndex={-1}>
                      Show us the current level.
                    </h4>
                    <p>
                      Honest information helps the team assess fit before
                      recommending a route.
                    </p>
                  </div>

                  <fieldset
                    className="role-fieldset assessment-choice-fieldset"
                    aria-invalid={Boolean(fieldErrors.position)}
                    aria-describedby={
                      fieldErrors.position ? "assessment-position-error" : undefined
                    }
                  >
                    <legend>Position</legend>
                    <div className="segmented-options">
                      {[
                        ["goalkeeper", "Goalkeeper"],
                        ["defender", "Defender"],
                        ["midfielder", "Midfielder"],
                        ["forward", "Forward"],
                      ].map(([value, label]) => (
                        <label key={value}>
                          <input
                            type="radio"
                            name="position"
                            value={value}
                            checked={form.position === value}
                            onChange={() => updateField("position", value)}
                          />
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>
                    {fieldErrors.position ? (
                      <small className="field-error" id="assessment-position-error">
                        {fieldErrors.position}
                      </small>
                    ) : null}
                  </fieldset>

                  <div className="field-grid">
                    <label className="field full">
                      <span>Current club or academy</span>
                      <input
                        name="currentClub"
                        autoComplete="organization"
                        value={form.currentClub}
                        onChange={(event) =>
                          updateField("currentClub", event.target.value)
                        }
                        placeholder="Club / academy name"
                        aria-invalid={Boolean(fieldErrors.currentClub)}
                        aria-describedby={
                          fieldErrors.currentClub
                            ? "assessment-currentClub-error"
                            : undefined
                        }
                        required
                      />
                      {fieldErrors.currentClub ? (
                        <small
                          className="field-error"
                          id="assessment-currentClub-error"
                        >
                          {fieldErrors.currentClub}
                        </small>
                      ) : null}
                    </label>
                  </div>

                  <fieldset
                    className="role-fieldset assessment-choice-fieldset"
                    aria-invalid={Boolean(fieldErrors.playingLevel)}
                    aria-describedby={
                      fieldErrors.playingLevel
                        ? "assessment-playingLevel-error"
                        : undefined
                    }
                  >
                    <legend>Which best describes your current level?</legend>
                    <div className="segmented-options">
                      {PLAYING_LEVELS.map((option) => (
                        <label key={option.value}>
                          <input
                            type="radio"
                            name="playingLevel"
                            value={option.value}
                            checked={form.playingLevel === option.value}
                            onChange={() =>
                              updateField("playingLevel", option.value)
                            }
                          />
                          <span>{option.label}</span>
                        </label>
                      ))}
                    </div>
                    {fieldErrors.playingLevel ? (
                      <small
                        className="field-error"
                        id="assessment-playingLevel-error"
                      >
                        {fieldErrors.playingLevel}
                      </small>
                    ) : null}
                  </fieldset>

                  <div className="field-grid">
                    <label className="field full">
                      <span>Link to match or highlight video (optional)</span>
                      <input
                        type="url"
                        name="highlightUrl"
                        inputMode="url"
                        autoComplete="url"
                        value={form.highlightUrl}
                        onChange={(event) =>
                          updateField("highlightUrl", event.target.value)
                        }
                        placeholder="https://"
                        aria-invalid={Boolean(fieldErrors.highlightUrl)}
                        aria-describedby={
                          fieldErrors.highlightUrl
                            ? "assessment-highlightUrl-error"
                            : "assessment-highlightUrl-help"
                        }
                      />
                      {fieldErrors.highlightUrl ? (
                        <small
                          className="field-error"
                          id="assessment-highlightUrl-error"
                        >
                          {fieldErrors.highlightUrl}
                        </small>
                      ) : null}
                      <small id="assessment-highlightUrl-help">
                        Optional. Use a public link the Phoenix team can open
                        without requesting access.
                      </small>
                    </label>
                  </div>
                </>
              ) : null}

              {step === 3 ? (
                <>
                  <div className="assessment-step-heading">
                    <p className="form-kicker">03 / What you are looking for</p>
                    <h4 ref={stepHeadingRef} tabIndex={-1}>
                      Choose the right conversation.
                    </h4>
                    <p>
                      The answers guide the assessment. They do not guarantee
                      admission, selection, playing time, a scholarship,
                      transfer or professional opportunity.
                    </p>
                  </div>

                  <fieldset
                    className="route-selector assessment-route-selector"
                    aria-invalid={Boolean(fieldErrors.preferredRoute)}
                    aria-describedby={
                      fieldErrors.preferredRoute
                        ? "assessment-preferredRoute-error"
                        : undefined
                    }
                  >
                    <legend>Which best describes what you want?</legend>
                    <div className="assessment-route-grid">
                      {ROUTES.map((route) => (
                        <button
                          key={route.value}
                          type="button"
                          className={
                            form.preferredRoute === route.value ? "selected" : ""
                          }
                          aria-pressed={form.preferredRoute === route.value}
                          onClick={() =>
                            updateField("preferredRoute", route.value)
                          }
                        >
                          <span>{route.label}</span>
                        </button>
                      ))}
                    </div>
                    {fieldErrors.preferredRoute ? (
                      <small
                        className="field-error"
                        id="assessment-preferredRoute-error"
                      >
                        {fieldErrors.preferredRoute}
                      </small>
                    ) : null}
                  </fieldset>

                  <fieldset
                    className="role-fieldset assessment-choice-fieldset"
                    aria-invalid={Boolean(fieldErrors.preferredHub)}
                    aria-describedby={
                      fieldErrors.preferredHub
                        ? "assessment-preferredHub-error"
                        : undefined
                    }
                  >
                    <legend>Which location interests you most?</legend>
                    <div className="segmented-options assessment-hub-options">
                      {HUBS.map((hub) => (
                        <label key={hub.value}>
                          <input
                            type="radio"
                            name="preferredHub"
                            value={hub.value}
                            checked={form.preferredHub === hub.value}
                            onChange={() => updateField("preferredHub", hub.value)}
                          />
                          <span>{hub.label}</span>
                        </label>
                      ))}
                    </div>
                    {fieldErrors.preferredHub ? (
                      <small
                        className="field-error"
                        id="assessment-preferredHub-error"
                      >
                        {fieldErrors.preferredHub}
                      </small>
                    ) : null}
                  </fieldset>

                  <div className="assessment-step-heading assessment-subheading">
                    <p className="form-kicker">Timing and family</p>
                  </div>

                  <fieldset
                    className="role-fieldset assessment-choice-fieldset"
                    aria-invalid={Boolean(fieldErrors.readinessTimeline)}
                    aria-describedby={
                      fieldErrors.readinessTimeline
                        ? "assessment-readinessTimeline-error"
                        : undefined
                    }
                  >
                    <legend>When would you realistically be ready to join?</legend>
                    <div className="segmented-options">
                      {READINESS_OPTIONS.map((option) => (
                        <label key={option.value}>
                          <input
                            type="radio"
                            name="readinessTimeline"
                            value={option.value}
                            checked={form.readinessTimeline === option.value}
                            onChange={() =>
                              updateField("readinessTimeline", option.value)
                            }
                          />
                          <span>{option.label}</span>
                        </label>
                      ))}
                    </div>
                    {fieldErrors.readinessTimeline ? (
                      <small
                        className="field-error"
                        id="assessment-readinessTimeline-error"
                      >
                        {fieldErrors.readinessTimeline}
                      </small>
                    ) : null}
                  </fieldset>

                  <fieldset
                    className="role-fieldset assessment-choice-fieldset"
                    aria-invalid={Boolean(fieldErrors.budgetReadiness)}
                    aria-describedby={
                      fieldErrors.budgetReadiness
                        ? "assessment-budgetReadiness-error"
                        : undefined
                    }
                  >
                    <legend>
                      A programme like this typically runs $35,000 to $50,000 for
                      the full education programme. Where does this sit for your
                      family right now?
                    </legend>
                    <div className="segmented-options">
                      {BUDGET_OPTIONS.map((option) => (
                        <label key={option.value}>
                          <input
                            type="radio"
                            name="budgetReadiness"
                            value={option.value}
                            checked={form.budgetReadiness === option.value}
                            onChange={() =>
                              updateField("budgetReadiness", option.value)
                            }
                          />
                          <span>{option.label}</span>
                        </label>
                      ))}
                    </div>
                    {fieldErrors.budgetReadiness ? (
                      <small
                        className="field-error"
                        id="assessment-budgetReadiness-error"
                      >
                        {fieldErrors.budgetReadiness}
                      </small>
                    ) : null}
                  </fieldset>

                  <fieldset
                    className="role-fieldset assessment-choice-fieldset"
                    aria-invalid={Boolean(fieldErrors.familySupport)}
                    aria-describedby={
                      fieldErrors.familySupport
                        ? "assessment-familySupport-error"
                        : undefined
                    }
                  >
                    <legend>
                      Is a parent, guardian, or the family’s decision maker aware
                      of and supportive of this?
                    </legend>
                    <div className="segmented-options">
                      {FAMILY_SUPPORT_OPTIONS.map((option) => (
                        <label key={option.value}>
                          <input
                            type="radio"
                            name="familySupport"
                            value={option.value}
                            checked={form.familySupport === option.value}
                            onChange={() =>
                              updateField("familySupport", option.value)
                            }
                          />
                          <span>{option.label}</span>
                        </label>
                      ))}
                    </div>
                    {fieldErrors.familySupport ? (
                      <small
                        className="field-error"
                        id="assessment-familySupport-error"
                      >
                        {fieldErrors.familySupport}
                      </small>
                    ) : null}
                  </fieldset>

                  <div className="field-grid">
                    <label className="field full">
                      <span>Referred by someone connected to Phoenix?</span>
                      <input
                        name="referralName"
                        value={form.referralName}
                        onChange={(event) =>
                          updateField("referralName", event.target.value)
                        }
                        placeholder="Agent, coach, or past player: name (optional)"
                      />
                    </label>
                  </div>

                  <div
                    className="form-summary assessment-route-summary"
                    aria-live="polite"
                    aria-label="Selected pathway summary"
                  >
                    <span>
                      Route · {optionLabel(ROUTES, form.preferredRoute)}
                    </span>
                    <span>Location · {optionLabel(HUBS, form.preferredHub)}</span>
                  </div>

                  <label className="consent-field">
                    <input
                      type="checkbox"
                      name="consent"
                      checked={form.consent}
                      onChange={(event) =>
                        updateField("consent", event.target.checked)
                      }
                      aria-invalid={Boolean(fieldErrors.consent)}
                      aria-describedby={
                        fieldErrors.consent
                          ? "assessment-consent-error"
                          : undefined
                      }
                      required
                    />
                    <span>
                      Phoenix may use these details to assess this player and
                      contact me about a relevant next step.{" "}
                      <a href="/privacy" target="_blank">
                        Read the website privacy notice.
                      </a>
                    </span>
                    {fieldErrors.consent ? (
                      <small
                        className="field-error"
                        id="assessment-consent-error"
                      >
                        {fieldErrors.consent}
                      </small>
                    ) : null}
                  </label>
                </>
              ) : null}
            </div>

            <div className="form-footer assessment-actions">
              {step > 1 ? (
                <button
                  type="button"
                  className="back-action assessment-back"
                  onClick={() => moveToStep(step - 1)}
                  disabled={status === "saving"}
                >
                  ← Back
                </button>
              ) : (
                <p>Player assessment · ages 18 to 25</p>
              )}

              {step < 3 ? (
                <button
                  type="button"
                  className="button button-primary"
                  onClick={continueAssessment}
                >
                  Continue
                </button>
              ) : (
                <button
                  type="submit"
                  className="button button-primary"
                  disabled={status === "saving"}
                >
                  {status === "saving"
                    ? "Saving assessment…"
                    : "Submit assessment"}
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="form-step assessment-step assessment-partnership">
            <div className="assessment-step-heading">
              <p className="form-kicker">Partnership enquiry</p>
              <h4 ref={stepHeadingRef} tabIndex={-1}>
                Build the right conversation.
              </h4>
              <p>
                Tell Phoenix who you represent, the area you want to explore,
                and what a useful first conversation should cover.
              </p>
            </div>

            <div className="field-grid">
              <label className="field full">
                <span>Organisation</span>
                <input
                  name="organization"
                  autoComplete="organization"
                  value={form.organization}
                  onChange={(event) =>
                    updateField("organization", event.target.value)
                  }
                  placeholder="Organisation name"
                  aria-invalid={Boolean(fieldErrors.organization)}
                  aria-describedby={
                    fieldErrors.organization
                      ? "assessment-organization-error"
                      : undefined
                  }
                  required
                />
                {fieldErrors.organization ? (
                  <small
                    className="field-error"
                    id="assessment-organization-error"
                  >
                    {fieldErrors.organization}
                  </small>
                ) : null}
              </label>

              <label className="field full">
                <span>Partnership area</span>
                <select
                  name="partnerInterest"
                  value={form.partnerInterest}
                  onChange={(event) =>
                    updateField("partnerInterest", event.target.value)
                  }
                  aria-invalid={Boolean(fieldErrors.partnerInterest)}
                  aria-describedby={
                    fieldErrors.partnerInterest
                      ? "assessment-partnerInterest-error"
                      : undefined
                  }
                  required
                >
                  <option value="">Select an area</option>
                  <option value="club_academy">Club / academy</option>
                  <option value="education">Education</option>
                  <option value="commercial_sponsor">
                    Commercial / sponsorship
                  </option>
                  <option value="kit_fashion">Kit / fashion</option>
                  <option value="media_content">Media / content</option>
                  <option value="technology">Technology</option>
                  <option value="community">Community</option>
                  <option value="agent_recruitment">
                    Agent / recruitment
                  </option>
                  <option value="other">Other</option>
                </select>
                {fieldErrors.partnerInterest ? (
                  <small
                    className="field-error"
                    id="assessment-partnerInterest-error"
                  >
                    {fieldErrors.partnerInterest}
                  </small>
                ) : null}
              </label>

              <label className="field full">
                <span>What would you like to explore?</span>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={(event) => updateField("message", event.target.value)}
                  placeholder="Tell us what a useful first conversation would cover."
                  rows={5}
                  minLength={20}
                  aria-invalid={Boolean(fieldErrors.message)}
                  aria-describedby={
                    fieldErrors.message
                      ? "assessment-message-error assessment-message-help"
                      : "assessment-message-help"
                  }
                  required
                />
                {fieldErrors.message ? (
                  <small className="field-error" id="assessment-message-error">
                    {fieldErrors.message}
                  </small>
                ) : null}
                <small id="assessment-message-help">Minimum 20 characters.</small>
              </label>

              <label className="field full">
                <span>Contact full name</span>
                <input
                  name="fullName"
                  autoComplete="name"
                  value={form.fullName}
                  onChange={(event) =>
                    updateField("fullName", event.target.value)
                  }
                  placeholder="Your full name"
                  aria-invalid={Boolean(fieldErrors.fullName)}
                  aria-describedby={
                    fieldErrors.fullName
                      ? "assessment-fullName-error"
                      : undefined
                  }
                  required
                />
                {fieldErrors.fullName ? (
                  <small className="field-error" id="assessment-fullName-error">
                    {fieldErrors.fullName}
                  </small>
                ) : null}
              </label>

              <label className="field">
                <span>Email</span>
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder="name@email.com"
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={
                    fieldErrors.email ? "assessment-email-error" : undefined
                  }
                  required
                />
                {fieldErrors.email ? (
                  <small className="field-error" id="assessment-email-error">
                    {fieldErrors.email}
                  </small>
                ) : null}
              </label>

              <label className="field">
                <span>WhatsApp number</span>
                <input
                  type="tel"
                  name="phone"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                  placeholder="+971 …"
                  aria-invalid={Boolean(fieldErrors.phone)}
                  aria-describedby={
                    fieldErrors.phone ? "assessment-phone-error" : undefined
                  }
                  required
                />
                {fieldErrors.phone ? (
                  <small className="field-error" id="assessment-phone-error">
                    {fieldErrors.phone}
                  </small>
                ) : null}
              </label>

              <label className="field full">
                <span>Current country</span>
                <input
                  name="country"
                  autoComplete="country-name"
                  value={form.country}
                  onChange={(event) =>
                    updateField("country", event.target.value)
                  }
                  placeholder="Country"
                  aria-invalid={Boolean(fieldErrors.country)}
                  aria-describedby={
                    fieldErrors.country ? "assessment-country-error" : undefined
                  }
                  required
                />
                {fieldErrors.country ? (
                  <small className="field-error" id="assessment-country-error">
                    {fieldErrors.country}
                  </small>
                ) : null}
              </label>
            </div>

            <fieldset
              className="role-fieldset assessment-choice-fieldset"
              aria-invalid={Boolean(fieldErrors.contactPreference)}
              aria-describedby={
                fieldErrors.contactPreference
                  ? "assessment-contactPreference-error"
                  : undefined
              }
            >
              <legend>Preferred contact method</legend>
              <div className="segmented-options">
                {[
                  ["whatsapp", "WhatsApp"],
                  ["email", "Email"],
                ].map(([value, label]) => (
                  <label key={value}>
                    <input
                      type="radio"
                      name="contactPreference"
                      value={value}
                      checked={form.contactPreference === value}
                      onChange={() => updateField("contactPreference", value)}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
              {fieldErrors.contactPreference ? (
                <small
                  className="field-error"
                  id="assessment-contactPreference-error"
                >
                  {fieldErrors.contactPreference}
                </small>
              ) : null}
            </fieldset>

            <label className="consent-field">
              <input
                type="checkbox"
                name="consent"
                checked={form.consent}
                onChange={(event) =>
                  updateField("consent", event.target.checked)
                }
                aria-invalid={Boolean(fieldErrors.consent)}
                aria-describedby={
                  fieldErrors.consent ? "assessment-consent-error" : undefined
                }
                required
              />
              <span>
                Phoenix may use these details to assess this enquiry and contact
                me about a relevant next step.{" "}
                <a href="/privacy" target="_blank">
                  Read the website privacy notice.
                </a>
              </span>
              {fieldErrors.consent ? (
                <small className="field-error" id="assessment-consent-error">
                  {fieldErrors.consent}
                </small>
              ) : null}
            </label>

            <div className="form-footer assessment-actions">
              <p>Partnership enquiry</p>
              <button
                type="submit"
                className="button button-primary"
                disabled={status === "saving"}
              >
                {status === "saving"
                  ? "Saving enquiry…"
                  : "Submit partnership enquiry"}
              </button>
            </div>
          </div>
        )}

        <label className="honeypot" aria-hidden="true">
          Website
          <input
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={form.website}
            onChange={(event) => updateField("website", event.target.value)}
          />
        </label>

        {feedback ? (
          <p
            id="assessment-form-feedback"
            className={`form-feedback ${status}`}
            role={status === "error" ? "alert" : "status"}
            aria-live="polite"
            tabIndex={-1}
          >
            {feedback}
          </p>
        ) : null}
      </form>
    </div>
  );
}
