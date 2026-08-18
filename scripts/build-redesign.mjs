import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const header = await readFile(path.join(root, "shared/header.html"), "utf8");
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
  utility: ["login", "my-account-2", "lost-password", "newsletter", "membership-pricing", "thankyou", "jumah-bites-2"],
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
  </div>
  <img src="/wp-content/uploads/2025/01/c5c6bfeb-7dc2-42dd-a4d4-66f6faba9043-1.jpg" width="1536" height="1314" decoding="async" alt="Two Ohio Ihsan Academy students reading together in their classroom">
</section>
<!-- OIA:HOME-HERO:END -->`;

async function htmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (["shared", "scripts", "assets", "wp-content", "wp-includes"].includes(entry.name)) continue;
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await htmlFiles(target));
    else if (entry.name === "index.html") files.push(target);
  }
  return files;
}

function stripBlock(html, label) {
  return html.replace(new RegExp(`<!-- OIA:${label}:START -->[\\s\\S]*?<!-- OIA:${label}:END -->`, "g"), "");
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
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<link rel="icon" href="/wp-content/uploads/2024/04/IMG_1067.png" type="image/png">',
    '<link rel="stylesheet" href="/assets/redesign/site.css?v=20260810-3">',
    '<link rel="stylesheet" href="/assets/redesign/page-templates.css?v=20260810-3">',
    '<script src="/assets/redesign/site.js?v=20260810-3" defer></script>',
    '<script src="/assets/redesign/demo-safety.js?v=20260810-3" defer></script>',
  ].join("\n");
  return html.replace(/<\/head>/i, `${tags}\n</head>`);
}

for (const file of await htmlFiles(root)) {
  const route = path.relative(root, path.dirname(file)).split(path.sep).join("/");
  const template = routeToTemplate.get(route);
  if (!template) throw new Error(`No template mapping for ${route || "/"}`);
  let html = await readFile(file, "utf8");
  html = stripBlock(stripBlock(html, "SHARED-HEADER"), "SHARED-FOOTER");
  html = stripBlock(html, "HOME-HERO");
  html = html.replace(/<section\b[^>]*class=["'][^"']*oia-home-hero[^"']*["'][^>]*>[\s\S]*?<\/section>/gi, "");
  html = removeLegacyHeader(sanitize(html, template));
  if (template === "legacy") html = promoteLegacyContent(html);
  html = setBody(html, template);
  html = html.replace(/<\/head>/i, "</head>");
  html = injectAssets(html);
  html = html.replace(/(<body\b[^>]*>)/i, `$1\n${header}`);
  html = injectFooter(html);
  if (template === "home") {
    html = html.replace(/(<(?:div|main)\b[^>]*id=["']main-content["'][^>]*>)/i, `$1\n${homeHero}`);
    html = html.replace(/<h2\b([^>]*)>(\s*Why OIA is Unique\?\s*<\/h2>)/i, (_match, rawAttributes, content) => {
      const attributes = rawAttributes.replace(/\s+id=["']why-oia["']/gi, "");
      return `<h2${attributes} id="why-oia">${content}`;
    });
  }
  if (!/id=["']main-content["']/i.test(html)) html = html.replace(/<main\b/i, '<main id="main-content"');
  html = accessibleMain(html, route);
  await writeFile(file, html);
}

console.log(`Built ${(await htmlFiles(root)).length} redesigned pages.`);
