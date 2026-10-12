import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadContent, renderNewsletters, renderEvents, escapeHtml } from './family-content.mjs';
import { orderDeadlineText } from '../assets/redesign/family-dates.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const assetVersion = "20261012-2";
const familyContent = await loadContent();
const header = await readFile(path.join(root, "shared/header.html"), "utf8");
const familyIcons = await readFile(path.join(root, "shared/family-icons.svg"), "utf8");
const footer = await readFile(path.join(root, "shared/footer.html"), "utf8");

const templateRoutes = {
  home: [""],
  editorial: [
    "welcome", "2025-admission", "2026-2027-admission-process", "2025-26-program-cost",
    "2026-2027-program-cost", "waitlist-policy", "edchoice-at-oia", "edchoice-how-to-apply", "uniform",
  ],
  directory: ["ourteam", "board"],
  resource: ["calendar", "2025-26-calendar", "2026-2027-calendar", "faq", "gallery"],
  document: ["student-handbook", "school-supply-list"],
  "student-life": ["student-life"],
  "short-form": ["contact-us", "inquiry", "tour-2", "careers", "4th-grade-form"],
  transaction: ["2026-2027-admission-form", "admission-form-2-242280", "registration", "donations"],
  utility: ["login", "my-account-2", "lost-password", "newsletter", "membership-pricing", "thankyou", "jumah-bites-2", "jumua-volunteer", "life-at-oia"],
  legacy: ["189-2"],
  concepts: ["hero-options"],
};

const routeToTemplate = new Map(Object.entries(templateRoutes).flatMap(([template, routes]) => routes.map((route) => [route, template])));

const semanticTitles = {
  "2026-2027-admission-form": "2026-2027 Admission Form",
  "4th-grade-form": "4th Grade Interest Form",
  "admission-form-2-242280": "2025-2026 Admission Application Form",
  gallery: "Gallery",
  "jumah-bites-2": "Ohio Ihsan Academy — Jumu’ah Bites Order Form 2025-26",
  "tour-2": "School Tour",
};

const homeHero = `<!-- OIA:HOME-HERO:START -->
<section class="oia-home-hero" aria-labelledby="oia-home-title">
  <div class="oia-home-hero-copy">
    <p class="oia-eyebrow">Welcome to</p>
    <h1 id="oia-home-title">Ohio Ihsan Academy</h1>
    <p class="oia-home-tagline">Empowering minds. Inspiring hearts. Fostering excellence.</p>
    <a class="oia-hero-cta" href="/tour-2/">Schedule Your Tour Appointment Today!</a>
    <a class="oia-life-link" href="/life-at-oia/"><strong>Life at OIA</strong><span>Discover this month’s activities <span aria-hidden="true">→</span></span></a>
  </div>
  <img src="/wp-content/uploads/2025/01/c5c6bfeb-7dc2-42dd-a4d4-66f6faba9043-1.jpg" width="1536" height="1314" decoding="async" alt="Two Ohio Ihsan Academy students reading together in their classroom">
</section>
<!-- OIA:HOME-HERO:END -->`;

