import http from "node:http";
import { readFile, writeFile, rename, rm, stat, realpath } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { validateContent } from "./family-content.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const run = promisify(execFile);
const bodyLimit = 256 * 1024;
const publicTypes = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8", ".svg": "image/svg+xml",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
  ".gif": "image/gif", ".webp": "image/webp", ".avif": "image/avif",
  ".ico": "image/x-icon", ".pdf": "application/pdf", ".ttf": "font/ttf",
  ".woff": "font/woff", ".woff2": "font/woff2", ".eot": "application/vnd.ms-fontobject",
  ".mp4": "video/mp4", ".mp3": "audio/mpeg",
};

function problem(status, message) {
  return Object.assign(new Error(message), { status });
}

async function atomicWrite(filename, text) {
  const temporary = `${filename}.${randomBytes(8).toString("hex")}.tmp`;
  try {
    await writeFile(temporary, text, { flag: "wx", mode: 0o600 });
    await rename(temporary, filename);
  } finally {
    await rm(temporary, { force: true });
  }
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > bodyLimit) {
        reject(problem(413, "This update is too large. Please shorten it."));
      } else chunks.push(chunk);
    });
    request.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    request.on("error", reject);
    request.on("aborted", () => reject(problem(400, "The update was interrupted. Please try again.")));
  });
}

// The test supplies a temporary folder and build so checks never rewrite the school website.
export function createContentEditor({ root = projectRoot, build = () => run(process.execPath, [path.join(root, "scripts/build-redesign.mjs")], { cwd: root, timeout: 60_000 }) } = {}) {
  const filename = path.join(root, "content/family-updates.json");
  const backup = path.join(root, "content/family-updates.previous.json");
  const token = randomBytes(32).toString("hex");
  const nonce = randomBytes(18).toString("base64");
  let saves = Promise.resolve();

  async function save(data) {
    const previous = await readFile(filename, "utf8");
    await atomicWrite(backup, previous);
    await atomicWrite(filename, `${JSON.stringify(data, null, 2)}\n`);
    try {
      await build();
    } catch {
      await atomicWrite(filename, previous);
      try {
        await build();
      } catch {
        throw problem(500, "The update could not be built. Your previous content is restored, but the preview needs a rebuild. Contact the website maintainer.");
      }
      throw problem(500, "The update could not be built. Your previous content and preview have been restored. Please contact the website maintainer before trying again.");
    }
    return data;
  }

  return http.createServer(async (request, response) => {
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("X-Frame-Options", "DENY");
    response.setHeader("Referrer-Policy", "same-origin");
    const json = (status, value) => {
      response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify(value));
    };
    try {
      const origin = `http://127.0.0.1:${request.socket.localPort}`;
      if (request.headers.host !== origin.slice(7)) throw problem(403, "Open this editor through its 127.0.0.1 address.");
      const pathname = decodeURIComponent(request.url.split("?")[0]);
      if (!pathname.startsWith("/") || pathname.includes("\\") || pathname.includes("\0") || pathname.split("/").some((part) => part.startsWith("."))) {
        throw problem(403, "This path is not available.");
      }

      if (pathname === "/api/content") {
        if (request.method === "GET") {
          json(200, { content: validateContent(JSON.parse(await readFile(filename, "utf8"))), csrfToken: token });
          return;
        }
        if (request.method !== "POST") throw problem(405, "Use the editor to save updates.");
        const supplied = request.headers["x-oia-editor-token"];
        if (request.headers.origin !== origin || typeof supplied !== "string" || !/^[a-f0-9]{64}$/.test(supplied) || !timingSafeEqual(Buffer.from(supplied), Buffer.from(token))) {
          throw problem(403, "Your editor session is invalid. Reload this page and try again.");
        }
        if (request.headers["content-type"]?.split(";")[0].trim() !== "application/json") throw problem(415, "Updates must use JSON.");
        if (Number(request.headers["content-length"]) > bodyLimit) {
          request.resume();
          throw problem(413, "This update is too large. Please shorten it.");
        }
        let data;
        try {
          data = validateContent(JSON.parse(await readBody(request)));
        } catch (error) {
          if (error.status) throw error;
          throw problem(400, error instanceof SyntaxError ? "The update could not be read. Please reload the editor." : error.message);
        }
        const pending = saves.then(() => save(data));
        saves = pending.catch(() => {});
        json(200, { content: await pending, previewUrl: "/" });
        return;
      }

      if (!["GET", "HEAD"].includes(request.method)) throw problem(405, "This page is read-only.");
      let file;
      if (["/editor/", "/editor"].includes(pathname)) {
        const template = await readFile(path.join(root, "scripts/content-editor.html"), "utf8");
        response.setHeader("Content-Security-Policy", `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'nonce-${nonce}'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`);
        response.writeHead(200, { "Content-Type": publicTypes[".html"] });
        response.end(request.method === "HEAD" ? undefined : template.replaceAll("__EDITOR_NONCE__", nonce));
        return;
      }
      if (/^\/(?:[a-z0-9][a-z0-9-]*\/)?(?:index\.html)?$/.test(pathname)) {
        file = path.join(root, pathname, pathname.endsWith("index.html") ? "" : "index.html");
      } else if (/^\/(?:assets|wp-content|wp-includes)\//.test(pathname) && publicTypes[path.extname(pathname).toLowerCase()] && path.extname(pathname).toLowerCase() !== ".html") {
        file = path.join(root, pathname);
      } else throw problem(404, "This page is not available in the local preview.");
      const [actual, actualRoot] = await Promise.all([realpath(file), realpath(root)]);
      if (!actual.startsWith(`${actualRoot}${path.sep}`) || !(await stat(actual)).isFile()) throw problem(403, "This file is not available.");
      response.writeHead(200, { "Content-Type": publicTypes[path.extname(file).toLowerCase()] });
      response.end(request.method === "HEAD" ? undefined : await readFile(actual));
    } catch (error) {
      if (response.headersSent) { response.destroy(); return; }
      json(error.status || (error.code === "ENOENT" ? 404 : 500), { error: error.status ? error.message : "The local editor could not complete this request. Please contact the website maintainer." });
    }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = createContentEditor();
  server.on("error", (error) => {
    console.error(error.code === "EADDRINUSE" ? "The editor is already running. Open http://127.0.0.1:4174/editor/ or close the earlier editor terminal." : `The local editor could not start: ${error.message}`);
    process.exitCode = 1;
  });
  server.listen(4174, "127.0.0.1", () => {
    const url = "http://127.0.0.1:4174/editor/";
    console.log(`OIA local content editor: ${url}\nKeep this terminal open. Press Control-C to stop. Saves rebuild only this local website; nothing is published.`);
    if (process.platform === "darwin") execFile("/usr/bin/open", [url], () => {});
  });
}
