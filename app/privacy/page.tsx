import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  description:
    "How Phoenix United FC uses information submitted through this website.",
  title: {
    absolute: "Website Privacy Notice | Phoenix United FC",
  },
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    type: "website",
    url: "/privacy",
    siteName: "Phoenix United FC",
    title: "Website Privacy Notice | Phoenix United FC",
    description:
      "How Phoenix United FC uses information submitted through this website.",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Phoenix United FC: Football. Education. Ecosystem.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Website Privacy Notice | Phoenix United FC",
    description:
      "How Phoenix United FC uses information submitted through this website.",
    images: ["/og.png"],
  },
};

export default function PrivacyPage() {
  return (
    <main className="privacy-page">
      <div className="privacy-shell">
        <Link className="privacy-back" href="/">
          ← Back to Phoenix United
        </Link>
        <p className="section-index">Website privacy notice</p>
        <h1>Your information should have one clear purpose.</h1>
        <p className="privacy-intro">
          This notice covers information submitted through the Phoenix United FC
          website enquiry forms. It is deliberately limited to what the website
          currently does. The player evaluation is intended for adults aged
          18 to 25.
        </p>

        <section>
          <h2>What the website collects</h2>
          <p>
            The player assessment collects contact details, date of birth,
            nationality, country of residence, football background, preferred
            route and location, readiness timing, family budget readiness,
            family decision-maker support, and optional referral and public
            highlight-link details. Partnership enquiries collect contact,
            organisation, interest, and message details. Store interest forms
            collect contact details and the collection a visitor wants to hear
            about. The website also records the page and campaign information
            that led to the enquiry. A short-lived, one-way technical identifier
            is used to limit abusive automated submissions; the raw network
            address is not stored in the lead record.
          </p>
        </section>

        <section>
          <h2>Why Phoenix uses it</h2>
          <p>
            Phoenix uses the information to assess the enquiry, route it to the
            appropriate team, respond with a relevant next step, and understand
            which campaigns are producing useful enquiries.
          </p>
        </section>

        <section>
          <h2>Analytics and advertising measurement</h2>
          <p>
            If you choose “Allow analytics,” the website loads Google Analytics
            and Meta Pixel to measure visits, campaign performance, and successful
            lead submissions. These providers may use cookies or similar
            identifiers and may receive technical information about your device
            and visit. The website does not load those tools when you choose
            “Essential only,” and the enquiry form works without them.
          </p>
          <p>
            A successful lead event is sent only after Phoenix has safely stored a
            new enquiry. Campaign parameters such as UTM values, gclid, and fbclid
            may still be saved with the lead so the team can understand where the
            enquiry came from.
          </p>
        </section>

        <section>
          <h2>Where the information goes</h2>
          <p>
            Submissions are saved to Phoenix&apos;s website lead store and may be
            transferred into its customer relationship management system. Phoenix
            may use technical service providers to operate those systems. Do not
            send passports, medical records, financial documents, or other
            sensitive files through the initial website form.
          </p>
          <p>
            The Contact page also embeds Phoenix&apos;s LeadConnector contact form
            and booking calendar. Information entered into those embedded tools
            is submitted directly to Phoenix&apos;s customer relationship management
            and appointment systems and is subject to the notices shown inside
            those tools.
          </p>
        </section>

        <section>
          <h2>Your choices</h2>
          <p>
            You can change your analytics choice using “Cookie settings” in the
            website footer. A changed choice applies to future page loads.
          </p>
          <p>
            You can ask Phoenix about information submitted through this website,
            request a correction, or ask that an enquiry be removed through the{" "}
            <Link href="/pathway#assessment">Phoenix enquiry form</Link>. Mark it as
            a privacy request in the message field. Phoenix may need to verify the
            request before acting on it.
          </p>
        </section>

        <section>
          <h2>Scope of this notice</h2>
          <p>
            This is an initial enquiry, not player registration, a medical
            assessment, or a contract. Phoenix keeps enquiry information only as
            long as needed to assess and follow up on the request and meet
            applicable record-keeping obligations. Website hosting and CRM
            providers may process the information in other countries with
            appropriate safeguards.
          </p>
          <p>
            Phoenix periodically reviews enquiry records and removes or
            anonymises information that is no longer needed for assessment,
            follow-up, reporting, or applicable legal obligations.
          </p>
        </section>
      </div>
    </main>
  );
}
