import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import path from "node:path";

const root = path.resolve("out");
const port = Number(process.env.PORT || 3020);
const mime = {
  ".html": "text/html; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".mp3": "audio/mpeg",
};

if (!existsSync(path.join(root, "index.html")))
  throw new Error("Run npm run build before starting the static preview.");
createServer((request, response) => {
  let filename;
  try {
    const pathname = decodeURIComponent(
      new URL(request.url, "http://localhost").pathname,
    );
    filename = path.resolve(root, "." + pathname);
    if (filename !== root && !filename.startsWith(root + path.sep))
      throw new Error("Invalid path");
    if (existsSync(filename) && statSync(filename).isDirectory())
      filename = path.join(filename, "index.html");
  } catch {
    response.writeHead(400);
    response.end("Bad request");
    return;
  }
  if (!existsSync(filename) || !statSync(filename).isFile()) {
    response.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    createReadStream(path.join(root, "404.html")).pipe(response);
    return;
  }
  const immutable = filename.includes(
    `${path.sep}_next${path.sep}static${path.sep}`,
  );
  response.writeHead(200, {
    "Content-Type": mime[path.extname(filename)] || "application/octet-stream",
    "Cache-Control": immutable
      ? "public, max-age=31536000, immutable"
      : "no-cache",
    ...(filename === path.join(root, "sw.js")
      ? { "Service-Worker-Allowed": "/" }
      : {}),
  });
  createReadStream(filename).pipe(response);
}).listen(port, "127.0.0.1", () =>
  console.log(`Kaku is ready at http://127.0.0.1:${port}`),
);
