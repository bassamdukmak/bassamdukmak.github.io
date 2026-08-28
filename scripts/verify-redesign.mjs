#!/usr/bin/env node

import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, extname, posix, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const baseline = resolve(root, '..', 'Original Non-Redesign');
const EXPECTED_BASELINE_PAGE_COUNT = 35;
const EXPECTED_REDESIGN_PAGE_COUNT = 38;
const EXPECTED_BASELINE_FILES = 490;
const EXPECTED_BASELINE_SHA256 = '5a936e96de3d88c1fe2d580f9468388604de8c612949f60f4a7eb7d61a8cd39b';
const HEADER_START = '<!-- OIA:SHARED-HEADER:START -->';
const HEADER_END = '<!-- OIA:SHARED-HEADER:END -->';
const FOOTER_START = '<!-- OIA:SHARED-FOOTER:START -->';
const FOOTER_END = '<!-- OIA:SHARED-FOOTER:END -->';
const APPROVED_CONTENT_REPLACEMENTS = new Set(['newsletter/index.html', 'student-life/index.html', 'uniform/index.html']);
const STUDENT_HANDBOOK_URL = 'https://docs.google.com/document/d/15dHlxA2hhMXcv2jAHCDiNBvPh8Phu6l7As2-cP-wN7U/view';
const SUPPLY_LIST_ROUTE = '/school-supply-list/';
const APPROVED_OIA_LINKS = new Set(['https://oiacademy.org/?wpforms_form_preview=243663']);
const sharedPaths = {
  header: 'shared/header.html',
  footer: 'shared/footer.html',
  siteCss: 'assets/redesign/site.css',
  templatesCss: 'assets/redesign/page-templates.css',
  siteJs: 'assets/redesign/site.js',
  safetyJs: 'assets/redesign/demo-safety.js',
  uniformGuide: 'assets/redesign/images/student-uniform-guide-hd.png',
  build: 'scripts/build-redesign.mjs',
};
const sharedRefs = [
  '/assets/redesign/site.css',
  '/assets/redesign/page-templates.css',
  '/assets/redesign/site.js',
  '/assets/redesign/demo-safety.js',
];
const navigation = [
  ['Our School', '/welcome/'],
  ['Admissions', '/2026-2027-admission-process/'],
  ['Contact', '/contact-us/'],
  ['Student Life', '/student-life/'],
  ['Support OIA', '/donations/'],
  ['Academics', '/#why-oia'],
];
const failures = [];
let passed = 0;

function check(label, condition, detail = '') {
  if (condition) {
    passed += 1;
    console.log(`PASS  ${label}${detail ? ` — ${detail}` : ''}`);
    return;
  }
  failures.push({ label, detail });
  console.error(`FAIL  ${label}${detail ? ` — ${detail}` : ''}`);
}

function walkFiles(directory, base = directory) {
  if (!existsSync(directory)) return [];
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const absolute = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(absolute, base));
    else if (entry.isFile()) files.push(posix.normalize(absolute.slice(base.length + 1).replaceAll('\\', '/')));
  }
  return files.sort();
}

function read(relative, directory = root) {
  return readFileSync(resolve(directory, relative), 'utf8');
}

function treeDigest(directory, files) {
  const hash = createHash('sha256');
  for (const relative of files) {
    hash.update(relative);
    hash.update('\0');
    hash.update(readFileSync(resolve(directory, relative)));
    hash.update('\0');
  }
  return hash.digest('hex');
}

function decodeHtml(value) {
  const named = {
    amp: '&', apos: "'", gt: '>', lt: '<', nbsp: ' ', quot: '"',
    ndash: '–', mdash: '—', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“',
  };
  return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, key) => {
    if (key[0] === '#') {
      const hexadecimal = key[1]?.toLowerCase() === 'x';
      const point = Number.parseInt(key.slice(hexadecimal ? 2 : 1), hexadecimal ? 16 : 10);
      return Number.isFinite(point) ? String.fromCodePoint(point) : entity;
    }
    return named[key.toLowerCase()] ?? entity;
  });
}

