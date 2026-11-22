// Entry point: canvases, the lamp compositor, scene switching and the DOM controls.

import strings from "./content/strings.json";
import { AudioEngine } from "./core/audio";
import { FxLayer } from "./core/fx-webgl";
import { Input } from "./core/input";
import { Lamp } from "./core/lamp";
import { initialState, reduce, sceneOf, type Command, type MachineState, type SceneId } from "./core/machine";
import { motionFactor, reducedMotion } from "./core/motion";
import { TextLayer } from "./core/text";
import { renderDigObjects, renderSoil, renderUrnView } from "./art/pottery";
import { AgainScene } from "./scenes/again";
import { AscentScene } from "./scenes/ascent";
import { DigScene } from "./scenes/dig";
import { HoleScene } from "./scenes/hole";
import { InsideScene } from "./scenes/inside";
import { StartScene } from "./scenes/start";
import type { Art, Env, Lighting, Scene } from "./scenes/types";
import { UrnView } from "./scenes/urnview";

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const s = strings;

// ---------- DOM text (all from strings.json, R10) ----------
document.title = s.ui.title;
$("start-title").textContent = s.ui.title;
$("start-sub").textContent = s.ui.subtitle;
$("start-note").textContent = `${s.real.inspired.text} ${s.ui.contentNote}`;
$("start-sound").textContent = s.ui.soundNote;
$("start-controls").textContent = s.ui.controlsNote;
$("btn-start").textContent = s.ui.begin;
$("btn-pause").textContent = s.ui.pause;
$("btn-skip").textContent = s.ui.skip;
$("paused-text").textContent = s.ui.paused;
$("btn-resume").textContent = s.ui.resume;
$("btn-again").textContent = s.ui.again;
$("btn-sources").textContent = s.ui.sources;
$("btn-sources-close").textContent = s.ui.close;
$("sources-title").textContent = s.sources.title;
{
  // "What is real": every line here is fact-checked (R7); the story is labelled as imagined.
  const body = $("sources-body");
  const para = (text: string, cls?: string) => {
    const el = document.createElement("p");
    el.textContent = text;
    if (cls) el.className = cls;
    body.append(el);
  };
  para(s.ui.imagined, "imagined");
  const { inspired: _inspired, ...history } = s.real;
  for (const entry of Object.values(history)) para(entry.text);
  for (const p of s.sources.method) para(p, "method");
  const h3 = document.createElement("h3");
  h3.textContent = s.sources.sourcesTitle;
  body.append(h3);
  const ul = document.createElement("ul");
  for (const item of s.sources.items) {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = item.href;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = item.label;
    li.append(a);
    ul.append(li);
  }
  body.append(ul);
  const credit = document.createElement("p");
  credit.className = "credit";
  credit.textContent = s.sources.credit;
  body.append(credit);
}
// ---------- Canvases ----------
const stageEl = $("stage");
const view = $<HTMLCanvasElement>("world");
const vg = view.getContext("2d")!;
const layer = document.createElement("canvas");
const lg = layer.getContext("2d")!;
const scratch = document.createElement("canvas");
const sg = scratch.getContext("2d")!;
const vignette = document.createElement("canvas");
const fxCanvas = $<HTMLCanvasElement>("fx");
const fx = reducedMotion() ? null : FxLayer.create(fxCanvas);
if (!fx) fxCanvas.style.display = "none";

let W = window.innerWidth;
let H = window.innerHeight;
let DPR = 1;

function resize() {
  const prevMin = Math.min(W, H);
  W = window.innerWidth;
  H = window.innerHeight;
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  const maxPixels = 4_200_000; // keep full-screen compositing cheap (R11.3)
  if (W * H * DPR * DPR > maxPixels) DPR = Math.sqrt(maxPixels / (W * H));
  for (const c of [view, layer, scratch, vignette]) {
    c.width = Math.round(W * DPR);
    c.height = Math.round(H * DPR);
  }
  for (const g of [vg, lg, sg]) g.setTransform(DPR, 0, 0, DPR, 0, 0);
  const vgn = vignette.getContext("2d")!;
  vgn.setTransform(DPR, 0, 0, DPR, 0, 0);
  const grad = vgn.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.hypot(W, H) * 0.6);
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(1, "rgba(0,0,0,0.6)");
  vgn.fillStyle = grad;
  vgn.fillRect(0, 0, W, H);
  fx?.resize(W, H, DPR);
  if (env) {
    env.w = W;
    env.h = H;
    lamp.radius *= Math.min(W, H) / prevMin;
  }
}

// ---------- Art (procedural, seeded; built once) ----------
const art: Art = { soil: renderSoil(), digObjects: null!, urnView: null! };
function ensureArt() {
  if (!art.digObjects) art.digObjects = renderDigObjects();
  if (!art.urnView) art.urnView = renderUrnView();
}
// Build the rest while the start screen is being read.
window.setTimeout(() => {
  art.digObjects = art.digObjects ?? renderDigObjects();
  window.setTimeout(() => (art.urnView = art.urnView ?? renderUrnView()), 60);
}, 120);
// ---------- Story state ----------
const lamp = new Lamp();
const input = new Input(stageEl, W, H);
lamp.place(W / 2, H / 2);
const text = new TextLayer();
const audio = new AudioEngine();
const env: Env = { w: W, h: H, input, lamp, text, audio, s, art, motion: motionFactor(), reduced: reducedMotion() };
resize();
window.addEventListener("resize", resize);

