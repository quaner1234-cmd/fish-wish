// Generate the face's voice lines with Xiaomi MiMo-V2.5-TTS (D-009).
// The key is read from the XIAOMI_API_KEY environment variable and is never printed.
//
//   node scripts/voice-gen.mjs <voice> [id...]
//
// For each line it makes up to TAKES takes and keeps the first one that an
// audio-understanding model transcribes word for word with no problems noted.
// Raw WAV takes go to _scratch/voice/<voice>/ (not in the repo); the files that
// ship with the app are made from them by scripts/voice-encode.mjs.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { clean, listen, sameWords, synth, wavSeconds } from "./mimo.mjs";
import { direction, spokenText } from "./voice-plan.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TAKES = 4;

const strings = JSON.parse(await readFile(path.join(ROOT, "src", "content", "strings.json"), "utf8"));
const [voice, ...ids] = process.argv.slice(2);
if (!voice) {
  console.error("Usage: node scripts/voice-gen.mjs <voice> [id...]");
  process.exit(1);
}
const outDir = path.join(ROOT, "_scratch", "voice", voice);
await mkdir(outDir, { recursive: true });
const report = [];

for (const id of ids.length ? ids : Object.keys(strings.story)) {
  const line = strings.story[id];
  if (!line) throw new Error(`Unknown line: ${id}`);
  let best = null;
  for (let take = 1; take <= TAKES; take++) {
    try {
      const wav = await synth({ voice, direction: direction(id), text: spokenText(line) });
      const heard = await listen(wav);
      const match = sameWords(heard.transcript, line);
      const ok = match && clean(heard.problems);
      const score = (match ? 2 : 0) + (clean(heard.problems) ? 1 : 0);
      if (!best || score > best.score) best = { wav, heard, score, take, ok };
      console.log(`${ok ? "ok  " : "    "} ${id.padEnd(14)} take ${take}  ${wavSeconds(wav).toFixed(2)} s  heard: "${heard.transcript}"  problems: ${heard.problems}`);
      if (ok) break;
    } catch (e) {
      console.log(`FAIL ${id.padEnd(14)} take ${take}  ${e.message}`);
    }
  }
  if (!best) continue;
  await writeFile(path.join(outDir, `${id}.wav`), best.wav);
  report.push({ id, take: best.take, accepted: best.ok, seconds: +wavSeconds(best.wav).toFixed(2), heard: best.heard });
}

// Merge with earlier runs, so regenerating one line keeps the others' records.
const reportFile = path.join(outDir, "report.json");
let merged = [];
try {
  merged = JSON.parse(await readFile(reportFile, "utf8"));
} catch {
  merged = [];
}
for (const r of report) merged = [...merged.filter((m) => m.id !== r.id), r];
const order = Object.keys(strings.story);
merged.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
await writeFile(reportFile, JSON.stringify(merged, null, 2));
const bad = merged.filter((r) => !r.accepted).map((r) => r.id);
console.log(bad.length ? `Not clean after ${TAKES} takes: ${bad.join(", ")}` : "All lines accepted.");
