import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const output = join(root, "dist", "siteground-oia", "oia-redesign");
const routes = [
  "189-2", "2025-26-calendar", "2025-26-program-cost", "2025-admission",
  "2026-2027-admission-process", "2026-2027-calendar", "2026-2027-program-cost",
  "board", "calendar", "edchoice-at-oia", "edchoice-how-to-apply", "faq",
  "gallery", "newsletter", "life-at-oia", "jumua-volunteer", "ourteam", "school-supply-list", "student-handbook", "student-life",
  "uniform", "waitlist-policy", "welcome",
];

const routerSource = await readFile(join(root, "siteground", "oia-static-router.php"), "utf8");
const routerBlock = routerSource.match(/\$routes\s*=\s*\[([\s\S]*?)\];/)?.[1] || "";
const routerRoutes = [...routerBlock.matchAll(/'([^']+)'/g)].map((match) => match[1]);
const packageRoutes = ["/", ...routes.map((route) => `/${route}/`)];
if (JSON.stringify(routerRoutes) !== JSON.stringify(packageRoutes)) {
  throw new Error("SiteGround router and package route lists differ");
}

await rm(join(root, "dist", "siteground-oia"), { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(join(root, "index.html"), join(output, "index.html"));
for (const route of routes) await cp(join(root, route), join(output, route), { recursive: true });
for (const folder of ["assets", "wp-content", "wp-includes"]) {
  await cp(join(root, folder), join(output, folder), { recursive: true });
}
await writeFile(join(output, ".htaccess"), "Require all denied\n");

const files = [];
async function collect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await collect(path);
    else if (/\.(?:css|html|m?js)$/i.test(entry.name)) files.push(path);
  }
}

await collect(output);
for (const file of files) {
  let text = await readFile(file, "utf8");
  text = text
    .replaceAll("http://oiacademy.org", "https://oiacademy.org")
    .replaceAll("/assets/", "/__OIA_ASSETS__/")
    .replaceAll("/wp-content/", "/__OIA_WP_CONTENT__/")
    .replaceAll("/wp-includes/", "/__OIA_WP_INCLUDES__/")
    .replaceAll("/__OIA_ASSETS__/", "/wp-content/oia-redesign/assets/")
    .replaceAll("/__OIA_WP_CONTENT__/", "/wp-content/oia-redesign/wp-content/")
    .replaceAll("/__OIA_WP_INCLUDES__/", "/wp-content/oia-redesign/wp-includes/");
  await writeFile(file, text);
}

await mkdir(join(root, "dist", "siteground-oia", "mu-plugins"), { recursive: true });
await cp(
  join(root, "siteground", "oia-static-router.php"),
  join(root, "dist", "siteground-oia", "mu-plugins", "oia-static-router.php"),
);

console.log(`Built ${routes.length + 1} redesigned routes in ${output}`);
