// Ask an audio-understanding model what it hears in each file of a folder:
// transcript, voice, delivery and problems. A machine opinion, not a listening test.
//
//   node scripts/voice-check.mjs <dir>
//
// The key is read from XIAOMI_API_KEY and is never printed.

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { clean, listen, sameWords } from "./mimo.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = process.argv[2];
if (!dir) {
  console.error("Usage: node scripts/voice-check.mjs <dir>");
  process.exit(1);
}
const story = JSON.parse(await readFile(path.join(ROOT, "src", "content", "strings.json"), "utf8")).story;

let bad = 0;
for (const f of (await readdir(dir)).filter((n) => /\.(wav|mp3)$/i.test(n)).sort()) {
  const buf = await readFile(path.join(dir, f));
  const id = f.replace(/\.(wav|mp3)$/i, "");
  try {
    const heard = await listen(buf, f.toLowerCase().endsWith(".mp3") ? "audio/mpeg" : "audio/wav");
    const match = story[id] ? sameWords(heard.transcript, story[id]) : null;
    const ok = match !== false && clean(heard.problems);
    if (!ok) bad++;
    console.log(`${ok ? "ok  " : "CHECK"} ${f.padEnd(20)} "${heard.transcript}" | ${heard.delivery ?? ""} | problems: ${heard.problems}`);
  } catch (e) {
    bad++;
    console.log(`FAIL  ${f.padEnd(20)} ${e.message}`);
  }
}
console.log(bad ? `${bad} file(s) to check by ear.` : "All files clean.");