function renderSchoolCalendar(html) {
  const generated = html.match(/<!-- OIA:SCHOOL-CALENDAR:START -->[\s\S]*?<!-- OIA:SCHOOL-CALENDAR:END -->/);
  let start = generated?.index;
  let source = generated?.[0];
  if (!source) {
    const section = html.match(/<div\b[^>]*class=["'][^"']*\bet_pb_section_1\b[^"']*["'][^>]*>/);
    if (!section) throw new Error("School calendar month section is missing");
    start = section.index;
    let depth = 0;
    for (const tag of html.slice(start).matchAll(/<\/?div\b[^>]*>/gi)) {
      depth += /^<\/div/i.test(tag[0]) ? -1 : 1;
      if (depth === 0) {
        source = html.slice(start, start + tag.index + tag[0].length);
        break;
      }
    }
  }
  if (!source) throw new Error("School calendar month section is incomplete");
  const headings = [...source.matchAll(/<h(?:3|5)\b[^>]*>([A-Za-z]+ 20\d{2})<\/h(?:3|5)>/g)];
  const months = headings.map((heading, index) => {
    const content = source.slice(heading.index + heading[0].length, headings[index + 1]?.index ?? source.length);
    const rows = [...content.replace(/<thead\b[^>]*>[\s\S]*?<\/thead>/g, "").matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g)].map((row) => {
      const cells = [...row[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/g)];
      if (cells.length !== 2) throw new Error(`School calendar row in ${heading[1]} needs a date and event`);
      return `<tr><td>${cells[0][1]}</td><td>${cells[1][1]}</td></tr>`;
    });
    if (!rows.length) throw new Error(`School calendar month ${heading[1]} has no dates`);
    return { title: heading[1], id: `school-${heading[1].toLowerCase().replace(" ", "-")}`, rows };
  });
  if (!months.length) throw new Error("School calendar has no months");
  const title = source.match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/)?.[1] || "2026 &#8211; 2027 OIA School Calendar";
  const agenda = `<!-- OIA:SCHOOL-CALENDAR:START -->
<section class="et_pb_section oia-school-calendar" aria-labelledby="school-calendar-title">
  <div class="oia-calendar-shell">
    <h2 id="school-calendar-title">${title}</h2>
    <nav class="oia-calendar-jump" aria-label="Jump to a school calendar month">
      ${months.map((month) => `<a href="#${month.id}" aria-label="${month.title}">${month.title.split(" ")[0]}</a>`).join("\n      ")}
    </nav>
    <div class="oia-calendar-agenda">
      ${months.map((month) => `<section class="oia-calendar-month" id="${month.id}" aria-labelledby="${month.id}-title">
        <h3 id="${month.id}-title">${month.title}</h3>
        <table aria-labelledby="${month.id}-title">
          <colgroup><col class="oia-calendar-date"><col></colgroup>
          <thead class="oia-visually-hidden"><tr><th scope="col">Date</th><th scope="col">Event</th></tr></thead>
          <tbody>${month.rows.join("")}</tbody>
        </table>
      </section>`).join("\n      ")}
    </div>
  </div>
</section>
<!-- OIA:SCHOOL-CALENDAR:END -->`;
  return `${html.slice(0, start)}${agenda}${html.slice(start + source.length)}`;
}

async function htmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (["shared", "scripts", "assets", "wp-content", "wp-includes", "dist", "graphify-out", "siteground"].includes(entry.name)) continue;
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await htmlFiles(target));
    else if (entry.name === "index.html") files.push(target);
  }
  return files;
}

function stripBlock(html, label) {
  return html.replace(new RegExp(`\\s*<!-- OIA:${label}:START -->[\\s\\S]*?<!-- OIA:${label}:END -->\\s*`, "g"), "\n");
}

function removeLegacyHeader(html) {
  return html
    .replace(/<header\b[^>]*(?:id=["']main-header["']|class=["'][^"']*(?:oia-demo-header|site-header)[^"']*["'])[^>]*>[\s\S]*?<\/header>/gi, "")
    .replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/gi, "");
}

