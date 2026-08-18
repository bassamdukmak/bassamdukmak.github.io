# Ohio Ihsan Academy Redesign — WordPress / Divi Handoff

This folder is a local, static redesign demo. It is not a WordPress theme, it does not submit or store data, and it must not be uploaded to or activated on the live Ohio Ihsan Academy website. `../Original Non-Redesign/` is the frozen 490-file baseline; keep it unchanged. Its deterministic SHA-256 tree digest is `5a936e96de3d88c1fe2d580f9468388604de8c612949f60f4a7eb7d61a8cd39b`.

## Design system

### Global tokens

Create these as Divi Global Colors and keep the same CSS values in `assets/redesign/site.css`:

| Token | Value | Use |
|---|---:|---|
| Deep green | `#0F4F4A` | Body text, headings, navigation, dark sections |
| Aqua | `#51BFCE` | Decorative accents and large graphical areas |
| Lime | `#9AC84E` | Decorative accents and status details |
| Warm neutral | `#F5F0EB` | Page and alternating-section backgrounds |
| White | `#FFFFFF` | Cards and reversed text on deep green |

Deep green is the default readable foreground. Do not use aqua or lime for small body text on white or warm neutral. Links, focus rings, and active states must retain WCAG AA contrast.

The supporting CSS tokens are also exact: `--oia-teal: #24675E`, `--oia-ink: #132522`, `--oia-muted: #53635F`, `--oia-line: rgba(15, 79, 74, 0.16)`, `--oia-line-accent: rgba(81, 191, 206, 0.42)`, `--oia-paper: rgba(255, 255, 255, 0.86)`, `--oia-shadow: 0 24px 70px rgba(15, 79, 74, 0.12)`, `--oia-max: 1180px`, `--oia-content: min(70rem, calc(100% - 3rem))`, `--oia-reading: 46rem`, and `--oia-radius: 1.25rem`. Map these to Divi presets or theme CSS once; do not recreate slightly different values per page.

Use the implemented rhythm as the Divi section, row, and module spacing scale: standard page sections use `clamp(3.5rem, 7vw, 6.5rem)` vertically; normal content rows use `min(70rem, calc(100% - 3rem))`; the content gutter becomes `2.5rem` at 980, `2rem` at 720, and `1.25rem` at 520. Cards use the `1.25rem` radius and template-specific padding; form controls use `10px` radius; buttons use a `999px` pill radius. Photography uses simple rounded rectangles without dome or mosque-arch frames. Preserve the one-pixel rules, shared shadow, and both responsive layers: shell breakpoints at `1080px`, `760px`, and `420px`; page-template breakpoints at `980px`, `720px`, and `520px`.

### Typography

- Editorial headings: `Georgia, "Times New Roman", serif`; normal weight unless the template specifies otherwise.
- Body and navigation: `"Open Sans", sans-serif`, using the local 400, 600, and 700 font files already in the demo. Do not restore Google Fonts or another remote font request.
- Body: `16px`, weight `400`, shell line height `1.7`, page-copy line height `1.75`. Headings: weight `400`, line height `1.12`; `h1 clamp(2.65rem, 6vw, 5.6rem)`, `h2 clamp(2rem, 3.8vw, 3.35rem)`, and `h3 clamp(1.35rem, 2.4vw, 2rem)`. At 520, `h1` becomes `clamp(2.25rem, 13vw, 3.3rem)` and `h2` becomes `clamp(1.75rem, 10vw, 2.5rem)`. Student Life keeps its separate `h1 clamp(3rem, 7.5vw, 6.6rem)`, line height `0.96`, reduced to `clamp(2.75rem, 15vw, 4rem)` at 520.
- Navigation: Open Sans, `13px`, weight `700`, line height `1.25`, letter spacing `0.055em`, uppercase; `11px` at 1080/760 and `10px` with `0.02em` spacing at 420. Buttons: Open Sans, `0.88rem`, weight `700`, line height `1.2`, letter spacing `0.05em`, uppercase, minimum height `2.9rem`. Eyebrows: Open Sans, `14px`, weight `700`, letter spacing `0.22em`, uppercase.
- Keep real heading order in page content: one `h1`, followed by correctly nested `h2` and `h3` elements. Styling must not determine semantic level.

