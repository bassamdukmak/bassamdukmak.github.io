#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const documents = [
  {
    route: "student-handbook",
    id: "15dHlxA2hhMXcv2jAHCDiNBvPh8Phu6l7As2-cP-wN7U",
    title: "Student Handbook",
    eyebrow: "Ohio Ihsan Academy",
    intro: "School policies, expectations, programs, procedures, and family information in one local resource.",
    prepare(lines) {
      const dividers = lines.flatMap((line, index) => /^_{8,}$/.test(line) ? [index] : []);
      return lines.slice((dividers[1] ?? -1) + 1);
    },
  },
  {
    route: "school-supply-list",
    id: "1kxlLcSqA-Ezfj2091SnfOrt3CECKajgCA5wOL4kgKQk",
    title: "2026–2027 School Supply List",
    eyebrow: "Current Families",
    intro: "Everything students need to prepare for the 2026–2027 school year.",
    prepare(lines) {
      const current = lines.findIndex((line) => line === "2026-2027");
      return lines.slice(current < 0 ? 0 : current + 3);
    },
  },
];

const escapeHtml = (value) => value
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const slug = (value) => value.toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "")
  .slice(0, 64);

function renderContent(lines) {
  const output = [];
  let listOpen = false;
  let sectionOpen = false;
  const closeList = () => {
    if (!listOpen) return;
    output.push("</ul>");
    listOpen = false;
  };
  const closeSection = () => {
    closeList();
    if (sectionOpen) output.push("</section>");
    sectionOpen = false;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || /^_{8,}$/.test(line)) {
      closeList();
      continue;
    }
    if (/^\*\s+/.test(line)) {
      if (!listOpen) {
        output.push('<ul class="oia-document-list">');
        listOpen = true;
      }
      output.push(`<li>${escapeHtml(line.replace(/^\*\s+/, ""))}</li>`);
      continue;
    }

    const majorHeading = line.length >= 4 && line.length < 100 && /[A-Z]/.test(line) && !/[a-z]/.test(line) && !/^\d/.test(line);
    const namedSupplyHeading = ["All Students", "Montessori", "Grades 1–5", "Labeling Reminder"].includes(line);
    if (majorHeading || namedSupplyHeading) {
      closeSection();
      output.push(`<section class="oia-document-section" id="${slug(line)}"><h2>${escapeHtml(line)}</h2>`);
      sectionOpen = true;
      continue;
    }

    closeList();
    if (/^[^.!?]{2,90}:$/.test(line)) output.push(`<h3>${escapeHtml(line.slice(0, -1))}</h3>`);
    else output.push(`<p>${escapeHtml(line)}</p>`);
  }
  closeSection();
  return output.join("\n");
}

function page(document, content) {
  return `<!doctype html>
<html lang="en-US">
<head><meta charset="utf-8"><title>${escapeHtml(document.title)} | OIA</title></head>
<body>
  <main id="main-content" class="oia-document-page">
    <header class="oia-document-hero">
      <p class="oia-document-eyebrow">${escapeHtml(document.eyebrow)}</p>
      <h1>${escapeHtml(document.title)}</h1>
      <p>${escapeHtml(document.intro)}</p>
    </header>
    <article class="oia-document-body">
${content}
    </article>
  </main>
</body>
</html>\n`;
}

for (const document of documents) {
  const response = await fetch(`https://docs.google.com/document/d/${document.id}/export?format=txt`);
  if (!response.ok) throw new Error(`Could not import ${document.title}: HTTP ${response.status}`);
  const lines = (await response.text()).replace(/^\uFEFF/, "").replaceAll("\r", "").split("\n");
  const directory = path.join(root, document.route);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, "index.html"), page(document, renderContent(document.prepare(lines))), "utf8");
  console.log(`Imported ${document.title}.`);
}
