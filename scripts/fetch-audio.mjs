// Refresh the checked-in recordings; no third-party requests are made at runtime.
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { processRecording } from "./process-audio.mjs";

async function fetchWithRetry(url) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(30000),
      headers: {
        "User-Agent": "KakuKanaAudioImporter/1.0 (educational kana app)",
      },
    });
    if (response.status !== 429 && response.status < 500) return response;
    const wait =
      Number(response.headers.get("retry-after")) || 5 * (attempt + 1);
    await response.body?.cancel();
    console.log(`Download throttled; retrying in ${wait}s.`);
    await delay(wait * 1000);
  }
  throw new Error(`Repeated download failure: ${url}`);
}

const characters = JSON.parse(
  await readFile(new URL("../src/data/kana.json", import.meta.url), "utf8"),
);
const readings = [...new Set(characters.map((character) => character.reading))];
const names = {
  a: "Ja-A.oga",
  e: "Ja-E.oga",
  ka: "Ja-Ka.oga",
  i: "Japanese I.ogg",
  u: "Japanese U.ogg",
  o: "Japanese O.ogg",
  n: "Japanese N.ogg",
  chi: "Japanese ti.ogg",
  fu: "Japanese hu.ogg",
};
const titleFor = (reading) =>
  `File:${names[reading] ?? `Japanese ${reading}.ogg`}`;
const params = new URLSearchParams({
  action: "query",
  format: "json",
  redirects: "1",
  prop: "videoinfo",
  viprop: "url|derivatives|extmetadata",
  titles: readings.map(titleFor).join("|"),
});
const response = await fetchWithRetry(
  `https://commons.wikimedia.org/w/api.php?${params}`,
);
if (!response.ok) throw new Error(`Commons metadata: ${response.status}`);
const metadata = await response.json();
if (metadata.error) throw new Error(JSON.stringify(metadata.error));
const pages = Object.values(metadata.query.pages);
const directory = new URL("../public/audio/kana/", import.meta.url);
await mkdir(directory, { recursive: true });
const manifest = [];

for (const reading of readings) {
  const title = titleFor(reading);
  const resolved =
    metadata.query.redirects?.find((redirect) => redirect.from === title)?.to ??
    title;
  const info = pages.find((page) => page.title === resolved)?.videoinfo?.[0];
  if (
    !info ||
    info.extmetadata.LicenseShortName?.value !== "Public domain" ||
    info.extmetadata.Artist?.value !== "Hakatanoshio117117"
  ) {
    throw new Error(
      `Missing recording or unexpected author/license: ${reading}`,
    );
  }
  const mp3 = info.derivatives.find((file) => file.transcodekey === "mp3");
  if (!mp3) throw new Error(`No MP3 transcode: ${reading}`);
  const audio = await fetchWithRetry(mp3.src);
  if (!audio.ok || !audio.headers.get("content-type")?.includes("audio/"))
    throw new Error(`Audio ${reading}: ${audio.status}`);
  const original = Buffer.from(await audio.arrayBuffer());
  if (original.length < 1000)
    throw new Error(`Recording too small: ${reading}`);
  const { bytes, processing } = processRecording(original, reading);
  const file = `${reading}-single.mp3`;
  await writeFile(new URL(file, directory), bytes);
  manifest.push({
    reading,
    file,
    author: info.extmetadata.Artist.value,
    license: "Public domain (PD-self)",
    source: info.descriptionurl,
    download: mp3.src,
    processing,
    bytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  });
  console.log(`${reading}: ${bytes.length} bytes`);
  await delay(1200);
}
await writeFile(
  new URL("sources.json", directory),
  JSON.stringify(manifest, null, 2) + "\n",
);
console.log(`Saved ${manifest.length} recordings.`);