## Shared shell

The static sources of truth are:

- `shared/header.html`
- `shared/footer.html`
- `assets/redesign/site.css`
- `assets/redesign/page-templates.css`
- `assets/redesign/site.js`
- `assets/redesign/demo-safety.js`
- `scripts/build-redesign.mjs`

The build script inserts the header and footer between these exact markers on all 37 routes:

```html
<!-- OIA:SHARED-HEADER:START -->
<!-- OIA:SHARED-HEADER:END -->
<!-- OIA:SHARED-FOOTER:START -->
<!-- OIA:SHARED-FOOTER:END -->
```

In Divi Theme Builder, make the header and footer Global Templates. Do not copy them into individual pages.

### Header

Desktop uses three links, a centered OIA logo, then three links in this exact order and mapping:

| Label | Destination |
|---|---|
| Our School | `/welcome/` |
| Admissions | `/2026-2027-admission-process/` |
| Contact | `/contact-us/` |
| Student Life | `/student-life/` |
| Support OIA | `/donations/` |
| Academics | `/#why-oia` |

Use the same local logo asset and preserve its alternative text. On mobile, keep the centered logo above two visible rows of three links. Each link keeps a minimum 44-pixel touch target; there is no hamburger, hidden drawer, or Divi mobile-menu toggle. Preserve the visible keyboard focus treatment and page-specific `aria-current="page"` state. Child routes inherit their section state: team/board/careers/legacy use Our School; admissions, costs, policies, forms, inquiry, tour, registration, and thank-you use Admissions; calendars, FAQ, gallery, newsletters, lunch, and account pages use Student Life; membership pricing uses Support OIA.

### Footer

Recreate `shared/footer.html` as one Divi Global Footer. Keep its wording, local destinations, contact details, social destinations, bottom mission line, color treatment, and responsive stacking exactly as rendered. Links must have visible hover and keyboard-focus states. Do not add newsletter, tracking, or contact integrations during visual migration.

## Template families

Create nine Theme Builder body templates. Assign pages by route; do not rewrite, reorder, or silently correct their content.

| Family | Routes | Divi construction |
|---|---|---|
| Homepage | `/` | Editorial hero, original home sections in their existing order, local photography, simple rounded media, alternating neutral/white sections |
| Editorial | `/welcome/`, `/2026-2027-admission-process/`, `/2025-admission/`, `/2026-2027-program-cost/`, `/2025-26-program-cost/`, `/waitlist-policy/`, `/edchoice-at-oia/`, `/edchoice-how-to-apply/`, `/uniform/` | Page hero plus constrained article body; use callouts, lists, tables, and buttons already present in the source |
| Directory | `/ourteam/`, `/board/` | Intro followed by responsive person cards; preserve names, roles, biographies, image alternatives, and order |
| Resource | `/calendar/`, `/2026-2027-calendar/`, `/2025-26-calendar/`, `/faq/`, `/gallery/` | Resource intro and content grid; native accessible disclosures for FAQ and the demo’s keyboard-accessible gallery/lightbox behavior |
| Local documents | `/student-handbook/`, `/school-supply-list/` | Full school-provided document content rendered as local, readable page sections with no Google Docs runtime dependency |
| Student Life | `/student-life/` | Paper-inspired Student & Family Hub, eight quick-link cards, Stay Connected section, and clearly labeled Handbook/Summer Learning placeholders |
| Short form | `/contact-us/`, `/inquiry/`, `/tour-2/`, `/careers/`, `/4th-grade-form/` | Intro, concise form card, supporting contact copy, and an in-page demo status message |
| Transaction | `/2026-2027-admission-form/`, `/admission-form-2-242280/`, `/registration/`, `/donations/` | Read-only/demo transaction shell; visual steps only; every non-navigation control remains disabled |
| Utility | `/login/`, `/my-account-2/`, `/lost-password/`, `/newsletter/`, `/membership-pricing/`, `/thankyou/`, `/jumah-bites-2/` | Narrow utility card or resource layout appropriate to the existing content, with no authentication, purchase, or subscription backend |
| Legacy landing | `/189-2/` | Restyle and retain the legacy page as its own assigned template; do not redirect or delete it |

