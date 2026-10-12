import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateContent, renderEvents, renderNewsletters } from './family-content.mjs';
import { schoolDate, orderDeadline, orderDeadlineText, isInSchoolMonth } from '../assets/redesign/family-dates.mjs';

const read = (file) => readFile(new URL(`../${file}`, import.meta.url), 'utf8');
const content = validateContent(JSON.parse(await read('content/family-updates.json')));
const fixture = { ...content, newsletters: [{ date: '2026-10-12', title: 'Test newsletter', description: '', url: 'https://example.com/newsletter' }], events: [{ id: 'test-event', title: 'Test activity', subtitle: '', summary: 'Test activity summary', startDate: '2026-10-01', endDate: '2026-10-29', details: [], notes: [], submissionUrl: '', scoreboardUrl: '', adultReward: '', studentReward: '', announcement: '' }] };
assert.equal(schoolDate(new Date('2026-11-01T03:59:00Z')), '2026-10-31');
assert.equal(schoolDate(new Date('2026-11-01T04:01:00Z')), '2026-11-01');
assert.equal(orderDeadline(2026, 9).toISOString().slice(0, 10), '2026-09-30');
assert.equal(orderDeadline(2026, 10).toISOString().slice(0, 10), '2026-11-04');
assert.equal(orderDeadline(2027, 0).toISOString().slice(0, 10), '2026-12-30');
assert.match(orderDeadlineText(new Date('2026-10-12T18:00:00Z')), /The deadline was Wednesday, September 30, 2026 at 9 a.m./);
assert.match(orderDeadlineText(new Date('2026-11-01T18:00:00Z')), /The deadline is Wednesday, November 4, 2026 at 9 a.m./);
for (let year = 2026; year <= 2028; year++) for (let month = 0; month < 12; month++) {
  const cutoff = orderDeadline(year, month);
  assert.equal(cutoff.getUTCDay(), 3);
  const friday = new Date(cutoff.getTime() + 2 * 86400000);
  assert.equal(friday.getUTCMonth(), month);
  assert.equal(friday.getUTCFullYear(), year);
  assert.ok(friday.getUTCDate() <= 7);
}
assert.equal(isInSchoolMonth('2026-10-02', '2026-10-29', new Date('2026-10-30T18:00:00Z')), true);
assert.equal(isInSchoolMonth('2026-10-02', '2026-10-29', new Date('2026-11-01T18:00:00Z')), false);
assert.equal(isInSchoolMonth('2026-10-29', '2026-11-03', new Date('2026-11-01T18:00:00Z')), true);
for (const mutate of [
  (data) => { data.newsletters[0].url = 'javascript:alert(1)'; },
  (data) => { data.events[0].scoreboardUrl = 'https://attacker.invalid/embed'; },
  (data) => { data.events[0].startDate = '2026-02-30'; },
  (data) => { data.events[0].endDate = '2026-01-01'; },
  (data) => { data.events.push(structuredClone(data.events[0])); },
]) {
  const data = structuredClone(fixture); mutate(data); assert.throws(() => validateContent(data));
}
const escaped = structuredClone(fixture);
escaped.events[0].title = '<script>alert("x")</script>';
escaped.newsletters[0].title = '<img onerror=alert(1)>';
assert.ok(!renderEvents(escaped).includes('<script>'));
assert.ok(renderEvents(escaped).includes('&lt;script&gt;'));
assert.ok(!renderNewsletters(escaped).includes('<img onerror'));
assert.ok(!renderEvents({...content, events: []}).includes('class="oia-community-event"'));
const home = await read('index.html');
assert.equal((home.match(/OIA:COMMUNITY-EVENTS:START/g) || []).length, 0);
assert.match(home, /href="\/life-at-oia\/"/);
const activities = await read('life-at-oia/index.html');
assert.ok(activities.includes(renderEvents(content)), 'Activities must live on their separate page.');
assert.ok(!activities.includes('View Event Calendar'));
assert.match(activities, /<dialog/);

assert.match(await read('jumah-bites-2/index.html'), /Orders for Jumah Bite are now closed[\s\S]*?The deadline was/);
const hub = await read('student-life/index.html');
assert.equal((hub.match(/<h3>Jumu’ah Volunteer<\/h3>/g) || []).length, 1);
assert.equal((hub.match(/<h3>Event Calendar<\/h3>/g) || []).length, 0);
const calendar = await read('2026-2027-calendar/index.html');
const cells = [...calendar.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((match) => match[1]);
assert.deepEqual(cells, JSON.parse(await read('scripts/calendar-content.fixture.json')), 'All 27 school calendar date/event pairs must remain unchanged.');
assert.equal((calendar.match(/class="oia-calendar-month"/g) || []).length, 10);
assert.equal((calendar.match(/<th scope="col">Date<\/th>/g) || []).length, 10);
const newsletter = await read('newsletter/index.html');
assert.ok(newsletter.includes(renderNewsletters(content)), 'All configured newsletters must render in newest-first order.');
console.log('VERIFIED: Ohio monthly deadlines and month boundaries, safe content, requested links, live chart markup, newsletter rendering, and all 27 calendar entries.');
