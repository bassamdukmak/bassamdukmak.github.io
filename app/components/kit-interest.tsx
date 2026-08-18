"use client";

import { FormEvent, useRef, useState } from "react";
import Link from "next/link";
import styles from "../store/store.module.css";

type CollectionInterest = "fan_supporter" | "matchday";

type KitInterestForm = {
  fullName: string;
  email: string;
  phone: string;
  country: string;
  collectionInterest: CollectionInterest | "";
  size: string;
  quantity: string;
  consent: boolean;
  website: string;
};

type FormStatus = "idle" | "saving" | "saved" | "duplicate" | "error";
type FormErrors = Partial<Record<keyof KitInterestForm, string>>;

const INITIAL_FORM: KitInterestForm = {
  fullName: "",
  email: "",
  phone: "",
  country: "",
  collectionInterest: "",
  size: "",
  quantity: "1",
  consent: false,
  website: "",
};

const COLLECTIONS: ReadonlyArray<{
  value: CollectionInterest;
  label: string;
}> = [
  { value: "fan_supporter", label: "Shirt only: AED 150 / £30" },
  { value: "matchday", label: "Full kit with shorts: AED 200 / £40" },
];

function createSubmissionKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `phoenix-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function validate(form: KitInterestForm) {
  const errors: FormErrors = {};
  if (form.fullName.trim().length < 2) {
    errors.fullName = "Enter your full name.";
  }
  if (!validEmail(form.email)) {
    errors.email = "Enter a valid email address.";
  }
  if (form.phone.replace(/[^\d]/g, "").length < 7) {
    errors.phone = "Enter a valid WhatsApp number with country code.";
  }
  if (form.country.trim().length < 2) {
    errors.country = "Enter your current country.";
  }
  if (!form.collectionInterest) {
    errors.collectionInterest = "Choose the kit you want to request.";
  }
  if (form.size.trim().length < 1) {
    errors.size = "Enter your preferred size.";
  }
  const quantity = Number(form.quantity);
  if (!Number.isInteger(quantity) || quantity < 1) {
    errors.quantity = "Enter a quantity of at least one.";
  }
  if (!form.consent) {
    errors.consent = "Consent is required so Phoenix can contact you.";
  }
  return errors;
}

function readAttribution() {
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

export function KitInterest() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<FormStatus>("idle");
  const [feedback, setFeedback] = useState("");
  const [leadReference, setLeadReference] = useState("");
  const [idempotencyKey] = useState(createSubmissionKey);
  const [formStartedAt] = useState(() => Date.now());
  const formRef = useRef<HTMLFormElement>(null);

  function updateField<Key extends keyof KitInterestForm>(
    key: Key,
    value: KitInterestForm[Key],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    if (status === "error") {
      setStatus("idle");
      setFeedback("");
    }
  }

  function focusFirstError() {
    window.requestAnimationFrame(() => {
      formRef.current
        ?.querySelector<HTMLElement>('[aria-invalid="true"]')
        ?.focus();
    });
  }

  async function submitInterest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "saving" || status === "saved" || status === "duplicate") {
      return;
    }

    const nextErrors = validate(form);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setStatus("error");
      setFeedback("Complete the highlighted details before submitting.");
      focusFirstError();
      return;
    }

    setErrors({});
    setStatus("saving");
    setFeedback("Saving your order request…");

    try {
      const product = COLLECTIONS.find(
        (collection) => collection.value === form.collectionInterest,
      );
      const message = [
        `Product: ${product?.label ?? form.collectionInterest}`,
        `Preferred size: ${form.size.trim()}`,
        `Quantity: ${form.quantity}`,
      ].join("\n");

      // ponytail: this request uses the existing lead fields; replace it with
      // structured inventory and checkout only when fulfilment and payment exist.
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadType: "kit_interest",
          idempotencyKey,
          formStartedAt,
          formVariant: "home-kit-order-request-v1",
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          country: form.country,
          collectionInterest: form.collectionInterest,
          message,
          consent: form.consent,
          website: form.website,
          ...readAttribution(),
          language: navigator.language || "en",
          timezone: currentTimezone(),
        }),
      });

      const result = (await response.json().catch(() => ({}))) as {
        created?: boolean;
        error?: string;
        leadReference?: string;
        message?: string;
      };

      if (!response.ok) {
        throw new Error(result.error || "The request could not be saved.");
      }
      if (
        (result.created !== true && result.created !== false) ||
        !result.leadReference
      ) {
        throw new Error("Phoenix could not confirm that your request was saved.");
      }

      setLeadReference(result.leadReference);
      if (result.created) {
        setStatus("saved");
        setFeedback(
          "Your order request is received. Phoenix will contact you to confirm availability, payment and delivery.",
        );
      } else {
        setStatus("duplicate");
        setFeedback(
          "Your order request is already safely received. There is no need to submit it twice.",
        );
      }
    } catch (error) {
      setStatus("error");
      setFeedback(
        error instanceof Error
          ? `${error.message} Please retry in a moment.`
          : "The request could not be saved. Please retry in a moment.",
      );
      window.requestAnimationFrame(() => {
        document.getElementById("kit-interest-feedback")?.focus();
      });
    }
  }

  const completed = status === "saved" || status === "duplicate";

  return (
    <form
      ref={formRef}
      className={styles.interestForm}
      onSubmit={submitInterest}
      noValidate
    >
      <div className={styles.formGrid}>
        <label className={styles.field}>
          <span>Full name *</span>
          <input
            name="fullName"
            autoComplete="name"
            value={form.fullName}
            onChange={(event) => updateField("fullName", event.target.value)}
            aria-invalid={Boolean(errors.fullName)}
            aria-describedby={errors.fullName ? "kit-name-error" : undefined}
            disabled={completed}
            required
          />
          {errors.fullName ? (
            <small id="kit-name-error">{errors.fullName}</small>
          ) : null}
        </label>

        <label className={styles.field}>
          <span>Email *</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "kit-email-error" : undefined}
            disabled={completed}
            required
          />
          {errors.email ? (
            <small id="kit-email-error">{errors.email}</small>
          ) : null}
        </label>

        <label className={styles.field}>
          <span>WhatsApp *</span>
          <input
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="Include country code"
            value={form.phone}
            onChange={(event) => updateField("phone", event.target.value)}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? "kit-phone-error" : undefined}
            disabled={completed}
            required
          />
          {errors.phone ? (
            <small id="kit-phone-error">{errors.phone}</small>
          ) : null}
        </label>

        <label className={styles.field}>
          <span>Country *</span>
          <input
            name="country"
            autoComplete="country-name"
            value={form.country}
            onChange={(event) => updateField("country", event.target.value)}
            aria-invalid={Boolean(errors.country)}
            aria-describedby={errors.country ? "kit-country-error" : undefined}
            disabled={completed}
            required
          />
          {errors.country ? (
            <small id="kit-country-error">{errors.country}</small>
          ) : null}
        </label>

        <label className={`${styles.field} ${styles.fullField}`}>
          <span>Kit option *</span>
          <select
            name="collectionInterest"
            value={form.collectionInterest}
            onChange={(event) =>
              updateField(
                "collectionInterest",
                event.target.value as CollectionInterest | "",
              )
            }
            aria-invalid={Boolean(errors.collectionInterest)}
            aria-describedby={
              errors.collectionInterest ? "kit-collection-error" : undefined
            }
            disabled={completed}
            required
          >
            <option value="">Choose shirt or full kit</option>
            {COLLECTIONS.map((collection) => (
              <option key={collection.value} value={collection.value}>
                {collection.label}
              </option>
            ))}
          </select>
          {errors.collectionInterest ? (
            <small id="kit-collection-error">
              {errors.collectionInterest}
            </small>
          ) : null}
        </label>

        <label className={styles.field}>
          <span>Preferred size *</span>
          <input
            name="size"
            autoComplete="off"
            placeholder="For example: M or Youth 14"
            value={form.size}
            onChange={(event) => updateField("size", event.target.value)}
            aria-invalid={Boolean(errors.size)}
            aria-describedby={errors.size ? "kit-size-error" : undefined}
            disabled={completed}
            required
          />
          {errors.size ? (
            <small id="kit-size-error">{errors.size}</small>
          ) : null}
        </label>

        <label className={styles.field}>
          <span>Quantity *</span>
          <input
            name="quantity"
            type="number"
            inputMode="numeric"
            min="1"
            step="1"
            value={form.quantity}
            onChange={(event) => updateField("quantity", event.target.value)}
            aria-invalid={Boolean(errors.quantity)}
            aria-describedby={errors.quantity ? "kit-quantity-error" : undefined}
            disabled={completed}
            required
          />
          {errors.quantity ? (
            <small id="kit-quantity-error">{errors.quantity}</small>
          ) : null}
        </label>

        <label className={styles.honeypot} aria-hidden="true">
          Website
          <input
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={form.website}
            onChange={(event) => updateField("website", event.target.value)}
          />
        </label>

        <label className={`${styles.consent} ${styles.fullField}`}>
          <input
            name="consent"
            type="checkbox"
            checked={form.consent}
            onChange={(event) => updateField("consent", event.target.checked)}
            aria-invalid={Boolean(errors.consent)}
            aria-describedby={errors.consent ? "kit-consent-error" : undefined}
            disabled={completed}
            required
          />
          <span>
            I agree that Phoenix may use these details to respond to my home-kit
            order request. See the <Link href="/privacy">privacy notice</Link>.
          </span>
          {errors.consent ? (
            <small id="kit-consent-error">{errors.consent}</small>
          ) : null}
        </label>
      </div>

      <div className={styles.formFooter}>
        <button type="submit" disabled={status === "saving" || completed}>
          {status === "saving"
            ? "Sending…"
            : completed
              ? "Request received"
              : "Request an order"}
        </button>
        <p>
          No online payment is taken here. Phoenix confirms availability,
          payment and delivery after receiving the request.
        </p>
      </div>

      <div
        id="kit-interest-feedback"
        className={`${styles.formFeedback} ${
          status === "error" ? styles.formFeedbackError : ""
        }`}
        role={status === "error" ? "alert" : "status"}
        aria-live="polite"
        tabIndex={-1}
      >
        {feedback}
        {leadReference ? (
          <span className={styles.leadReference}>Ref. {leadReference}</span>
        ) : null}
      </div>
    </form>
  );
}
