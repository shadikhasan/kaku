import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

// Run after static export to include unvisited routes and Next's RSC payloads.
async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((entry) =>
        entry.isDirectory()
          ? walk(path.join(directory, entry.name))
          : path.join(directory, entry.name),
      ),
    )
  ).flat();
}
const files = (await walk("out"))
  .map((file) => file.replaceAll("\\", "/"))
  .sort()
  .filter(
    (file) =>
      !file.startsWith("out/audio/") &&
      !file.endsWith("/sw.js") &&
      !file.endsWith(".map"),
  );
const template = await readFile("public/sw.js", "utf8");
const audioUrls = (await readdir("out/audio/kana"))
  .filter((file) => file.endsWith("-single.mp3"))
  .sort()
  .map((file) => `/audio/kana/${file}`);
const hash = createHash("sha256").update(template);
const urls = [];
for (const file of files) {
  hash.update(file).update(await readFile(file));
  let url = file.slice(3);
  if (url.endsWith("/index.html")) url = url.slice(0, -10);
  // Next emits bracketed route chunk directories; browser script URLs encode them.
  urls.push(encodeURI(url));
}
hash.update(JSON.stringify(urls)).update(JSON.stringify(audioUrls));
const build = hash.digest("hex").slice(0, 16);
await writeFile(
  "out/sw.js",
  template
    .replace("__BUILD__", build)
    .replace("/* __PRECACHE__ */", JSON.stringify(urls))
    .replace("/* __AUDIO_URLS__ */", JSON.stringify(audioUrls)),
);
console.log(`PWA ${build}: precaching ${urls.length} resources`);
