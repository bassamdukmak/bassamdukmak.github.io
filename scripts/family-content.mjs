import { readFile } from 'node:fs/promises';

export const escapeHtml = (text) => String(text).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

export function validateContent(data) {
  const text = (value, label, optional = false) => {
    if (typeof value !== 'string' || (!optional && !value.trim()) || value.length > 12000) throw new Error(`${label}: enter valid text.`);
  };
  const url = (value, label, optional = false) => {
    if (optional && !value) return;
    text(value, label);
    const parsed = new URL(value);
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password) throw new Error(`${label}: use a public HTTPS link.`);
  };
  const date = (value, label) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) !== value) throw new Error(`${label}: use a real date.`);
  };
  const list = (items, label) => {
    if (!Array.isArray(items) || items.length > 100) throw new Error(`${label}: use a list of at most 100 items.`);
  };
  text(data.eventsHeading, 'Events heading');
  url(data.eventCalendarUrl, 'Event Calendar');
  url(data.volunteerUrl, 'Volunteer signup');
  list(data.newsletters, 'Newsletters');
  list(data.events, 'Events');
  for (const item of data.newsletters) {
    date(item.date, 'Newsletter date');
    text(item.title, 'Newsletter title');
    text(item.description, 'Newsletter description', true);
    url(item.url, 'Newsletter link');
  }
  const ids = new Set();
  for (const event of data.events) {
    if (!/^[a-z][a-z0-9-]{0,79}$/.test(event.id) || ids.has(event.id)) throw new Error('Event ID: use a unique lowercase name with hyphens.');
    ids.add(event.id);
    text(event.title, 'Event title');
    text(event.subtitle, 'Event subtitle', true);
    text(event.summary, 'Event summary');
    date(event.startDate, 'Event start');
    date(event.endDate, 'Event end');
    if (event.startDate > event.endDate) throw new Error('Event end must follow its start.');
    for (const key of ['details', 'notes']) {
      list(event[key], `Event ${key}`);
      event[key].forEach((value) => text(value, `Event ${key}`));
    }
    url(event.submissionUrl, 'Submission form', true);
    url(event.scoreboardUrl, 'Scoreboard', true);
    if (event.scoreboardUrl) {
      const chart = new URL(event.scoreboardUrl);
      if (chart.hostname !== 'docs.google.com' || !/^\/spreadsheets\/d\/e\/[\w-]+\/pubchart$/.test(chart.pathname)) throw new Error('Scoreboard: use the published Google Sheets chart link.');
    }
    for (const key of ['adultReward', 'studentReward', 'announcement']) text(event[key], key, true);
    if (event.submissionInstructions !== undefined) text(event.submissionInstructions, 'Submission instructions', true);
  }
  return data;
}

export async function loadContent() {
  return validateContent(JSON.parse(await readFile(new URL('../content/family-updates.json', import.meta.url), 'utf8')));
}

export function renderNewsletters(data) {
  return `<ul class="oia-news-topic-list" aria-label="Family newsletters">${[...data.newsletters].sort((a, b) => b.date.localeCompare(a.date)).map((item) => `<li><h3><a href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">${escapeHtml(item.title)}</a></h3><p>${escapeHtml(item.description)}</p></li>`).join('\n')}</ul>`;
}

export function renderEvents(data) {
  const bullets = (items) => `<ul>${items.map((text) => `<li>${escapeHtml(text)}</li>`).join('')}</ul>`;
  const formatDate = (date) => new Intl.DateTimeFormat('en-US', {month:'short', day:'numeric', year:'numeric', timeZone:'UTC'}).format(new Date(`${date}T12:00:00Z`));
  return `<!-- OIA:COMMUNITY-EVENTS:START -->
  <section class="oia-activities-page" data-oia-monthly-events>
    <header class="oia-activities-heading"><p class="oia-eyebrow">Our school community</p><h1>${escapeHtml(data.eventsHeading)}</h1><p>Discover this month’s activities.</p></header>
    <div class="oia-activity-cards">${data.events.map((event) => `<article class="oia-community-event" data-start="${event.startDate}" data-end="${event.endDate}">
      <svg class="oia-activity-icon" viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 10c7-2 12-1 17 3v27c-5-4-10-5-17-3zM41 10c-7-2-12-1-17 3v27c5-4 10-5 17-3zM13 18h5M30 18h5M13 24h5M30 24h5"/></svg>
      <p class="oia-event-date"><time datetime="${event.startDate}">${formatDate(event.startDate)}</time> – <time datetime="${event.endDate}">${formatDate(event.endDate)}</time></p>
      <h2>${escapeHtml(event.title)}</h2><p class="oia-event-subtitle">${escapeHtml(event.subtitle)}</p>
      <button class="oia-event-action" type="button" data-open-event="activity-${event.id}">Learn More <span aria-hidden="true">→</span></button>
      <dialog class="oia-activity-dialog" id="activity-${event.id}" aria-labelledby="activity-${event.id}-title">
        <button class="oia-activity-close" type="button" data-close-event aria-label="Close activity details">×</button>
        <header><p class="oia-event-date">${formatDate(event.startDate)} – ${formatDate(event.endDate)}</p><h2 id="activity-${event.id}-title">${escapeHtml(event.title)}</h2><p class="oia-event-subtitle">${escapeHtml(event.subtitle)}</p></header>
        <div class="oia-activity-sections"><section><h3>How it works</h3>${bullets(event.details)}</section>
        ${event.submissionUrl ? `<section><h3>How to submit</h3>${event.submissionInstructions ? `<p>${escapeHtml(event.submissionInstructions)}</p>` : ''}<a class="oia-event-action" href="${escapeHtml(event.submissionUrl)}" target="_blank" rel="noreferrer">Open Submission Form →</a></section>` : ''}
        ${event.notes.length ? `<section><h3>Important notes</h3>${bullets(event.notes)}</section>` : ''}
        ${event.adultReward || event.studentReward ? `<section><h3>The winning team</h3>${event.adultReward ? `<p><strong>Adults:</strong> ${escapeHtml(event.adultReward)}</p>` : ''}${event.studentReward ? `<p><strong>Students:</strong> ${escapeHtml(event.studentReward)}</p>` : ''}${event.announcement ? `<p>${escapeHtml(event.announcement)}</p>` : ''}</section>` : ''}</div>
        ${event.scoreboardUrl ? `<section class="oia-activity-score"><h3>Live scoreboard</h3><div class="oia-scoreboard" tabindex="0" role="region" aria-label="Live scoreboard; scroll sideways to see the full chart"><iframe data-src="${escapeHtml(event.scoreboardUrl)}" loading="lazy" width="704" height="436" title="${escapeHtml(event.title)} live scoreboard: Adults vs. Students" referrerpolicy="no-referrer"></iframe></div><p class="oia-scoreboard-hint">Swipe or scroll sideways to see the full scoreboard.</p><a href="${escapeHtml(event.scoreboardUrl)}" target="_blank" rel="noreferrer">Open scoreboard in a new tab →</a></section>` : ''}
      </dialog>
    </article>`).join('\n')}</div>
    <p class="oia-events-empty" hidden>There are no activities to share this month. Check back soon.</p>
    <noscript><p>Enable JavaScript to open activity details.</p></noscript>
  </section>
  <!-- OIA:COMMUNITY-EVENTS:END -->`;
}