const urn = new UrnView();
const scenes: Record<SceneId, Scene> = {
  start: new StartScene(),
  dig: new DigScene(),
  inside: new InsideScene(urn),
  hole: new HoleScene(urn),
  ascent: new AscentScene(),
  again: new AgainScene(urn),
};

let machine: MachineState = initialState();
let scene: Scene = scenes.start;
scene.enter(env);

/** Fade between scenes: "out" to a colour, switch, then "in". */
const fade = { phase: "none" as "none" | "out" | "in", a: 0, color: "black" as "black" | "pale", cmd: "next" as Command, queuedSkip: false };
const FADE_OUT = 0.9;
const FADE_IN = 1.2;

function advance(cmd: Command) {
  if (machine.paused || machine.finished) return;
  if (fade.phase === "out") {
    // Already leaving; a skip pressed now applies to the scene that comes next.
    if (cmd === "skip") fade.queuedSkip = true;
    return;
  }
  if (fade.phase === "in") {
    // A skip during a fade-in should not be lost: finish the fade and go on.
    if (cmd !== "skip") return;
    fade.phase = "none";
    fade.a = 0;
  }
  if (machine.index === 0 && cmd === "skip") return; // the story starts with Begin
  if (scene.exitFade === "none") return switchScene(cmd);
  fade.phase = "out";
  fade.a = 0;
  fade.color = scene.exitFade;
  fade.cmd = cmd;
}

function switchScene(cmd: Command) {
  scene.exit(env);
  machine = reduce(machine, cmd);
  if (machine.finished) {
    showEnd();
    return;
  }
  scene = scenes[sceneOf(machine)];
  scene.enter(env);
}

