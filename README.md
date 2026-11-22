# Fish Wish

An interactive web story for **Kiroween 2026 · Costume Contest**, built with Kiro. Play it at <https://fish-wish.pages.dev>.

About 6,000 years ago at Banpo, near Xi'an, small children who died were buried in clay jars beside the houses, and some jars were closed with a basin painted with a human face. You dig one up in the dark with a single lamp, and your light slips in through the small hole in the lid. Then you are inside the jar, looking up, and the face speaks to you as if you were the child.

It starts as a face in the dark that knows you. It ends as something a mother made. The face never changes; what you understand does. The people and the words are imagined; the basin is real, and a closing page, *What is real*, separates the two.

The darkness is not decoration. The lamp decides what you can see, the face assembles only where your light has fallen, and a hole in the lid is the way in and the way out. Every historical statement is checked against a cited fact table at build time.

## Run

```bash
npm install
npm run dev        # local dev server
npm test           # unit + property-based tests (Vitest, fast-check)
npm run check      # fact check of all on-screen text
npm run build      # check + type-check + production build to dist/
```

No backend, no account, no tracking. Works with mouse, touch or keyboard (arrow keys move the light, hold Space to brush, Enter to go on, P pause, S skip, M mute). Honors `prefers-reduced-motion`.

## How it is built

- Vite + TypeScript, no UI framework. Canvas 2D for the scenes, an optional WebGL layer for dust and glow, DOM for all text.
- Every surface is procedural and seeded; the face and fish are drawn in code from written descriptions, not traced from photographs. No image is AI-generated. Act 4 (the house at dawn) is animated in code: firelight, smoke carried over the jar, grass in the wind, sunrise, and the mother, who feeds the fire and then goes out to kneel by the jar, where the little one lies curled as if still inside her, drawn only as light. At the very end, the small fish the face holds fill with light, and a fish of light leaves each one and swims slowly round the basin; the painted fish stay where they are.
- All sound is synthesized with Web Audio: the drones, the brush in the earth, small bells, and a faint breath under each of the face's lines. There are no recordings; the face speaks in text.
- Lines are queued by `src/core/narrator.ts`: one at a time, each lasting a reading time estimated from its length. Pause holds the queue; skip drops what is left of the act.
- `src/content/strings.json` holds all text: `story` (the face's lines, fiction) and `real` (history). Each `real` line cites fact IDs from `context/research-urn-burial.md`; `scripts/check-facts.mjs` fails the build on uncited, disputed-but-unlabelled or off-screen claims, and on forbidden wording anywhere.

## How Kiro was used

- **Steering**: `.kiro/steering/` (product, tech, structure, contest rules, collaboration rules) and `AGENTS.md`.
- **Spec-driven development**: `.kiro/specs/urn-experience/` — `requirements.md` (12 requirements, 57 acceptance criteria) → `design.md` → `tasks.md`.
- **Hooks**: `.kiro/hooks/fact-check-on-save.json` runs the fact check whenever story text or the fact table is saved.
- **Property-based tests** for the scene machine, dig coverage, lamp motion and the line queue (lines never overlap or reorder). A unit test keeps the hole in the lid in the same place seen from above and from inside.

## Sources and disclosure

Sources are listed in the app (*What is real*, at the end) and in `context/research-urn-burial.md`. The project was created during the Submission Period. No pre-existing code is included.

An earlier commit (`aa4e71e`) included voice lines generated with a third-party text-to-speech service (Xiaomi MiMo-V2.5-TTS). They were removed; the current app contains no recordings and no generated audio.

## License

MIT, see `LICENSE`.

---

## 工作区导航（中文）

| 文件 | 内容 |
| --- | --- |
| `AGENTS.md` | Kiro 必读入口：约束、协作约定、导航、关键日期 |
| `decisions/DECISIONS.md` | 决策记录（D-001 ~ D-015） |
| `context/research-urn-burial.md` | 史实核对表 F1–F14，上屏文字的依据 |
| `context/rules-verified.md` / `open-questions.md` | 官方规则（已核实 / 待核实）与待办 |
| `ideas/IDEAS.md` | 创意记录 |
| `_scratch/` | 本地临时文件（浏览器脚本、截图），已 gitignore，不进公开仓库 |

敏感信息（Kiro credits 兑换链接、账号凭据、身份材料）不得写入本目录任何文件。
