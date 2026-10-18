// Offline build-time processing only. Requires FFmpeg with libmp3lame.
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";

function ffmpeg(input, args) {
  const result = spawnSync(
    process.env.FFMPEG_PATH || "ffmpeg",
    ["-hide_banner", "-loglevel", "error", "-i", "pipe:0", ...args, "pipe:1"],
    { input, maxBuffer: 8 * 1024 * 1024, windowsHide: true },
  );
  if (result.error)
    throw new Error(
      "Install FFmpeg or set FFMPEG_PATH before refreshing audio.",
      { cause: result.error },
    );
  if (result.status !== 0)
    throw new Error(`FFmpeg failed: ${result.stderr.toString()}`);
  return result.stdout;
}

export function processRecording(original, reading) {
  const pcm = ffmpeg(original, ["-ac", "1", "-ar", "24000", "-f", "f32le"]);
  const samples = Array.from({ length: pcm.length / 4 }, (_, i) =>
    pcm.readFloatLE(i * 4),
  );
  const rms = [];
  for (let i = 0; i < samples.length; i += 240) {
    const frame = samples.slice(i, i + 240);
    rms.push(
      Math.sqrt(
        frame.reduce((sum, sample) => sum + sample * sample, 0) / frame.length,
      ),
    );
  }
  const threshold = Math.max(0.001, Math.max(...rms) * 0.025);
  const groups = [];
  let first = null,
    last = 0;
  for (let i = 0; i < rms.length; i++) {
    if (rms[i] <= threshold) continue;
    if (first === null) first = i;
    else if (i - last > 18) {
      groups.push([first / 100, (last + 1) / 100]);
      first = i;
    }
    last = i;
  }
  if (first !== null) groups.push([first / 100, (last + 1) / 100]);
  const speech = groups.filter(([start, end]) => end - start >= 0.06);
  // Fail for changed source material instead of silently publishing repetitions.
  if (speech.length !== 3)
    throw new Error(
      `Expected three source pronunciations for ${reading}; found ${speech.length}. Review the source.`,
    );
  const start = Math.max(0, speech[0][0] - 0.08);
  const end = Math.max(start + 0.25, speech[0][1] + 0.1);
  if (end >= speech[1][0] - 0.1) throw new Error(`Unsafe trim for ${reading}`);
  const voice = samples.slice(
    Math.floor(speech[0][0] * 24000),
    Math.ceil(speech[0][1] * 24000),
  );
  const peak = Math.max(
    ...samples
      .slice(Math.floor(start * 24000), Math.ceil(end * 24000))
      .map(Math.abs),
  );
  const voiceRms = Math.sqrt(
    voice.reduce((sum, sample) => sum + sample * sample, 0) / voice.length,
  );
  const gain = Math.min(0.1 / voiceRms, 0.85 / peak);
  const duration = end - start;
  const filter = `atrim=start=${start}:end=${end},asetpts=PTS-STARTPTS,volume=${gain},afade=t=in:d=0.005,afade=t=out:st=${duration - 0.005}:d=0.005`;
  const bytes = ffmpeg(original, [
    "-af",
    filter,
    "-ac",
    "1",
    "-ar",
    "24000",
    "-codec:a",
    "libmp3lame",
    "-b:a",
    "96k",
    "-map_metadata",
    "-1",
    "-f",
    "mp3",
  ]);
  return {
    bytes,
    processing: {
      trimStartSeconds: start,
      trimEndSeconds: end,
      gain,
      originalSha256: createHash("sha256").update(original).digest("hex"),
      description:
        "First pronunciation only; 80 ms leading and 100 ms trailing padding where available; voice RMS target -20 dBFS with peak capped at -1.4 dBFS; 5 ms edge fades; mono 24 kHz MP3 at 96 kbps.",
    },
  };
}