function restart() {
  hide("end");
  text.clear();
  machine = reduce(machine, "restart");
  scene.exit(env);
  scene = scenes[sceneOf(machine)];
  fade.phase = "in";
  fade.a = 1;
  fade.color = "black";
  scene.enter(env);
  stageEl.focus();
}
// ---------- Lamp compositor (R1.2, R1.4) ----------
function compose(lit: Lighting, time: number) {
  vg.globalCompositeOperation = "source-over";
  vg.globalAlpha = 1;
  vg.fillStyle = "#030201";
  vg.fillRect(0, 0, W, H);
  lit.under?.(vg);

  // The scene, kept only where light reaches: soft-edged lamp over an ambient floor.
  sg.globalCompositeOperation = "source-over";
  sg.clearRect(0, 0, W, H);
  sg.drawImage(layer, 0, 0, W, H);
  sg.globalCompositeOperation = "destination-in";
  const r = Math.max(1, lamp.r);
  const a0 = Math.min(1, lit.ambient);
  const la = lit.lamp;
  const grad = sg.createRadialGradient(lamp.x, lamp.y, 0, lamp.x, lamp.y, r);
  grad.addColorStop(0, `rgba(0,0,0,${Math.max(a0, la)})`);
  grad.addColorStop(0.45, `rgba(0,0,0,${Math.max(a0, la * 0.8)})`);
  grad.addColorStop(0.8, `rgba(0,0,0,${Math.max(a0, la * 0.28)})`);
  grad.addColorStop(1, `rgba(0,0,0,${a0})`);
  sg.fillStyle = grad;
  sg.fillRect(0, 0, W, H);
  sg.globalCompositeOperation = "source-over";
  vg.drawImage(scratch, 0, 0, W, H);

  // Warm the light a little.
  if (la > 0 && lit.warm > 0) {
    const warm = vg.createRadialGradient(lamp.x, lamp.y, 0, lamp.x, lamp.y, r * 1.1);
    warm.addColorStop(0, `rgba(255, 160, 80, ${0.22 * lit.warm * la})`);
    warm.addColorStop(1, "rgba(255, 160, 80, 0)");
    vg.globalCompositeOperation = "soft-light";
    vg.fillStyle = warm;
    vg.fillRect(lamp.x - r * 1.1, lamp.y - r * 1.1, r * 2.2, r * 2.2);
    vg.globalCompositeOperation = "source-over";
  }
  lit.over?.(vg);
  vg.drawImage(vignette, 0, 0, W, H);

  // Idle glimmer (R1.5): after 10 s without input, a slow breathing point of light.
  const target = input.idle > 10 && fade.phase === "none" ? scene.hint(env) : null;
  if (target) {
    const a = 0.28 + 0.22 * Math.sin(time * 2.2);
    const gr = vg.createRadialGradient(target.x, target.y, 0, target.x, target.y, 22);
    gr.addColorStop(0, `rgba(255, 210, 150, ${a})`);
    gr.addColorStop(1, "rgba(255, 210, 150, 0)");
    vg.globalCompositeOperation = "lighter";
    vg.fillStyle = gr;
    vg.fillRect(target.x - 22, target.y - 22, 44, 44);
    vg.globalCompositeOperation = "source-over";
  }

  if (fade.phase !== "none" && fade.a > 0) {
    vg.globalAlpha = Math.min(1, fade.a);
    vg.fillStyle = fade.color === "pale" ? "#f6eede" : "#030201";
    vg.fillRect(0, 0, W, H);
    vg.globalAlpha = 1;
  }
}
// ---------- Main loop ----------
// `?perf` exposes rolling per-frame timings (ms) on window.__perf, for profiling only.
const perf = new URLSearchParams(location.search).has("perf") ? { update: 0, render: 0, compose: 0, fx: 0 } : null;
if (perf) (window as unknown as { __perf: typeof perf }).__perf = perf;
let last = performance.now();
let clock = 0;
function frame(now: number) {
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
  last = now;
  clock += dt;
  env.motion = motionFactor();
  env.reduced = reducedMotion();
  input.update(dt, W, H);
  lamp.update(dt, input.x, input.y, W, H, env.motion);

  if (!machine.paused) {
    const signal = scene.update(dt, env);
    if (signal === "next") advance("next");
    if (fade.phase === "out") {
      fade.a += dt / FADE_OUT;
      if (fade.a >= 1) {
        fade.a = 1;
        switchScene(fade.cmd);
        fade.phase = machine.finished ? "none" : "in";
        if (machine.finished) fade.a = 0;
        if (fade.queuedSkip) {
          fade.queuedSkip = false;
          advance("skip");
        }
      }
    } else if (fade.phase === "in") {
      fade.a -= dt / FADE_IN;
      if (fade.a <= 0) {
        fade.a = 0;
        fade.phase = "none";
      }
    }
  }

  const t1 = performance.now();
  lg.globalCompositeOperation = "source-over";
  lg.fillStyle = "#000";
  lg.fillRect(0, 0, W, H);
  scene.render(lg, env);
  const t2 = performance.now();
  const lit = scene.lighting(env);
  compose(lit, clock);
  const t3 = performance.now();
  if (fx) {
    const f = scene.fx(env);
    fx.render(dt, { lamp: { x: lamp.x, y: lamp.y, r: lamp.r * lit.lamp }, beam: f.beam, glow: f.glow * lit.lamp, dust: f.dust * (1 - fade.a) });
  }
  if (perf) {
    const t4 = performance.now();
    const k = 0.05;
    perf.update += (t1 - now - perf.update) * k;
    perf.render += (t2 - t1 - perf.render) * k;
    perf.compose += (t3 - t2 - perf.compose) * k;
    perf.fx += (t4 - t3 - perf.fx) * k;
  }
  input.endFrame();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
// ---------- Controls (R8.2, R9.2, R9.4) ----------
function show(id: string) {
  $(id).hidden = false;
}
function hide(id: string) {
  $(id).hidden = true;
}

const muteBtn = $<HTMLButtonElement>("btn-mute");
function renderMute() {
  muteBtn.textContent = audio.muted ? s.ui.soundOff : s.ui.soundOn;
  muteBtn.setAttribute("aria-pressed", String(audio.muted));
}
renderMute();
function toggleMute() {
  audio.setMuted(!audio.muted);
  renderMute();
}

function setPaused(p: boolean) {
  if (p === machine.paused) return;
  const next = reduce(machine, p ? "pause" : "resume");
  if (next.paused === machine.paused) return;
  machine = next;
  audio.setPaused(p);
  input.release();
  if (p) {
    show("paused");
    $("btn-resume").focus();
  } else {
    hide("paused");
    stageEl.focus();
  }
}

function showEnd() {
  show("end");
  hide("controls");
  window.setTimeout(() => $("btn-again").focus(), 50);
}

$("btn-start").addEventListener("click", () => {
  audio.init();
  ensureArt();
  hide("start");
  show("controls");
  stageEl.focus();
  advance("next");
});
muteBtn.addEventListener("click", toggleMute);
$("btn-pause").addEventListener("click", () => setPaused(true));
$("btn-resume").addEventListener("click", () => setPaused(false));
$("btn-skip").addEventListener("click", () => advance("skip"));
$("btn-again").addEventListener("click", restart);
$("btn-sources").addEventListener("click", () => {
  show("sources");
  $("btn-sources-close").focus();
});
$("btn-sources-close").addEventListener("click", () => {
  hide("sources");
  $("btn-sources").focus();
});

input.on((c) => {
  if (!$("sources").hidden) {
    return;
  }
  if (c === "mute") toggleMute();
  else if (c === "pause" && machine.index > 0 && !machine.finished) setPaused(!machine.paused);
  else if (c === "skip" && !machine.paused) advance("skip");
});
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !$("sources").hidden) {
    hide("sources");
    $("btn-sources").focus();
  }
});
