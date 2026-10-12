import assert from "node:assert/strict";
import http from "node:http";
import { mkdtemp, mkdir, writeFile, readFile, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { Script } from "node:vm";
import { createContentEditor } from "./edit-content.mjs";

const root = await mkdtemp(path.join(tmpdir(), "oia-content-editor-"));
const initial = {
  eventsHeading: "School community",
  eventCalendarUrl: "https://example.org/calendar",
  volunteerUrl: "https://example.org/volunteer",
  newsletters: [{ date: "2026-10-01", title: "October newsletter", description: "School updates", url: "https://example.org/newsletter" }],
  events: [{
    id: "community-activity", title: "Community activity", subtitle: "", startDate: "2026-10-01", endDate: "2026-10-31",
    summary: "A sample school activity.", details: ["Activity details."], notes: [], submissionUrl: "", submissionInstructions: "",
    scoreboardUrl: "", adultReward: "", studentReward: "", announcement: "",
  }],
};
const contentFile = path.join(root, "content/family-updates.json");
const readContent = async () => JSON.parse(await readFile(contentFile, "utf8"));
let activeBuilds = 0, highestActive = 0, failBuilds = 0;
const server = createContentEditor({ root, build: async () => {
  activeBuilds++; highestActive = Math.max(highestActive, activeBuilds);
  try {
    const current = await readContent();
    await new Promise(resolve => setTimeout(resolve, 15));
    await writeFile(path.join(root, "index.html"), current.eventsHeading);
    if (failBuilds > 0) { failBuilds--; throw new Error("Simulated partial build failure"); }
  } finally { activeBuilds--; }
} });

try {
  await Promise.all(["content", "scripts", "assets", "sample"].map(dir => mkdir(path.join(root, dir))));
  await writeFile(contentFile, `${JSON.stringify(initial, null, 2)}\n`);
  await writeFile(path.join(root, "index.html"), "Website preview");
  await writeFile(path.join(root, "sample/index.html"), "Sample page");
  await writeFile(path.join(root, "assets/site.css"), "body { color: green; }");
  await writeFile(path.join(root, "assets/family-dates.mjs"), "export const value = 'date module';");
  await writeFile(path.join(root, "scripts/content-editor.html"), await readFile(new URL("./content-editor.html", import.meta.url)));
  await symlink(new URL("./edit-content.mjs", import.meta.url).pathname, path.join(root, "assets/outside.js"));
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve); });
  const base = `http://127.0.0.1:${server.address().port}`;
  const rawStatus = (route, headers = {}) => new Promise((resolve, reject) => {
    const request = http.get({ hostname: "127.0.0.1", port: server.address().port, path: route, headers }, response => { response.resume(); resolve(response.statusCode); });
    request.on("error", reject);
  });
  const api = await fetch(`${base}/api/content`);
  assert.equal(api.status, 200);
  const { content, csrfToken } = await api.json();
  assert.deepEqual(content, initial);
  assert.match(csrfToken, /^[a-f0-9]{64}$/);
  const post = (value, headers = {}) => fetch(`${base}/api/content`, { method: "POST", headers: { "Content-Type": "application/json", Origin: base, "X-OIA-Editor-Token": csrfToken, ...headers }, body: typeof value === "string" ? value : JSON.stringify(value) });

  assert.equal(await rawStatus("/", { Host: "attacker.invalid" }), 403);
  for (const headers of [{ Origin: "https://attacker.invalid" }, { "X-OIA-Editor-Token": "invalid" }, { "X-OIA-Editor-Token": "ÿ".repeat(64) }]) assert.equal((await post(initial, headers)).status, 403);
  assert.equal((await post(initial, { "Content-Type": "text/plain" })).status, 415);
  assert.equal((await post("{not-json}")).status, 400);
  const invalid = structuredClone(initial); invalid.newsletters[0].url = "javascript:alert(1)";
  assert.equal((await post(invalid)).status, 400);
  assert.equal((await post("x".repeat(256 * 1024 + 1))).status, 413);
  assert.deepEqual(await readContent(), initial, "Rejected saves must not change content");

  const editor = await fetch(`${base}/editor/`);
  assert.equal(editor.status, 200);
  const editorText = await editor.text();
  assert.match(editorText, /Save updates/);
  assert.ok(!editorText.includes("__EDITOR_NONCE__"));
  assert.match(editor.headers.get("content-security-policy"), /script-src 'nonce-/);
  new Script(editorText.match(/<script[^>]*>([\s\S]*?)<\/script>/)[1], { filename: "content-editor.html" });
  for (const route of ["/content/family-updates.json", "/scripts/edit-content.mjs", "/.git/config", "/package.json", "/assets/outside.js", "/shared/header.html"]) {
    assert.ok([403, 404].includes((await fetch(`${base}${route}`)).status), `Must block ${route}`);
  }
  assert.equal((await fetch(`${base}/assets/site.css`)).status, 200);
  const module = await fetch(`${base}/assets/family-dates.mjs`);
  assert.equal(module.status, 200);
  assert.equal(module.headers.get("content-type"), "text/javascript; charset=utf-8");
  assert.equal((await fetch(`${base}/sample/`)).status, 200);
  assert.equal((await fetch(`${base}/api/content`, { method: "PUT" })).status, 405);
  assert.equal(await rawStatus("/%2e%2e/scripts/edit-content.mjs"), 403);

  const first = structuredClone(initial); first.eventsHeading = "Local update one";
  const second = structuredClone(initial); second.eventsHeading = "Local update two";
  const results = await Promise.all([post(first), post(second)]);
  assert.ok(results.every(response => response.status === 200));
  assert.equal(highestActive, 1, "Saves and builds must run one at a time");
  assert.deepEqual(await readContent(), second);
  assert.deepEqual(JSON.parse(await readFile(path.join(root, "content/family-updates.previous.json"), "utf8")), first);
  assert.equal(await readFile(path.join(root, "index.html"), "utf8"), second.eventsHeading);

  failBuilds = 1;
  const failed = await post(first);
  assert.equal(failed.status, 500);
  assert.match((await failed.json()).error, /previous content and preview have been restored/);
  assert.deepEqual(await readContent(), second);
  assert.equal(await readFile(path.join(root, "index.html"), "utf8"), second.eventsHeading, "Rollback must repair partial preview output");
  assert.equal((await post(first)).status, 200, "A failed save must not poison later saves");

  failBuilds = 2;
  const failedRollback = await post(second);
  assert.equal(failedRollback.status, 500);
  assert.match((await failedRollback.json()).error, /preview needs a rebuild/);
  assert.deepEqual(await readContent(), first, "Content must restore even when rollback rebuild fails");
  const empty = { ...initial, newsletters: [], events: [] };
  assert.equal((await post(empty)).status, 200, "Removing all newsletters and activities must remain valid");
  assert.deepEqual(await readContent(), empty);
  console.log("VERIFIED: local editor blocks unsafe saves and private files; validates content, serializes saves, keeps one backup, and restores content after build failures. All checks used a temporary folder; the real website was not rebuilt.");
} finally {
  await new Promise(resolve => server.close(resolve));
  await rm(root, { recursive: true, force: true });
}