function stripMarkup(html) {
  return decodeHtml(html)
    .replace(/<!--[^]*?-->/g, ' ')
    .replace(/<(script|style|template|noscript|svg)\b[^>]*>[^]*?<\/\1\s*>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getAttribute(tag, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = tag.match(new RegExp(`\\b${escaped}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  return decodeHtml(match?.[1] ?? match?.[2] ?? match?.[3] ?? '');
}

function anchors(html) {
  return [...html.matchAll(/<a\b([^>]*)>([^]*?)<\/a\s*>/gi)].map((match) => ({
    href: getAttribute(match[1], 'href'),
    label: stripMarkup(match[2]),
  }));
}

function navFragment(html) {
  const primary = html.match(/<nav\b[^>]*aria-label\s*=\s*["'][^"']*primary[^"']*["'][^>]*>[^]*?<\/nav\s*>/i);
  return primary?.[0] ?? html.match(/<nav\b[^>]*>[^]*?<\/nav\s*>/i)?.[0] ?? '';
}

function validateNavigation(html) {
  const found = anchors(navFragment(html)).filter(({ label }) => label);
  return found.length === navigation.length && navigation.every(([label, href], index) => (
    found[index]?.label === label && found[index]?.href === href
  ));
}

function between(html, start, end) {
  const startIndex = html.indexOf(start);
  const endIndex = html.indexOf(end, startIndex + start.length);
  if (startIndex < 0 || endIndex < 0) return '';
  return html.slice(startIndex + start.length, endIndex);
}

function occurrences(text, needle) {
  return text.split(needle).length - 1;
}

function routeFor(relative) {
  return relative === 'index.html' ? '/' : `/${posix.dirname(relative)}/`;
}

function isExternal(raw) {
  return /^(?:https?:)?\/\//i.test(raw);
}

function forbiddenHost(raw) {
  if (!isExternal(raw)) return false;
  if (APPROVED_OIA_LINKS.has(decodeHtml(raw).trim())) return false;
  try {
    const url = new URL(raw.startsWith('//') ? `https:${raw}` : raw);
    return /(^|\.)oiacademy\.org$/i.test(url.hostname) || /(^|\.)wixsite\.com$/i.test(url.hostname);
  } catch {
    return true;
  }
}

function localTarget(raw, pageRelative, baseDirectory = root) {
  const clean = decodeHtml(raw).trim();
  if (!clean || clean.startsWith('#') || /^(mailto|tel|data|blob):/i.test(clean)) return null;
  if (/^javascript:/i.test(clean)) return { error: 'javascript URL' };
  if (isExternal(clean)) return { external: true };
  try {
    const baseRoute = routeFor(pageRelative);
    const url = new URL(clean, `https://oia.local${baseRoute}`);
    let pathname = decodeURIComponent(url.pathname);
    if (pathname.includes('\\')) return { error: 'backslash in path' };
    let target = resolve(baseDirectory, `.${pathname}`);
    if (pathname.endsWith('/')) target = resolve(target, 'index.html');
    else if (!extname(pathname) && existsSync(target) && statSync(target).isDirectory()) target = resolve(target, 'index.html');
    return { target };
  } catch {
    return { error: 'invalid URL' };
  }
}

function collectReferences(html) {
  const refs = [];
  for (const match of html.matchAll(/<a\b[^>]*>/gi)) refs.push({ kind: 'link', value: getAttribute(match[0], 'href') });
  for (const match of html.matchAll(/<(?:img|script|source|video|audio|iframe)\b[^>]*>/gi)) {
    const src = getAttribute(match[0], 'src');
    const poster = getAttribute(match[0], 'poster');
    const srcset = getAttribute(match[0], 'srcset');
    if (src) refs.push({ kind: 'runtime', value: src });
    if (poster) refs.push({ kind: 'runtime', value: poster });
    if (srcset) {
      for (const candidate of srcset.split(',')) {
        const value = candidate.trim().split(/\s+/)[0];
        if (value) refs.push({ kind: 'runtime', value });
      }
    }
  }
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    const rel = getAttribute(match[0], 'rel').toLowerCase();
    const href = getAttribute(match[0], 'href');
    if (/\b(?:stylesheet|preload|modulepreload|icon|manifest)\b/.test(rel)) {
      if (href) refs.push({ kind: 'runtime', value: href });
    } else if (href && isExternal(href)) refs.push({ kind: 'runtime', value: href });
  }
  return refs;
}

function mainFragment(html) {
  const main = html.match(/<main\b[^>]*>[^]*?<\/main\s*>/i);
  if (main) return main[0];
  const start = html.search(/<[^>]+\bid\s*=\s*["']main-content["'][^>]*>/i);
  if (start < 0) return '';
  const tail = html.slice(start);
  const boundary = tail.search(/<footer\b|<\/body\s*>/i);
  return boundary < 0 ? tail : tail.slice(0, boundary);
}

function normalizedTokens(html) {
  return stripMarkup(html
    .replace(/<!-- OIA:HOME-HERO:START -->[\s\S]*?<!-- OIA:HOME-HERO:END -->/gi, ' ')
    .replace(/<h1\b[^>]*\bdata-oia-semantic-heading\b[^>]*>[\s\S]*?<\/h1\s*>/gi, ' '))
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function accessibleHeadingOutline(html) {
  const headings = [...mainFragment(html).matchAll(/<h([1-6])\b[^>]*>/gi)].map((match) => {
    const ariaLevel = Number(getAttribute(match[0], 'aria-level'));
    return Number.isInteger(ariaLevel) && ariaLevel >= 1 && ariaLevel <= 6 ? ariaLevel : Number(match[1]);
  });
  if (!headings.length || headings[0] !== 1 || headings.filter((level) => level === 1).length !== 1) return false;
  return headings.every((level, index) => index === 0 || level <= headings[index - 1] + 1);
}

function comparisonFragment(html, relative, redesigned) {
  if (relative !== '189-2/index.html') return mainFragment(html);
  const pattern = redesigned
    ? /<section\b[^>]*class\s*=\s*["'][^"']*oia-legacy-content[^"']*["'][^>]*>[\s\S]*?<\/section\s*>/i
    : /<header\b[^>]*class\s*=\s*["'][^"']*et-l--header[^"']*["'][^>]*>[\s\S]*?<\/header\s*>/i;
  return html.match(pattern)?.[0] ?? '';
}

function contentOrderScore(baselineHtml, redesignHtml, relative) {
  const source = normalizedTokens(comparisonFragment(baselineHtml, relative, false));
  const targetTokens = normalizedTokens(comparisonFragment(redesignHtml, relative, true));
  const target = ` ${targetTokens.join(' ')} `;
  if (!source.length) return { exact: targetTokens.length === 0, score: 1, samples: 0, missing: [], lengths: `0/${targetTokens.length}` };
  if (!target.trim()) return { score: 0, samples: 1, missing: ['all main content'] };
  if (source.length === targetTokens.length && source.every((token, index) => token === targetTokens[index])) {
    return { exact: true, score: 1, samples: 1, missing: [], lengths: `${source.length}/${targetTokens.length}`, mismatch: 'none' };
  }
  const chunkSize = Math.min(8, Math.max(3, Math.floor(source.length / 12)));
  const possible = Math.max(1, source.length - chunkSize + 1);
  const sampleCount = Math.max(1, Math.min(60, Math.floor(source.length / chunkSize)));
  const positions = sampleCount === 1
    ? [0]
    : Array.from({ length: sampleCount }, (_, index) => Math.round(index * (possible - 1) / (sampleCount - 1)));
  let cursor = 0;
  let matches = 0;
  const missing = [];
  for (const position of [...new Set(positions)]) {
    const phrase = ` ${source.slice(position, position + chunkSize).join(' ')} `;
    const found = target.indexOf(phrase, cursor);
    if (found >= 0) {
      matches += 1;
      cursor = found + phrase.length - 1;
    } else missing.push(phrase.trim());
  }
  const mismatch = source.findIndex((token, index) => token !== targetTokens[index]);
  return {
    exact: false,
    score: matches / new Set(positions).size,
    samples: new Set(positions).size,
    missing,
    lengths: `${source.length}/${targetTokens.length}`,
    mismatch: mismatch < 0 ? 'none' : `${mismatch}:${source[mismatch]}→${targetTokens[mismatch] ?? '(end)'}`,
  };
}

function cssReferences(css) {
  return [...css.matchAll(/url\(\s*(["']?)(.*?)\1\s*\)/gi)]
    .map((match) => match[2].trim())
    .filter(Boolean);
}

function run() {
  check('Baseline folder exists', existsSync(baseline), baseline);
  check('Redesign folder exists', existsSync(root), root);
  if (!existsSync(baseline) || !existsSync(root)) throw new Error('Required project folder is missing.');

  const baselineFiles = walkFiles(baseline);
  const redesignFiles = walkFiles(root);
  const baselinePages = baselineFiles.filter((file) => posix.basename(file) === 'index.html');
  const redesignPages = redesignFiles.filter((file) => posix.basename(file) === 'index.html');
  check('Baseline inventory is unchanged', baselineFiles.length === EXPECTED_BASELINE_FILES, `${baselineFiles.length}/${EXPECTED_BASELINE_FILES} files`);
  const baselineDigest = treeDigest(baseline, baselineFiles);
  check('Baseline byte-for-byte digest is unchanged', baselineDigest === EXPECTED_BASELINE_SHA256, baselineDigest);
  check('Baseline route count', baselinePages.length === EXPECTED_BASELINE_PAGE_COUNT, `${baselinePages.length}/${EXPECTED_BASELINE_PAGE_COUNT}`);
  check('Redesign route count', redesignPages.length === EXPECTED_REDESIGN_PAGE_COUNT, `${redesignPages.length}/${EXPECTED_REDESIGN_PAGE_COUNT}`);
  check('All baseline routes remain in the redesign', baselinePages.every((page) => redesignPages.includes(page)));

  for (const [name, relative] of Object.entries(sharedPaths)) {
    check(`Shared ${name} exists`, existsSync(resolve(root, relative)), relative);
  }
  if (failures.some(({ label }) => label.startsWith('Shared '))) throw new Error('Shared redesign sources are incomplete.');

  const header = read(sharedPaths.header);
  const footer = read(sharedPaths.footer);
  const siteCss = read(sharedPaths.siteCss);
  const templatesCss = read(sharedPaths.templatesCss);
  const siteJs = read(sharedPaths.siteJs);
  const safetyJs = read(sharedPaths.safetyJs);
  const build = read(sharedPaths.build);

  check('Shared header has the exact six-link navigation', validateNavigation(header));
  check('Shared shell has no hamburger control', !/(?:hamburger|menu[-_ ]toggle|mobile_menu_bar|aria-label\s*=\s*["'](?:open|toggle)\s+(?:the\s+)?menu)/i.test(header));
  check('Shared sources own the header/footer markers', header.includes(HEADER_START) && header.includes(HEADER_END) && footer.includes(FOOTER_START) && footer.includes(FOOTER_END));
  check('Shared footer links all four social platforms', ['Facebook', 'Instagram', 'LinkedIn', 'YouTube'].every((platform) => footer.includes(`>${platform}<`)));
  check('Build script consumes both shared partials', build.includes(sharedPaths.header) && build.includes(sharedPaths.footer) && /SHARED-HEADER/.test(build) && /SHARED-FOOTER/.test(build));

  const requiredTokens = ['#0F4F4A', '#51BFCE', '#9AC84E', '#F5F0EB', '#FFFFFF'];
  check('Shared CSS contains the approved color tokens', requiredTokens.every((token) => siteCss.toUpperCase().includes(token)));
  check('Shared presentation contains no gold palette token', !/(?:gold|#c19125|rgba\(193\s*,\s*145\s*,\s*37)/i.test(`${siteCss}\n${templatesCss}\n${safetyJs}`));
  check('Shared CSS contains Georgia and Open Sans', /Georgia/i.test(siteCss) && /Open Sans/i.test(siteCss));
  check('Demo safety uses the approved message', safetyJs.includes('Demo only—nothing was sent or saved.'));
  check('Demo safety intercepts submission', /addEventListener\s*\(\s*["']submit["']/i.test(safetyJs) && /preventDefault\s*\(/.test(safetyJs));
  check('High-risk screens lock every non-navigation control', /highRisk\s*&&\s*!isNavigation\(control\)/.test(safetyJs));
  check('Sensitive controls remain locked on every route', /!highRisk\s*&&\s*isSensitive\(control\)/.test(safetyJs));
  check('Local visual form-step navigation is implemented', /wpforms-page-next/.test(siteJs) && /wpforms-page-prev/.test(siteJs) && /showPage\s*=/.test(siteJs));
  check('Shared scripts contain no network calls', !/(?:\bfetch\s*\(|XMLHttpRequest|sendBeacon)/.test(`${siteJs}\n${safetyJs}`));
  check(
    'Browser storage is limited to the supply-list dismissal preference',
    !/sessionStorage/.test(`${siteJs}\n${safetyJs}`)
      && occurrences(siteJs, 'localStorage.') === 2
      && siteJs.includes('oia-supply-list-dismissed-2026-27')
      && !/localStorage/.test(safetyJs),
  );
  const activeRouteProblems = redesignPages.map(routeFor).filter((route) => !siteJs.includes(JSON.stringify(route)));
  check(`Active navigation mapping covers all ${EXPECTED_REDESIGN_PAGE_COUNT} routes`, activeRouteProblems.length === 0, activeRouteProblems.join(', '));

  const markerProblems = [];
  const navigationProblems = [];
  const sharedAssetProblems = [];
  const forbiddenAnchors = [];
  const brokenReferences = [];
  const unsafeForms = [];
  const parityProblems = [];
  const imageAlternativeProblems = [];
  const headingProblems = [];
  const staleCredentialArtifacts = [];
  for (const relative of redesignPages) {
    const html = read(relative);
    const route = routeFor(relative);
    const headerFragment = between(html, HEADER_START, HEADER_END);
    const footerFragment = between(html, FOOTER_START, FOOTER_END);
    if (!headerFragment || !footerFragment || [HEADER_START, HEADER_END, FOOTER_START, FOOTER_END].some((marker) => occurrences(html, marker) !== 1)) markerProblems.push(route);
    if (!validateNavigation(headerFragment)) navigationProblems.push(route);
    for (const asset of sharedRefs) {
      if (!html.includes(asset)) sharedAssetProblems.push(`${route} missing ${asset}`);
    }
    for (const { href } of anchors(html)) {
      if (forbiddenHost(href)) forbiddenAnchors.push(`${route} -> ${href}`);
    }
    for (const reference of collectReferences(html)) {
      if (!reference.value) continue;
      const result = localTarget(reference.value, relative);
      if (result?.external) {
        if (reference.kind === 'runtime') brokenReferences.push(`${route} external runtime ${reference.value}`);
      } else if (result?.error) {
        brokenReferences.push(`${route} ${result.error}: ${reference.value}`);
      } else if (result?.target && !existsSync(result.target)) {
        brokenReferences.push(`${route} missing ${reference.value}`);
      }
    }
    for (const image of html.matchAll(/<img\b[^>]*>/gi)) {
      const hidden = getAttribute(image[0], 'aria-hidden').toLowerCase() === 'true';
      const alt = getAttribute(image[0], 'alt').trim();
      if (!hidden && !alt) imageAlternativeProblems.push(`${route} ${getAttribute(image[0], 'src') || '(inline image)'}`);
    }
    if (!accessibleHeadingOutline(html)) headingProblems.push(route);
    if (/(?:data-token(?:-time)?|data-nonce|\bnonce)\s*=|wpforms-recaptcha-container|name\s*=\s*["']wpforms\[recaptcha\]/i.test(html)) {
      staleCredentialArtifacts.push(route);
    }
    for (const form of html.matchAll(/<form\b[^>]*>/gi)) {
      const method = getAttribute(form[0], 'method').toLowerCase();
      const action = getAttribute(form[0], 'action').trim();
      if (method === 'post' || (action && action !== '#')) unsafeForms.push(`${route} method=${method || 'get'} action=${action || '(empty)'}`);
    }
    if (baselinePages.includes(relative) && !APPROVED_CONTENT_REPLACEMENTS.has(relative)) {
      const parity = contentOrderScore(read(relative, baseline), html, relative);
      if (!parity.exact) parityProblems.push(`${route} ${(parity.score * 100).toFixed(0)}% of ${parity.samples} ordered samples (${parity.lengths}, ${parity.mismatch}); first miss: "${parity.missing[0]}"`);
    }
  }

  check('Every page has one shared header and footer marker pair', markerProblems.length === 0, markerProblems.slice(0, 8).join(', '));
  check('Every page has the exact six-link navigation and mapping', navigationProblems.length === 0, navigationProblems.slice(0, 8).join(', '));
  check('Every page links all four shared assets', sharedAssetProblems.length === 0, sharedAssetProblems.slice(0, 8).join('; '));
  check('No unapproved page anchors to live OIA or Wix', forbiddenAnchors.length === 0, forbiddenAnchors.slice(0, 8).join('; '));
  check('All internal links and local runtime assets exist', brokenReferences.length === 0, brokenReferences.slice(0, 8).join('; '));
  check('Forms have no POST or endpoint action', unsafeForms.length === 0, unsafeForms.slice(0, 8).join('; '));
  check('Every meaningful image has alternative text', imageAlternativeProblems.length === 0, imageAlternativeProblems.slice(0, 8).join('; '));
  check('Every main-content heading outline starts at level one without skips', headingProblems.length === 0, headingProblems.slice(0, 8).join(', '));
  check('Captured tokens, nonces, and CAPTCHA fields are removed', staleCredentialArtifacts.length === 0, staleCredentialArtifacts.slice(0, 8).join(', '));
  check('Page-content wording and order match the baseline except approved content replacements', parityProblems.length === 0, parityProblems.slice(0, 8).join('; '));

  const newsletterHtml = read('newsletter/index.html');
  check(
    'Newsletter route is a 2026–2027 school news and alerts board',
    /class=["'][^"']*oia-news-board[^"']*["']/.test(newsletterHtml)
      && /School News &amp; Alerts/.test(newsletterHtml)
      && /2026–2027 School Year/.test(newsletterHtml)
      && occurrences(newsletterHtml, 'https://www.canva.com/design/') === 3,
  );
  check(
    'Newsletter route contains no signup, search, comments, or forms',
    !/(?:tnp-subscription|wp-block-search|Recent Comments|<form\b)/i.test(mainFragment(newsletterHtml)),
  );

  const studentLifeHtml = read('student-life/index.html');
  check(
    'Student Life links the supplied handbook document',
    occurrences(studentLifeHtml, STUDENT_HANDBOOK_URL) === 2
      && !/handbook will appear here/i.test(studentLifeHtml),
  );
  check(
    'Shared supply-list notice links locally and keeps the dismissal preference',
    siteJs.includes(SUPPLY_LIST_ROUTE)
      && siteJs.includes('oia-supply-notice')
      && siteJs.includes('localStorage.setItem'),
  );
  const handbookHtml = read('student-handbook/index.html');
  const supplyListHtml = read('school-supply-list/index.html');
  check('Local handbook contains the supplied school policies', /INTRODUCTORY STATEMENT/.test(handbookHtml) && /TECHNOLOGY, DIGITAL SAFETY, AND ARTIFICIAL INTELLIGENCE/.test(handbookHtml) && /HEALTH AND SAFETY/.test(handbookHtml));
  check('Local supply list contains the current grade-group supplies', /2026–2027 School Supply List/.test(supplyListHtml) && /All Students/.test(supplyListHtml) && /Grades 1–5/.test(supplyListHtml));
  check('Only Student Life links Google Docs', !redesignPages.some((relative) => relative !== 'student-life/index.html' && /docs\.google\.com\/document/i.test(read(relative))));
  const uniformHtml = read('uniform/index.html');
  check(
    'Uniform page displays only the supplied visual guide',
    /class=["'][^"']*oia-uniform-visual[^"']*["']/.test(uniformHtml)
      && occurrences(uniformHtml, '/assets/redesign/images/student-uniform-guide-hd.png') === 2
      && !/(?:Screen-Shot-2026-02-26|WhatsApp-Image-2025-05-21)/.test(uniformHtml),
  );
  check(
    'Uniform page links the approved gym-uniform purchase form',
    occurrences(uniformHtml, 'https://oiacademy.org/?wpforms_form_preview=243663') === 1
      && /To buy gym uniforms, go to this link/i.test(uniformHtml),
  );
  check(
    'Shared footer no longer displays the duplicate logo image',
    !/<img\b/i.test(footer),
  );
  const heroOptionsHtml = read('hero-options/index.html');
  check(
    'Hero selection page renders twenty distinct numbered concepts',
    occurrences(heroOptionsHtml, 'class="oia-concept-card"') === 20
      && occurrences(heroOptionsHtml, 'class="oia-hero-concept ') === 20,
  );

  const cssProblems = [];
  for (const relative of [sharedPaths.siteCss, sharedPaths.templatesCss]) {
    const css = read(relative);
    for (const reference of cssReferences(css)) {
      if (/^(?:data:|#)/i.test(reference)) continue;
      if (isExternal(reference)) cssProblems.push(`${relative} external ${reference}`);
      else {
        const path = reference.split(/[?#]/)[0];
        const target = path.startsWith('/') ? resolve(root, `.${path}`) : resolve(root, dirname(relative), path);
        if (!existsSync(target)) cssProblems.push(`${relative} missing ${reference}`);
      }
    }
  }
  check('Shared CSS has no external or missing assets', cssProblems.length === 0, cssProblems.slice(0, 8).join('; '));

  console.log(`\n${failures.length ? 'FAIL' : 'PASS'}  ${passed} checks passed; ${failures.length} failed.`);
  if (failures.length) process.exitCode = 1;
}

try {
  run();
} catch (error) {
  console.error(`\nFAIL  Verification stopped: ${error.message}`);
  process.exitCode = 1;
}
