import { describe, expect, it } from "vitest";
import { checkStrings, parseFacts } from "../scripts/fact-check-lib.mjs";
import strings from "../src/content/strings.json";
import research from "../context/research-urn-burial.md?raw";

const table = `| # | 说法 | 结论 | 来源 | 上屏方式 |
| --- | --- | --- | --- | --- |
| F1 | a | 已核实 | x | 陈述 |
| F9 | b | 两说并存，无定论 | x | 两种都写 |
| F11 | c | **Kiro 推断** | x | 只写 |
| F12 | d | 未核实 | x | 不上屏 |`;
const facts = parseFacts(table);
const one = (text: string, ids: string[]) => checkStrings({ real: { a: { text, facts: ids } } }, facts);

describe("fact check (R7)", () => {
  it("parses verdicts and display rules", () => {
    expect(facts.get("F9")?.disputed).toBe(true);
    expect(facts.get("F11")?.inferred).toBe(true);
    expect(facts.get("F12")?.offScreen).toBe(true);
    expect(facts.get("F1")).toMatchObject({ disputed: false, inferred: false, offScreen: false });
  });

  it("accepts a cited, plain fact", () => {
    expect(one("Banpo.", ["F1"])).toEqual([]);
  });

  it("rejects missing, unknown, off-screen and inferred citations", () => {
    expect(one("x", [])).toHaveLength(1);
    expect(one("x", ["F99"])[0]).toMatch(/unknown/);
    expect(one("x", ["F12"])[0]).toMatch(/must not appear/);
    expect(one("x", ["F11"])[0]).toMatch(/inference/);
  });

  it("requires disputed facts to be framed as readings", () => {
    expect(one("The hole was for the soul.", ["F9"])[0]).toMatch(/disputed/);
    expect(one("One reading: the hole was for the soul.", ["F9"])).toEqual([]);
    expect(one("Another reading: breath.", ["F9"])).toEqual([]);
  });

  it("lets story lines go uncited, but still checks their wording", () => {
    expect(checkStrings({ story: { a: "Your mother made me." } }, facts)).toEqual([]);
    expect(checkStrings({ story: { a: "Every basin had a hole." } }, facts).join()).toMatch(/forbidden/);
  });

  it("rejects forbidden wording", () => {
    expect(one("Every basin had a hole.", ["F1"]).join()).toMatch(/forbidden/);
    expect(one("Fuwa", ["F1"]).join()).toMatch(/forbidden/);
  });

  it("passes on the real story text and research table", () => {
    const real = parseFacts(research);
    expect(checkStrings(strings, real)).toEqual([]);
  });
});
