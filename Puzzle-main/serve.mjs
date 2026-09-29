// Minimal static file server for Puzzle Cam.
//
// The app cannot run from file:// — app.js is an ES module and getUserMedia
// needs a secure context. This serves the folder on localhost and opens it.
//
// Usage: node serve.mjs [port]

import { createServer } from "http";
import { readFile, stat } from "fs/promises";
import { extname, join, normalize, resolve, sep } from "path";
import { spawn } from "child_process";

const ROOT = resolve(process.argv[2] ?? ".");
const PORT = Number(process.argv[3] ?? process.env.PORT ?? 8000);
const HOST = "127.0.0.1";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".wasm": "application/wasm",
  ".task": "application/octet-stream",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".map": "application/json; charset=utf-8",
};

const server = createServer(async (req, res) => {
  try {
    const requested = decodeURIComponent(new URL(req.url, `http://${HOST}`).pathname);
    let filePath = join(ROOT, normalize(requested));

    // Keep requests inside ROOT.
    if (filePath !== ROOT && !filePath.startsWith(ROOT + sep)) {
      res.writeHead(403).end("Forbidden");
      return;
    }

    let info = await stat(filePath).catch(() => null);
    if (info?.isDirectory()) {
      filePath = join(filePath, "index.html");
      info = await stat(filePath).catch(() => null);
    }
    if (!info?.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain" }).end("Not found");
      return;
    }

    const body = await readFile(filePath);
    res.writeHead(200, {
      "Content-Type": MIME[extname(filePath).toLowerCase()] ?? "application/octet-stream",
      "Content-Length": body.length,
      // No caching so edits show up on reload.
      "Cache-Control": "no-store",
    });
    res.end(body);
  } catch (err) {
    res.writeHead(500, { "Content-Type": "text/plain" }).end("Server error");
    console.error("[serve]", err.message);
  }
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Try: node serve.mjs . ${PORT + 1}`);
  } else {
    console.error("[serve]", err.message);
  }
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  const url = `http://${HOST}:${PORT}/`;
  console.log(`Puzzle Cam running at ${url}`);
  console.log("Press Ctrl+C to stop.");

  const opener =
    process.platform === "win32" ? "cmd" : process.platform === "darwin" ? "open" : "xdg-open";
  const args = process.platform === "win32" ? ["/c", "start", "", url] : [url];
  spawn(opener, args, { stdio: "ignore", detached: true }).unref();
});
