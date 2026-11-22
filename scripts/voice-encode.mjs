// Mix and encode the face's voice lines (D-009) into public/voice/<id>.mp3,
// and write their durations to src/content/voice.json.
//
//   node scripts/voice-encode.mjs <voice>
//
// The "costume" (0..1, from voice-plan.mjs) sets how much of the strangeness is on:
//   - a shadow voice: the same take pitched about four semitones down, a few ms late;
//   - the hollow ring of a clay jar: very short comb echoes;
//   - a little earth: a low-pass on the deepest lines.
// At 0 only the clean voice and a faint room tail are left.
// Needs ffmpeg: set FFMPEG to its path, or have it on PATH.

import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { costumeOf } from "./voice-plan.mjs";

const run = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FFMPEG = process.env.FFMPEG ?? "ffmpeg";
const RATE = 24000;
const SHADOW = 0.78; // pitch ratio of the shadow voice (about -4.3 semitones)

const voice = process.argv[2];
if (!voice) {
  console.error("Usage: node scripts/voice-encode.mjs <voice>");
  process.exit(1);
}
const srcDir = path.join(ROOT, "_scratch", "voice", voice);
const outDir = path.join(ROOT, "public", "voice");
await mkdir(outDir, { recursive: true });
const story = JSON.parse(await readFile(path.join(ROOT, "src", "content", "strings.json"), "utf8")).story;

const f = (n) => n.toFixed(3);

function graph(c) {
  const trim =
    "silenceremove=start_periods=1:start_threshold=-48dB:start_silence=0.06," +
    "areverse,silenceremove=start_periods=1:start_threshold=-48dB:start_silence=0.2,areverse," +
    // loudnorm works at 192 kHz internally and outputs that rate; bring it back first.
    `loudnorm=I=-19:TP=-2:LRA=11,aresample=${RATE}`;
  const tail = `aecho=0.85:0.55:90|170:${f(0.05 + 0.1 * c)}|${f(0.03 + 0.06 * c)}`;
  const finish = `apad=pad_dur=0.35,alimiter=limit=0.89:level=false,aresample=${RATE}`;
  if (c <= 0.001) return `[0:a]${trim},${tail},${finish}[out]`;
  const jar = `aecho=0.9:0.8:9|14|23:${f(0.32 * c)}|${f(0.26 * c)}|${f(0.18 * c)}`;
  const earth = c > 0.9 ? ",lowpass=f=4300" : "";
  return (
    `[0:a]${trim},asplit=2[dry][sh];` +
    `[sh]asetrate=${Math.round(RATE * SHADOW)},aresample=${RATE},atempo=${f(1 / SHADOW)},adelay=32,lowpass=f=2600,volume=${f(0.62 * c)}[shadow];` +
    `[dry][shadow]amix=inputs=2:normalize=0:duration=longest[mix];` +
    `[mix]${jar},${tail}${earth},${finish}[out]`
  );
}

async function seconds(file) {
  const { stderr } = await run(FFMPEG, ["-hide_banner", "-i", file, "-f", "null", "-"], { maxBuffer: 1 << 24 }).catch((e) => e);
  const all = [...String(stderr).matchAll(/time=(\d+):(\d+):([\d.]+)/g)];
  const m = all.at(-1);
  return m ? +m[1] * 3600 + +m[2] * 60 + +m[3] : NaN;
}

const durations = {};
for (const id of Object.keys(story)) {
  const src = path.join(srcDir, `${id}.wav`);
  if (!existsSync(src)) {
    console.log(`skip ${id}: no take`);
    continue;
  }
  const out = path.join(outDir, `${id}.mp3`);
  const c = costumeOf(id);
  await run(FFMPEG, ["-hide_banner", "-loglevel", "error", "-y", "-i", src, "-filter_complex", graph(c), "-map", "[out]", "-ac", "1", "-ar", String(RATE), "-c:a", "libmp3lame", "-b:a", "64k", out]);
  durations[id] = +(await seconds(out)).toFixed(2);
  console.log(`${id.padEnd(14)} costume ${c.toFixed(2)}  ${durations[id].toFixed(2)} s`);
}
await writeFile(path.join(ROOT, "src", "content", "voice.json"), JSON.stringify({ voice, seconds: durations }, null, 2) + "\n");
console.log(`Wrote ${Object.keys(durations).length} lines to public/voice and src/content/voice.json`);
