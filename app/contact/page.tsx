import type { Metadata } from "next";
import Script from "next/script";
import {
  SiteFooter,
  SiteHeader,
  TrackingConsent,
} from "../components/site-chrome";
import styles from "./contact.module.css";

export const metadata: Metadata = {
  title: {
    absolute: "Contact Phoenix United FC",
  },
  description:
    "Contact Phoenix United FC or book a call with the team through the official enquiry form and calendar.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    type: "website",
    url: "/contact",
    siteName: "Phoenix United FC",
    title: "Contact Phoenix United FC",
    description:
      "Send an enquiry or book a call with the Phoenix United FC team.",
    images: [
      {
        url: "/og-share.png",
        width: 1200,
        height: 630,
        alt: "Phoenix United FC: Dubai Football Club",
      },
    ],
  },
};

export default function ContactPage() {
  return (
    <div className="final-site contact-page">
      <SiteHeader activePage="contact" />

      <main id="main-content" className={styles.main}>
        <section className={styles.hero} aria-labelledby="contact-title">
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Contact Phoenix</p>
            <h1 id="contact-title">
              Start the <em>conversation.</em>
            </h1>
            <p>
              Send the team your details or choose a time to speak. Every
              enquiry goes directly into the Phoenix contact system for
              follow-up.
            </p>
          </div>

          <nav className={styles.jumpLinks} aria-label="Contact options">
            <a href="#enquiry">Send an enquiry</a>
            <a href="#book-a-call">Book a call</a>
          </nav>
        </section>

        <section
          id="enquiry"
          className={`${styles.embedSection} ${styles.formSection}`}
          aria-labelledby="enquiry-title"
        >
          <header className={styles.sectionHeader}>
            <p>01 · Enquiry</p>
            <h2 id="enquiry-title">Tell us how we can help.</h2>
            <span>
              Complete the form and the appropriate Phoenix team member will
              follow up.
            </span>
          </header>

          <div className={styles.embedFrame}>
            <iframe
              src="https://api.leadconnectorhq.com/widget/form/wITvio8ZCQejV4AT7qgB"
              className={styles.formEmbed}
              id="inline-wITvio8ZCQejV4AT7qgB"
              data-layout="{'id':'INLINE'}"
              data-trigger-type="alwaysShow"
              data-trigger-value=""
              data-activation-type="alwaysActivated"
              data-activation-value=""
              data-deactivation-type="neverDeactivate"
              data-deactivation-value=""
              data-form-name="Calendar Form"
              data-height="894"
              data-layout-iframe-id="inline-wITvio8ZCQejV4AT7qgB"
              data-form-id="wITvio8ZCQejV4AT7qgB"
              title="Phoenix contact form"
            />
          </div>
        </section>

        <section
          id="book-a-call"
          className={`${styles.embedSection} ${styles.calendarSection}`}
          aria-labelledby="calendar-title"
        >
          <header className={styles.sectionHeader}>
            <p>02 · Calendar</p>
            <h2 id="calendar-title">Book a time with Phoenix.</h2>
            <span>
              Choose an available appointment and the team will confirm the
              meeting details.
            </span>
          </header>

          <div className={styles.embedFrame}>
            <iframe
              src="https://api.leadconnectorhq.com/widget/booking/jau1AJD4tDBekVcfPCss"
              className={styles.calendarEmbed}
              allow="payment"
              scrolling="no"
              id="jau1AJD4tDBekVcfPCss_1786801154113"
              title="Book a meeting with Phoenix United FC"
            />
          </div>
        </section>

        <Script
          id="leadconnector-form-embed"
          src="https://link.msgsndr.com/js/form_embed.js"
          strategy="afterInteractive"
        />
      </main>

      <SiteFooter />
      <TrackingConsent />
    </div>
  );
}
