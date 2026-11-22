// Fact check for on-screen text (R7). Pure functions; the CLI is check-facts.mjs.
// Story lines (strings.story) are fiction and need no citations; every line in
// strings.real states history and must cite facts. Forbidden wording is checked everywhere.

const DISPUTED = /无定论|两说/;
const INFERRED = /推断/;
const NOT_ON_SCREEN = /不上屏/;
const READING = /\b(one|another) reading\b|\bno one knows\b/i;
const FORBIDDEN = [/\bfuwa\b/i, /\bbeibei\b/i, /\bevery basin\b/i, /\ball basins\b/i, /\boxygen\b/i, /\bolympic/i];

/**
 * Parse the fact table in context/research-urn-burial.md.
 * Rows look like: | F5 | claim | verdict | source | how it may appear |
 */
export function parseFacts(markdown) {
  const facts = new Map();
  for (const line of markdown.split(/\r?\n/)) {
    const m = /^\|\s*(F\d+)\s*\|/.exec(line);
    if (!m) continue;
    const cells = line.split("|").map((c) => c.trim());
    const [, id, claim = "", verdict = "", source = "", display = ""] = cells;
    facts.set(id, {
      id,
      claim,
      disputed: DISPUTED.test(verdict),
      inferred: INFERRED.test(verdict),
      offScreen: NOT_ON_SCREEN.test(display),
      source,
    });
  }
  return facts;
}

/** Returns a list of human-readable errors; empty means the text passes. */
export function checkStrings(strings, facts) {
  const errors = [];
  const real = strings?.real ?? {};
  for (const [key, entry] of Object.entries(real)) {
    const where = `real.${key}`;
    if (!entry || typeof entry.text !== "string" || !entry.text.trim()) {
      errors.push(`${where}: missing text`);
      continue;
    }
    if (!Array.isArray(entry.facts) || entry.facts.length === 0) {
      errors.push(`${where}: no facts cited (R7.1)`);
      continue;
    }
    for (const id of entry.facts) {
      const f = facts.get(id);
      if (!f) errors.push(`${where}: cites unknown fact ${id}`);
      else if (f.offScreen) errors.push(`${where}: cites ${id}, which must not appear on screen (R7.2)`);
      else if (f.inferred) errors.push(`${where}: cites ${id}, which is only an inference`);
      else if (f.disputed && !READING.test(entry.text)) errors.push(`${where}: ${id} is disputed; say "One reading" or "No one knows" (R4.3)`);
    }
  }
  const all = JSON.stringify(strings);
  for (const re of FORBIDDEN) if (re.test(all)) errors.push(`forbidden wording ${re} found (R7.2, R7.4)`);
  return errors;
}