function promoteLegacyContent(html) {
  const captured = html.match(/<header\b[^>]*class=["'][^"']*\bet-l--header\b[^"']*["'][^>]*>([\s\S]*?)<\/header>/i);
  if (!captured) return html;
  const withoutCapturedHeader = `${html.slice(0, captured.index)}${html.slice(captured.index + captured[0].length)}`;
  return withoutCapturedHeader.replace(
    /(<(?:main|div)\b[^>]*\bid=["']main-content["'][^>]*>)/i,
    `$1\n<section class="oia-legacy-content">${captured[1]}</section>`,
  );
}

function setBody(html, template) {
  return html.replace(/<body\b([^>]*)>/i, (_match, rawAttributes) => {
    let attributes = rawAttributes
      .replace(/\sdata-oia-template=["'][^"']*["']/i, "")
      .replace(/\sclass=["']([^"']*)["']/i, (_classMatch, classes) => ` class="${classes.replace(/\boia-redesign\b/g, "").trim()} oia-redesign"`);
    if (!/\sclass=/i.test(attributes)) attributes += ' class="oia-redesign"';
    return `<body${attributes} data-oia-template="${template}">`;
  });
}

function sanitize(html, template) {
  const imageAlt = template === "directory"
    ? "Ohio Ihsan Academy team member"
    : template === "resource"
      ? "Ohio Ihsan Academy school activity"
      : "Ohio Ihsan Academy school community";
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<link\b(?=[^>]*\brel=["']stylesheet["'])[^>]*>/gi, "")
    .replace(/<link\b(?=[^>]*\brel=["']icon["'])(?=[^>]*\bhref=["']\/wp-content\/uploads\/2024\/04\/IMG_1067\.png["'])[^>]*>/gi, "")
    .replace(/<link\b(?=[^>]*\brel=["'](?:preconnect|dns-prefetch)["'])[^>]*>/gi, "")
    .replace(/<link\b(?=[^>]*\brel=["']profile["'])[^>]*>/gi, "")
    .replace(/<link\b(?=[^>]*\brel=["'](?:pingback|alternate|EditURI|https:\/\/api\.w\.org\/|shortlink)["'])[^>]*>/gi, "")
    .replace(/<meta\b(?=[^>]*\bname=["']generator["'])[^>]*>/gi, "")
    .replace(/<meta\b(?=[^>]*\bname=["']viewport["'])[^>]*>/gi, "")
    .replace(/<div\b[^>]*class=["'][^"']*wpforms-recaptcha-container[^"']*["'][^>]*>[\s\S]*?<\/div>/gi, "")
    .replace(/<img\b[^>]*class=["'][^"']*wpforms-submit-spinner[^"']*["'][^>]*>/gi, "")
    .replace(/<a\b(?=[^>]*\bhref=["']javascript:void\(0\);?["'])[^>]*>[\s\S]*?<\/a>/gi, "")
    .replace(/\s(?:data-token(?:-time)?|data-nonce|nonce)=["'][^"']*["']/gi, "")
    .replace(/\sdata-et-multi-view(?:-[^=\s]+)?=(["'])[\s\S]*?\1/gi, "")
    .replace(/\son(?:click|change|submit|load|error|focus|blur|keydown|keyup)=["'][^"']*["']/gi, "")
    .replace(/<img\b[^>]*>/gi, (tag) => {
      if (/\baria-hidden\s*=\s*["']true["']/i.test(tag)) return tag;
      if (/\balt\s*=\s*["'][^"']+["']/i.test(tag)) return tag;
      if (/\balt\s*=\s*(["'])\s*\1/i.test(tag)) {
        return tag.replace(/\balt\s*=\s*(["'])\s*\1/i, `alt="${imageAlt}"`);
      }
      return tag.replace(/(?=\s*\/?>$)/, ` alt="${imageAlt}"`);
    })
    .replace(/<(?:input|select|textarea)\b[^>]*>/gi, (tag) => {
      if (/\baria-(?:label|labelledby)\s*=/i.test(tag)) return tag;
      const name = tag.match(/\bname\s*=\s*["']([^"']*)["']/i)?.[1] || "";
      const className = tag.match(/\bclass\s*=\s*["']([^"']*)["']/i)?.[1] || "";
      const labels = {
        "your-name": "Full Name",
        "your-email": "Email",
        "your-subject": "Subject",
        "file-379": "PDF attachment",
        "Entering-Year": "Entering Year",
        Relationship: "Relationship to Student",
        "wpforms[save_resume_email]": "Email address for save and resume",
      };
      const label = labels[name]
        || (/wpforms-field-square-cardname/.test(className) ? "Name on Card" : "")
        || (/wpforms-save-resume-shortcode/.test(className) ? "Saved form code" : "");
      return label ? tag.replace(/(?=\s*\/?>$)/, ` aria-label="${label}"`) : tag;
    })
    .replace(/<form\b([^>]*)>/gi, (_match, rawAttributes) => {
      const attributes = rawAttributes
        .replace(/\saction=["'][^"']*["']/gi, "")
        .replace(/\smethod=["'][^"']*["']/gi, "")
        .replace(/\sdata-oia-demo-form(?:=["'][^"']*["'])?/gi, "");
      return `<form${attributes} action="#" method="get" data-oia-demo-form>`;
    });
}

function injectFooter(html) {
  const index = html.toLowerCase().lastIndexOf("</body>");
  if (index < 0) return `${html}\n${footer}`;
  return `${html.slice(0, index)}${footer}\n${html.slice(index)}`;
}

function accessibleMain(html, route) {
  const open = html.match(/<(?:main|div)\b[^>]*\bid=["']main-content["'][^>]*>/i);
  if (!open || open.index === undefined) return html;
  const start = open.index;
  const end = html.indexOf("<!-- OIA:SHARED-FOOTER:START -->", start);
  const boundary = end < 0 ? html.length : end;
  let main = html.slice(start, boundary);

  if (!/<h1\b/i.test(main)) {
    const title = semanticTitles[route] || "Ohio Ihsan Academy";
    main = main.replace(open[0], `${open[0]}\n<h1 class="oia-visually-hidden" data-oia-semantic-heading>${title}</h1>`);
  }

  let previous = 0;
  let hasPrimary = false;
  main = main.replace(/<(\/?)h([1-6])\b([^>]*)>/gi, (tag, closing, rawLevel, rawAttributes) => {
    if (closing) return tag;
    const nativeLevel = Number(rawLevel);
    let level = nativeLevel;
    if (nativeLevel === 1) {
      if (hasPrimary) level = 2;
      else hasPrimary = true;
    }
    if (previous && level > previous + 1) level = previous + 1;
    previous = level;
    if (level === nativeLevel) return tag;
    const attributes = rawAttributes
      .replace(/\sdata-oia-heading-level(?:=["'][^"']*["'])?/gi, "")
      .replace(/\srole=["']heading["']/gi, "")
      .replace(/\saria-level=["'][^"']*["']/gi, "");
    return `<h${rawLevel}${attributes} role="heading" aria-level="${level}" data-oia-heading-level>`;
  });

  return `${html.slice(0, start)}${main}${html.slice(boundary)}`;
}

function injectAssets(html) {
  const tags = [
    '<!-- OIA:SHARED-ASSETS:START -->',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<link rel="icon" href="/wp-content/uploads/2024/04/IMG_1067.png" type="image/png">',
    `<link rel="stylesheet" href="/assets/redesign/site.css?v=${assetVersion}">`,
    `<link rel="stylesheet" href="/assets/redesign/page-templates.css?v=${assetVersion}">`,
    `<script src="/assets/redesign/site.js?v=${assetVersion}" defer></script>`,
    `<script src="/assets/redesign/demo-safety.js?v=${assetVersion}" defer></script>`,
    `<script src="/assets/redesign/family-dates.mjs?v=${assetVersion}" type="module"></script>`,
    '<!-- OIA:SHARED-ASSETS:END -->',
  ].join("\n");
  return html.replace(/<\/head>/i, `${tags}\n</head>`);
}

for (const file of await htmlFiles(root)) {
  const route = path.relative(root, path.dirname(file)).split(path.sep).join("/");
  const template = routeToTemplate.get(route);
  if (!template) throw new Error(`No template mapping for ${route || "/"}`);
  let html = await readFile(file, "utf8");
  html = stripBlock(stripBlock(html, "SHARED-HEADER"), "SHARED-FOOTER");
  html = stripBlock(html, 'SHARED-ASSETS');
  html = stripBlock(html, "HOME-HERO");
  html = stripBlock(html, "COMMUNITY-EVENTS");
  html = stripBlock(html, "ORDER-DEADLINE");
  html = html.replace(/<section\b[^>]*class=["'][^"']*oia-home-hero[^"']*["'][^>]*>[\s\S]*?<\/section>/gi, "");
  html = removeLegacyHeader(sanitize(html, template));
  if (route === "2026-2027-calendar") html = renderSchoolCalendar(html);
  if (template === "legacy") html = promoteLegacyContent(html);
  html = setBody(html, template);
  html = html.replace(/<\/head>/i, "</head>");
  html = injectAssets(html);
  html = html.replace(/(<body\b[^>]*>)/i, `$1\n${header}`);
  html = injectFooter(html);
  if (template === "home") {
    html = html.replace(/(<(?:div|main)\b[^>]*id=["']main-content["'][^>]*>)/i, (_match, open) => `${open}\n${homeHero}`);
    html = html.replace(/<h2\b([^>]*)>(\s*Why OIA is Unique\?\s*<\/h2>)/i, (_match, rawAttributes, content) => {
      const attributes = rawAttributes.replace(/\s+id=["']why-oia["']/gi, "");
      return `<h2${attributes} id="why-oia">${content}`;
    });
  }
  if (route === 'newsletter') {
    html = html.replace(/<ul class="oia-news-topic-list" aria-label="(?:2026 newsletters|Family newsletters)">[\s\S]*?<\/ul>/, () => renderNewsletters(familyContent));
  }
  if (route === 'student-life') {
    for (const symbol of familyIcons.matchAll(/<symbol id="([^"]+)"[\s\S]*?<\/symbol>/g)) {
      const pattern = new RegExp(`<symbol id="${symbol[1]}"[\\s\\S]*?<\\/symbol>`);
      html = pattern.test(html) ? html.replace(pattern, () => symbol[0]) : html.replace('</defs>', `${symbol[0]}</defs>`);
    }

    const card = (icon, title, copy, label, href) => `<a class="card" href="${escapeHtml(href)}"><svg class="icon" aria-hidden="true"><use href="#${icon}"/></svg><h3>${title}</h3><p>${copy}</p><span>${label}</span></a>`;
    html = html.replace(/<a class="card"[^>]*><svg class="icon"[^>]*><use href="#(?:people|volunteer)"\s*\/><\/svg><h3>Jumu’ah Volunteer<\/h3>[\s\S]*?<\/a>\s*/g, '');
    html = html.replace(/<a class="card"[^>]*><svg class="icon"[^>]*><use href="#bag"\s*\/><\/svg><h3>Jumu’ah Bites<\/h3>[\s\S]*?<\/a>/, () => `${card('bag', 'Jumu’ah Bites', 'Monthly lunch ordering and menus.', 'Order Lunch', '/jumah-bites-2/')}\n${card('volunteer', 'Jumu’ah Volunteer', 'Fathers are invited to accompany our boys to the men’s musalla.', 'Volunteer Details', '/jumua-volunteer/')}`);
    // Remove generated cards before re-inserting the live calendar link on repeat builds.
    html = html.replace(/<a class="card"[^>]*><svg class="icon"[^>]*><use href="#calendar"\s*\/><\/svg><h3>Event Calendar<\/h3>[\s\S]*?<\/a>\s*/g, '');
    const calendarCard = `<div class="card oia-calendar-card"><svg class="icon" aria-hidden="true"><use href="#calendar"/></svg><h3>School Calendar</h3><p>School dates and the live calendar of activities.</p><div class="oia-calendar-options"><a href="/2026-2027-calendar/">View School Calendar</a><a href="${escapeHtml(familyContent.eventCalendarUrl)}" target="_blank" rel="noreferrer">View Event Calendar</a></div></div>`;
    html = html.replace(/<a class="card"[^>]*><svg class="icon"[^>]*><use href="#calendar"\s*\/><\/svg><h3>School Calendar<\/h3>[\s\S]*?<\/a>|<div class="card oia-calendar-card">[\s\S]*?<\/div><\/div>/, () => calendarCard);
  }
  if (route === 'life-at-oia') {
    html = html.replace(/<main id="main-content"[^>]*>[\s\S]*?<\/main>/, () => `<main id="main-content">${renderEvents(familyContent)}</main>`);
  }
  if (route === 'jumua-volunteer') {
    const content = `<h1>Jumu’ah Volunteer</h1><p class="oia-family-intro">Volunteer dads needed.</p><p>We are looking for fathers to volunteer to accompany our boys to the men’s musalla, while classroom teachers accompany the girls.</p><a class="oia-event-action" href="${escapeHtml(familyContent.volunteerUrl)}" target="_blank" rel="noreferrer">Sign Up to Volunteer for Jumu’ah →</a><p>Jazakum Allahu Khayran for helping us make this opportunity possible for our students!</p>`;
    html = html.replace(/<main id="main-content"[^>]*>[\s\S]*?<\/main>/, () => `<main id="main-content"><div class="container oia-family-page">${content}<p class="oia-family-back"><a href="/student-life/">← Student &amp; Family Hub</a></p></div></main>`);
  }
  if (route === 'jumah-bites-2') {
    html = html.replace(/(<div class="form-locked-message">)([\s\S]*?)(<\/div>)/, (_match, open, message, close) => `${open}${message}<!-- OIA:ORDER-DEADLINE:START --><p data-oia-order-deadline>${escapeHtml(orderDeadlineText())}</p><!-- OIA:ORDER-DEADLINE:END -->${close}`);
  }
  if (route === '2026-2027-calendar') {
    html = stripBlock(html, 'EVENT-CALENDAR-LINK');
    html = html.replace('<nav class="oia-calendar-jump"', `<!-- OIA:EVENT-CALENDAR-LINK:START --><p class="oia-calendar-live"><a href="${escapeHtml(familyContent.eventCalendarUrl)}" target="_blank" rel="noreferrer">View Event Calendar →</a></p><!-- OIA:EVENT-CALENDAR-LINK:END --><nav class="oia-calendar-jump"`);
  }
  if (!/id=["']main-content["']/i.test(html)) html = html.replace(/<main\b/i, '<main id="main-content"');
  html = accessibleMain(html, route);
  await writeFile(file, html);
}

console.log(`Built ${(await htmlFiles(root)).length} redesigned pages.`);