## Components and interaction

Map each shared CSS component to one Divi Global Preset, saved section, or native module. The static demo remains the visual source of truth.

- Editorial hero: eyebrow, one `h1`, supporting copy, optional actions, and local image in a simple rounded frame.
- Section wrapper: shared content width, vertical rhythm, and neutral/white/dark variants.
- Card and card grid: one reusable preset for editorial, directory, resource, and quick-link cards; do not create route-specific duplicates.
- Buttons and text links: primary, secondary, and arrow-link variants with the implemented hover, focus, disabled, and reduced-motion states.
- Decorative geometry: CSS/background treatment only, marked decorative; never expose it as empty or repetitive screen-reader content.
- FAQ: native `details`/`summary` behavior or an equivalent Divi accordion that preserves keyboard operation and expanded state semantics.
- Gallery: local thumbnails, descriptive alternatives, keyboard activation, Escape-to-close, focus return, and no external lightbox dependency.
- Forms: visible labels, instructions, required indicators, validation/status region, 44-pixel controls, and disabled styling for sensitive actions.

`site.js` owns only shared presentation behavior such as active navigation, accessible gallery/accordion enhancements, and restrained motion. Keep the `prefers-reduced-motion` path. Do not introduce jQuery or another runtime dependency for behavior the browser already provides.

## Demo form safety

`assets/redesign/demo-safety.js` is a required safety boundary, not production form logic. It must remain linked on every route while the static demo is used.

- Informational forms may accept temporary typing and native client-side validation.
- Every attempted submission is intercepted and reports exactly: `Demo only—nothing was sent or saved.`
- Admission, registration, donation, login, lost-password, upload, signature, and payment screens are visual-only; all non-navigation controls stay disabled while local Next/Previous page navigation remains available.
- Forms have no POST method or endpoint action. Scripts make no `fetch`, XHR, beacon, WordPress, analytics, authentication, or payment calls and use no local/session storage.
- The browser self-check is available at `window.OIADemoSafety.check()` for local QA.

When production integration is separately approved, remove the demo safety layer only on staging and replace it with the academy’s approved WordPress form, authentication, file-storage, email, and payment flows. Revalidate consent, retention, permissions, spam protection, error states, and accessibility before any real data is accepted.

## Divi / WordPress production path

This handoff does **not** authorize a live deployment. A later production phase should:

1. Create a private staging copy and a recoverable backup; do not work directly on the live site.
2. Register the six Global Colors, local Open Sans font files, typography presets, spacing presets, buttons, cards, and form controls in Divi.
3. Build the Global Header and Global Footer, then the nine Theme Builder body templates above.
4. Assign the existing WordPress pages to templates without changing slugs, copy, claims, link destinations, media meaning, or content order.
5. Replace demo-only forms one workflow at a time using only approved existing WordPress/backend services; configure least-privilege access and keep secrets out of page code.
6. Test staging at 1440, 1024, 768, 390, and 320 pixels; test keyboard use, focus, headings, alternatives, contrast, reduced motion, forms, email delivery, permissions, analytics consent, payments, redirects, and rollback.
7. Obtain explicit owner approval for the staging result and a deployment window before touching production. After deployment, verify public routes and integrations, then retain the backup and rollback record.

For the static demo, refresh school-provided documents with `node scripts/import-school-documents.mjs`, rebuild with `node scripts/build-redesign.mjs`, and verify with `node scripts/verify-redesign.mjs`. The verifier uses only Node’s standard library and checks the frozen 35-route baseline, all 37 redesigned routes, shared shell/assets, navigation, local references, form safety, and exact normalized baseline page-content wording/order parity.
