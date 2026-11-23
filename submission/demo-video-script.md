# Fish Wish — demo video script (< 3 minutes)

> Approved by Alex 2026-11-24 ("视频OK"); YouTube upload authorized. Real screen capture of the running app; no unauthorized music. On-screen English subtitles carry the explanation (no voice-over), so the piece stays exactly as shipped (dialogue unchanged). Runtime 2:32.

## Format & rules
- Length: under 3:00 (target ~2:20).
- Source: real running app at https://fish-wish.pages.dev, recorded live (no mockups).
- Audio: only the app's own synthesized sound (allowed). No external/copyrighted music. If audio capture is unreliable, ship silent with burned-in subtitles — still compliant.
- Narration: none (avoids re-adding voice per D-012). Explanatory captions are separate from the in-app lines.

## Storyboard / shot list
| # | Time | Shot (what the viewer sees) | Caption / subtitle (video overlay) |
| --- | --- | --- | --- |
| 1 | 0:00–0:07 | Black title card, slow fade-in text | **Fish Wish** — a haunting interactive story built with Kiro |
| 2 | 0:07–0:32 | Act 1, live: lamp rubs away soil in the dark; the rim of a painted basin appears; lamp is snuffed through the small hole | *Dig away the dark, and a jar appears — capped by a painted basin older than writing.* |
| 3 | 0:32–1:02 | Act 2, live: inside, looking up; the light reveals the human-face-and-fish pattern; the face speaks (app subtitles visible) | *Inside, a painted face looks back — and speaks to the child in the jar.* (in-app line: "Don't be afraid of me. I was painted for you.") |
| 4 | 1:02–1:30 | Act 4, live: ascent to the surface; the mother builds the fire and kneels by the jar; a child of light curls inside | *Morning light. A mother kneels by the jar where a child of light is curled.* |
| 5 | 1:30–1:58 | Act 5, live: the face one last time; the fish it holds turn into fish of light and swim free | *On the last line, the fish the face holds swim free as living light.* |
| 6 | 1:58–2:10 | Ending card | *The people are imagined. The basin is real.* |
| 7 | 2:10–2:20 | Outro card | Built with Kiro · Costume Contest · Kiroween 2026 · live at fish-wish.pages.dev |

## On-screen subtitle script (exact overlay text)
1. Fish Wish — a haunting interactive story built with Kiro
2. Dig away the dark, and a jar appears — capped by a painted basin older than writing.
3. Inside, a painted face looks back — and speaks to the child in the jar.
4. Morning light. A mother kneels by the jar where a child of light is curled.
5. On the last line, the fish the face holds swim free as living light.
6. The people are imagined. The basin is real.
7. Built with Kiro · Costume Contest · Kiroween 2026 · live at fish-wish.pages.dev

## Historical note for the copy
Captions make no factual claims beyond the piece itself; any factual line stays inside the sourced facts. Nothing here contradicts the shipped dialogue. If a factual caption is added, it must use a fact marked on-screen-allowed (F1, F2, F5, F7, F8, F9, F10, F14) and mark contested points as "one reading."

## Technical plan (for the recording step)
- Capture: Playwright (Chromium) `record_video` at 1280×720, drive the real site; hold each beat long enough to read. Save raw to `_scratch/video/raw/`.
- Edit: FFmpeg (portable `D:/Projects/_shared/tools/ffmpeg/bin/ffmpeg.exe`) to trim, add the two title/outro cards and burned-in captions, encode H.264 MP4 to `_scratch/video/fish-wish-demo.mp4`.
- Heavy render under the shared lock: route through `render-guard` (`D:/Projects/_shared/tools/render-guard/render-entry.mjs`) and claim the project with `project-claim.mjs` if a video project is used.
- Verify: `ffprobe` shows H.264, ≤3:00, audio present (app synth) or silent; spot-check frames at each beat.
- Upload: YouTube upload **authorized by Alex 2026-11-24** (D-018); perform the public upload and record the link.

## Status (2026-11-24) — video approved, upload authorized
- Draft render: `_scratch/video/fish-wish-demo.mp4` — 152.57 s (2:32), 1280×720, H.264, 30 fps, ~11 MB. Real screen capture of the live app (Playwright Chromium driving `https://fish-wish.pages.dev/?perf`), no page errors.
- Structure follows the beats above: opens on the app's own title screen, then Acts 1 → 2 → 3 → 4 → 5, the real ending card, then a 4.5 s outro card with the links.
- Audio: **no audio track** (Playwright video does not capture page audio). This matches the "silent + burned-in subtitles" compliant option; the app's own synthesized sound can be captured separately if preferred.
- Scripts: `_scratch/video/record_final.py` (capture) and caption text in `_scratch/video/caps/*.txt` (FFmpeg `drawtext` burn-in).
- Approved: Alex 2026-11-24 confirmed the video is OK and authorized the YouTube upload (D-018).
- Pending: actual YouTube upload and back-filling the public link; Devpost form submission still needs D-05 (individual/team), D-06 (bonus), Q-01 and Q-05 from Alex.
