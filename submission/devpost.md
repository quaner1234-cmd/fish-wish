# Fish Wish — Devpost submission (English)

> Final title confirmed by Alex 2026-11-24; Alex authorized submitting the Devpost form.
> Category: **Costume Contest**
> Bonus category: **[left blank — Alex to decide]** (see `context/open-questions.md` Q-06/D-06)
> Title: **Fish Wish** (final)

## Tagline
A 6,000-year-old painted face looks up from the bottom of a burial jar and speaks to the child inside.

---

## Inspiration
In 1955, workers near Banpo village in Shaanxi unearthed a painted pottery basin from the Yangshao (Neolithic) culture, roughly 6,000 years old, now in the National Museum of China. On its inner wall is a human face with a pointed headdress, fish-like fins at the ears, and fish at the corners of the mouth — one of the most recognizable images of early Chinese art. Archaeologists also found that infants at Banpo were buried in lidded pottery jars placed near the houses. Some of those lids have a small hole; one reading is that it let the soul come and go, another that it let the child breathe again.

We wanted to tell a story from the inside of one of those jars: not a monster in the dark, but a child, and a face painted to keep the child company. The horror is the form; the point is love.

## What it does
**Fish Wish** is a five-act interactive story, about five minutes long, played in the browser. You rub away the soil in the dark until a jar appears, upside down, capped with a painted basin. The lamp is snuffed out through a small hole in the lid. Inside, looking up, the light slowly reveals the face painted on the basin — and the face speaks to you, the child in the jar. Morning light comes through the same hole; two parents each make a wish at it. You rise to the surface: the jar is buried by the doorstep, a child made of light curls inside it, and a mother builds a fire and then kneels beside the jar. Finally the face appears one last time, and on its last line the little fish it holds turn into fish of light and swim free. The story ends on a card: *The people are imagined. The basin is real.*

## How we built it
- **Stack:** Vite + TypeScript, rendering with Canvas 2D; a small, degradable WebGL layer for effects (off when WebGL is unavailable or reduced motion is requested). Text is DOM; sound is fully synthesized in the browser with the Web Audio API — there are no audio files.
- **Art:** every visual is drawn procedurally (the pottery patterns, the face, the fire, the child of light). No museum or web photographs are used, and no image is AI-generated.
- **Interaction:** a lamp-and-reveal mechanic — you brush soil with the pointer or Space + arrow keys, and the same lamp both lights the jar and "paints" the patterns into view.
- **Accessibility:** full keyboard play (start, move the lamp, brush, pause, mute, skip, advance, reach the sources page), WCAG-AA-minded contrast, and a `prefers-reduced-motion` path that shortens and softens the motion and turns off the effect layer.
- **Hosting:** static build on Cloudflare Pages.

## How Kiro was used
Kiro ran the build as a spec-driven project, not a one-shot prompt:
- **Specs:** `.kiro/specs/urn-experience/` holds `requirements.md` (12 requirements, 57 acceptance criteria), `design.md`, and a living `tasks.md` that tracked the five acts.
- **Steering:** `.kiro/steering/` (product, tech, structure, contest-rules, collaboration) was auto-loaded to keep Kiro aligned on scope, stack, tone, and the competition rules.
- **Agent hook:** `.kiro/hooks/fact-check-on-save.json` runs the fact check as the work is edited.
- **Property-based tests:** the state machine, brushing coverage, lamp behaviour, and the narration queue are covered by property tests (Vitest + fast-check), not just example tests.
- **Build-time historical check:** `scripts/check-facts.mjs` and `scripts/fact-check-lib.mjs` verify that every on-screen historical statement maps to a sourced fact, and fail the build on unsupported or forbidden claims.
- **Decision records:** `decisions/DECISIONS.md` (D-001–D-015) records the choices and their reasons (e.g. dropping recorded voice-over, keeping the story out of 3D).

## Challenges
- **Tone:** keeping a burial jar genuinely unsettling while landing on love — the horror had to be the delivery, never the point.
- **One mechanic, many jobs:** the same small light had to read as curiosity (digging), intimacy (the face), grief (the parents), and release (the light fish).
- **Accessibility without losing atmosphere:** making the piece fully playable by keyboard and calm under reduced motion, while keeping the dark, quiet mood.
- **Historical honesty:** the archaeology is genuinely uncertain (no one knows for sure what the face means), so the writing had to stay inside what the sources support and mark contested points as "one reading."

## Accomplishments
- A complete five-act story in a tiny static bundle (about 25 KB of gzipped JavaScript), with no audio files and no generated images.
- A single, coherent light-and-reveal interaction that carries the whole piece.
- Keyboard-only and reduced-motion paths that reach the ending, verified in Chromium and Firefox; real-device play confirmed by the team.
- A fact-checking pipeline that ties every historical sentence to a source and blocks the build otherwise.

## What we learned
- Spec-driven development plus property tests made an unusual, mood-first idea tractable: the requirements carried the intent, and the tests protected the tricky mechanics.
- Treating factual accuracy as a build gate (not a proofreading pass) changed how we wrote the history.
- Restraint is a design tool: with no recorded audio and no photographic art, the atmosphere had to come from timing, light, and synthesized sound.

## What's next
- Consider additional languages and a behind-the-scenes page on how the basin was re-drawn.
- Keep the live piece online, free, and playable for judges through the judging period.

## Existing work disclosure (Q-09)
This project was built from scratch during the Kiroween Submission Period (after 2026-10-30 09:00 PT) using Kiro. No code from any prior project was reused. The only third-party code is open-source libraries listed in `package.json` (for example Vite, TypeScript, Vitest, fast-check), used under their own licenses. All artwork is drawn procedurally; no image is AI-generated and no museum or web photograph is reproduced. The app contains no recorded audio — every sound is synthesized in the browser.

## Historical sources and wording
Historical claims follow the project's sourced fact list (`context/research-urn-burial.md`, facts F1–F14). Where the archaeology is uncertain, the text says so:
- The basin: painted pottery, Banpo (Yangshao), about 6,000 years old; human-face-and-fish design on the inner wall. (F1, F2, F7)
- Infant jar burials placed near houses at Banpo. (F5)
- The small hole in some lids: **one reading** is for the soul, **another reading** is to let the child breathe again — the piece presents both and does not choose. (F8, F9)
- The meaning of the face: **no one knows for sure.** (F10)

## Links
- Live app: https://fish-wish.pages.dev
- Source (public, MIT): https://github.com/quaner1234-cmd/fish-wish
- Demo video: [to be filled after YouTube upload]
