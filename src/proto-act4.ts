// Standalone page for the 3D act 4 prototype (D-011). Same lines, same timing rules as
// the 2D act (the Narrator queue), so the two can be compared side by side.
//
// Debug (for automated checks, like the guizang skill's step hooks):
//   ?auto        skip the Play screen (no sound)
//   ?t=40        fast-forward the story to 40 s
//   ?hold        do not advance time by itself; use window.__act4.step(seconds)
//   ?cam=mother  follow the mother with a close camera (&angle=90 to orbit, in degrees)
//   ?q=low|high  force a quality tier

import strings from "./content/strings.json";
import { Act4, RISE } from "./act4/act4";
import { Narrator } from "./core/narrator";
import { TextLayer } from "./core/text";

const params = new URLSearchParams(location.search);
const canvas = document.getElementById("view") as HTMLCanvasElement;
const act = new Act4(canvas);
act.closeUp = params.get("cam") === "mother";
act.closeUpAngle = (Number(params.get("angle") ?? 0) * Math.PI) / 180;
const text = new TextLayer();

let sound = false;
let fastForward = false;
const audios = new Map<string, HTMLAudioElement>();
let current: HTMLAudioElement | null = null;
const voice = new Narrator(
  {
    show: (line, seconds) => text.narration.show(line, true, seconds),
    play: (id) => {
      if (!sound || fastForward) return true;
      let a = audios.get(id);
      if (!a) {
        a = new Audio(`voice/${id}.mp3`);
        audios.set(id, a);
      }
      current?.pause();
      a.currentTime = 0;
      void a.play().catch(() => undefined);
      current = a;
      return true;
    },
    fallback: () => undefined,
    stop: () => current?.pause(),
  },
  (id) => strings.story[id],
);

let queued = false;
let ready = false;
function step(dt: number) {
  voice.update(dt);
  act.update(dt);
  if (!queued && act.t >= RISE + 1.5) {
    queued = true;
    voice.say("notTheField", { gap: 0, onStart: () => act.showField(true) });
    voice.say("byTheDoor", {
      gap: 1.4,
      onStart: () => {
        act.showField(false);
        act.showDoor(true);
      },
    });
    voice.say("everyMorning", { gap: 1.2, onStart: () => act.startMother() });
  }
  if (queued && !ready && voice.idleFor > 1 && act.motherDone) {
    ready = true;
    text.hint.show(strings.ui.continue);
  }
}

function advance(seconds: number) {
  fastForward = true;
  const dt = 1 / 30;
  for (let s = 0; s < seconds - 1e-6; s += dt) step(Math.min(dt, seconds - s));
  fastForward = false;
}

function resize() {
  act.resize(innerWidth, innerHeight);
}
addEventListener("resize", resize);
resize();

const hold = params.has("hold");
let running = false;
let last = performance.now();
function frame(now: number) {
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
  last = now;
  if (running && !hold) step(dt);
  act.render();
  requestAnimationFrame(frame);
}

function begin(withSound: boolean) {
  sound = withSound;
  document.getElementById("start")!.hidden = true;
  const t = Number(params.get("t") ?? 0);
  if (t > 0) advance(t);
  running = true;
  last = performance.now();
}
document.getElementById("btn-play")!.addEventListener("click", () => begin(true));
if (params.has("auto")) begin(false);
requestAnimationFrame(frame);

// Read-only state and a manual clock, for automated checks.
(window as unknown as { __act4: object }).__act4 = {
  step: (seconds: number) => {
    advance(seconds);
    act.render();
  },
  state: () => ({ t: +act.t.toFixed(2), mother: +act.mother.t.toFixed(2), motherDone: act.motherDone, ready, line: voice.current, quality: act.stage.quality.name }),
  info: () => act.stage.renderer.info.render,
  act,
};
