// CLI: npm run check. Fails the build when on-screen text breaks the fact rules (R7).
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parseFacts, checkStrings } from "./fact-check-lib.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const facts = parseFacts(readFileSync(join(root, "context/research-urn-burial.md"), "utf8"));
const strings = JSON.parse(readFileSync(join(root, "src/content/strings.json"), "utf8"));
const errors = checkStrings(strings, facts);
const lines = Object.keys(strings.real ?? {}).length;
const story = Object.keys(strings.story ?? {}).length;

if (errors.length) {
  console.error(`check-facts: ${errors.length} problem(s)`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`check-facts: ok (${lines} history lines checked, ${story} story lines, ${facts.size} facts)`);
