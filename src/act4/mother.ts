// The mother in act 4 (D-011 prototype). She is imagined, like everyone in the story.
//
// Animation follows two rules (learned from op7418/guizang-game-skill, ideas only):
//  - Poses are written as targets in character space (hip, hands, feet), and arms and
//    legs are solved with two-bone IK; joint angles are never guessed.
//  - Every movement has more than three beats: anticipation, action (fast ease-out),
//    overshoot, settle. Big changes (kneel to stand) go head first, then weight onto a
//    support, then the legs push, and the upper body follows last.
//
// Character space: +y up, +z forward, +x to her left. The body is built from simple
// shapes; a generated, rigged model can replace it (same joints).

import * as THREE from "three";
import { clamp01, easeInOutCubic, easeInOutSine, easeOutQuart, lerp, smooth } from "./util";

type V3 = [number, number, number];

export interface Pose {
  hip: V3;
  pelvis: number;
  spine: number;
  twist: number;
  head: number;
  look: number;
  handL: V3;
  handR: V3;
  footL: V3;
  footR: V3;
  /** 0 = foot flat on its sole, 1 = kneeling: instep on the ground, sole up. */
  toesL: number;
  toesR: number;
}

const SEG = { pelvisHalf: 0.09, spine: 0.44, neck: 0.07, headUp: 0.1, shoulder: 0.165, upper: 0.27, fore: 0.25, thigh: 0.42, shin: 0.41 };

const lerp3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
function mix(a: Pose, b: Pose, t: number): Pose {
  return {
    hip: lerp3(a.hip, b.hip, t),
    pelvis: lerp(a.pelvis, b.pelvis, t),
    spine: lerp(a.spine, b.spine, t),
    twist: lerp(a.twist, b.twist, t),
    head: lerp(a.head, b.head, t),
    look: lerp(a.look, b.look, t),
    handL: lerp3(a.handL, b.handL, t),
    handR: lerp3(a.handR, b.handR, t),
    footL: lerp3(a.footL, b.footL, t),
    footR: lerp3(a.footR, b.footR, t),
    toesL: lerp(a.toesL, b.toesL, t),
    toesR: lerp(a.toesR, b.toesR, t),
  };
}
const P = (base: Pose, over: Partial<Pose>): Pose => ({ ...base, ...over });

// ---------- Key poses ----------
const SEIZA: Pose = {
  hip: [0, 0.3, -0.05],
  pelvis: 0.05,
  spine: 0.12,
  twist: 0,
  head: 0.28,
  look: 0,
  handL: [0.12, 0.33, 0.2],
  handR: [-0.12, 0.33, 0.2],
  footL: [0.09, 0.06, -0.14],
  footR: [-0.09, 0.06, -0.14],
  toesL: 1,
  toesR: 1,
};
const STAND: Pose = {
  hip: [0, 0.89, 0],
  pelvis: 0,
  spine: 0.02,
  twist: 0,
  head: 0.08,
  look: 0,
  handL: [0.2, 0.25, 0.02],
  handR: [-0.2, 0.25, 0.02],
  footL: [0.09, 0.06, 0],
  footR: [-0.09, 0.06, 0],
  toesL: 0,
  toesR: 0,
};

interface Key {
  t: number;
  pose: Pose;
  ease: (t: number) => number;
}

function sample(keys: Key[], t: number): Pose {
  if (t <= keys[0]!.t) return keys[0]!.pose;
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i]!;
    if (t <= k.t) {
      const a = keys[i - 1]!;
      return mix(a.pose, k.pose, k.ease((t - a.t) / (k.t - a.t)));
    }
  }
  return keys[keys.length - 1]!.pose;
}

/** At the hearth: lean in and feed the fire, then stand up (head first, weight, push, body last). */
const HEARTH: Key[] = [
  { t: 0, pose: SEIZA, ease: smooth },
  // Anticipation: sit up a little, look up, the right hand lifts the stick.
  { t: 0.5, pose: P(SEIZA, { spine: 0.02, head: 0.05, handR: [-0.16, 0.42, 0.14] }), ease: easeInOutSine },
  // Reach into the fire, the left hand takes the weight on the floor.
  { t: 1.25, pose: P(SEIZA, { hip: [0, 0.36, 0.02], spine: 0.66, head: 0.5, handR: [-0.05, 0.16, 0.56], handL: [0.2, 0.04, 0.34] }), ease: easeOutQuart },
  // Overshoot, then hold a beat.
  { t: 1.5, pose: P(SEIZA, { hip: [0, 0.36, 0.03], spine: 0.72, head: 0.55, handR: [-0.04, 0.14, 0.6], handL: [0.2, 0.04, 0.34] }), ease: easeInOutSine },
  { t: 1.75, pose: P(SEIZA, { hip: [0, 0.36, 0.03], spine: 0.7, head: 0.52, handR: [-0.04, 0.15, 0.59], handL: [0.2, 0.04, 0.34] }), ease: easeInOutSine },
  // Settle back and watch the fire take.
  { t: 2.6, pose: P(SEIZA, { spine: 0.16, head: 0.12 }), ease: easeInOutCubic },
  // Head first: she looks toward the door (her body turns after it, see TURN).
  { t: 3.1, pose: P(SEIZA, { spine: 0.1, head: 0.0, look: 0.6, twist: 0.12 }), ease: easeInOutSine },
  // Up onto the knees; the right foot comes forward.
  {
    t: 3.7,
    pose: P(SEIZA, { hip: [0, 0.47, 0.2], pelvis: 0.02, spine: 0.06, head: 0.02, look: 0.15, twist: 0.04, footR: [-0.1, 0.06, 0.5], toesR: 0, handR: [-0.13, 0.5, 0.46], handL: [0.17, 0.42, 0.18] }),
    ease: easeInOutCubic,
  },
  // Weight forward over the front foot, hand pressing on the knee.
  {
    t: 4.3,
    pose: P(SEIZA, { hip: [0, 0.58, 0.38], pelvis: 0.12, spine: 0.42, head: 0.15, look: 0.05, twist: 0.02, footR: [-0.1, 0.06, 0.5], toesR: 0, toesL: 0.6, handR: [-0.13, 0.5, 0.52], handL: [0.18, 0.4, 0.3] }),
    ease: easeInOutSine,
  },
  // The legs push; the upper body is still behind.
  { t: 5.0, pose: P(STAND, { hip: [0, 0.86, 0.42], spine: 0.22, head: 0.12, footL: [0.09, 0.06, 0.34], footR: [-0.09, 0.06, 0.48], handR: [-0.2, 0.55, 0.45] }), ease: easeOutQuart },
  // Upright, a small settle.
  { t: 5.6, pose: P(STAND, { hip: [0, 0.89, 0.42], footL: [0.09, 0.06, 0.42], footR: [-0.09, 0.06, 0.44] }), ease: easeInOutSine },
];
/** While still on her knees she turns her body toward the door, after her head. */
const TURN = { from: 3.2, to: 3.8 };
const STAND_UP_END = 5.6;
/** Where she stands after rising, in her starting character space. */
const ROSE_AT: V3 = [0, 0, 0.42];

/** By the jar: step, down onto one knee, then both, sit back, bow, and touch the ground. */
const AT_JAR: Key[] = [
  { t: 0, pose: STAND, ease: smooth },
  { t: 0.6, pose: P(STAND, { hip: [0, 0.8, 0.12], spine: 0.15, head: 0.3, footR: [-0.1, 0.06, 0.42], handR: [-0.16, 0.5, 0.3] }), ease: easeInOutSine },
  {
    t: 1.5,
    pose: P(SEIZA, { hip: [0, 0.5, 0.2], pelvis: 0.05, spine: 0.25, head: 0.35, footR: [-0.1, 0.06, 0.45], toesR: 0, footL: [0.1, 0.06, -0.16], toesL: 0.8, handR: [-0.13, 0.5, 0.45], handL: [0.16, 0.42, 0.18] }),
    ease: easeInOutCubic,
  },
  { t: 2.4, pose: P(SEIZA, { hip: [0, 0.31, -0.02], spine: 0.2, head: 0.35 }), ease: easeInOutCubic },
  // Bow, and lay the right hand on the earth over the jar.
  { t: 3.3, pose: P(SEIZA, { hip: [0, 0.33, 0.02], spine: 0.5, head: 0.7, handR: [-0.06, 0.03, 0.52], handL: [0.12, 0.31, 0.22] }), ease: easeOutQuart },
  { t: 3.6, pose: P(SEIZA, { hip: [0, 0.33, 0.03], spine: 0.54, head: 0.74, handR: [-0.06, 0.03, 0.54], handL: [0.12, 0.31, 0.22] }), ease: easeInOutSine },
  { t: 4.4, pose: P(SEIZA, { hip: [0, 0.32, 0.02], spine: 0.46, head: 0.66, handR: [-0.06, 0.03, 0.53], handL: [0.12, 0.31, 0.22] }), ease: easeInOutSine },
];
const KNEEL_END = 4.4;

// ---------- IK ----------
const tmp = { a: new THREE.Vector3(), b: new THREE.Vector3(), c: new THREE.Vector3() };
/** Two-bone IK: returns the middle joint and writes the reachable end into `end`. */
function ik(root: THREE.Vector3, target: THREE.Vector3, l1: number, l2: number, pole: THREE.Vector3, mid: THREE.Vector3, end: THREE.Vector3) {
  const d = tmp.a.subVectors(target, root);
  const dist = Math.min(Math.max(d.length(), 1e-4), l1 + l2 - 1e-4);
  const dir = d.normalize();
  const cosA = (l1 * l1 + dist * dist - l2 * l2) / (2 * l1 * dist);
  const sinA = Math.sqrt(Math.max(0, 1 - cosA * cosA));
  const p = tmp.b.copy(pole).addScaledVector(dir, -pole.dot(dir));
  if (p.lengthSq() < 1e-8) p.set(0, 0, 1);
  p.normalize();
  mid.copy(root).addScaledVector(dir, cosA * l1).addScaledVector(p, sinA * l1);
  end.copy(root).addScaledVector(dir, dist);
}

export interface Joints {
  hip: THREE.Vector3;
  chest: THREE.Vector3;
  neck: THREE.Vector3;
  head: THREE.Vector3;
  headFwd: THREE.Vector3;
  headUp: THREE.Vector3;
  hipL: THREE.Vector3;
  hipR: THREE.Vector3;
  kneeL: THREE.Vector3;
  kneeR: THREE.Vector3;
  ankleL: THREE.Vector3;
  ankleR: THREE.Vector3;
  shoulderL: THREE.Vector3;
  shoulderR: THREE.Vector3;
  elbowL: THREE.Vector3;
  elbowR: THREE.Vector3;
  handL: THREE.Vector3;
  handR: THREE.Vector3;
  fwd: THREE.Vector3;
  left: THREE.Vector3;
  spineDir: THREE.Vector3;
  chestFwd: THREE.Vector3;
  chestLeft: THREE.Vector3;
  toesL: number;
  toesR: number;
  /** Height of the ground under her root. */
  ground: number;
}

function newJoints(): Joints {
  const v = () => new THREE.Vector3();
  return {
    hip: v(), chest: v(), neck: v(), head: v(), headFwd: v(), headUp: v(), hipL: v(), hipR: v(), kneeL: v(), kneeR: v(), ankleL: v(), ankleR: v(),
    shoulderL: v(), shoulderR: v(), elbowL: v(), elbowR: v(), handL: v(), handR: v(), fwd: v(), left: v(), spineDir: v(), chestFwd: v(), chestLeft: v(), toesL: 0, toesR: 0, ground: 0,
  };
}

/** Pose (character space) + root + yaw → world joint positions. */
export function solve(pose: Pose, root: THREE.Vector3, yaw: number, j: Joints) {
  const fwd = j.fwd.set(Math.sin(yaw), 0, Math.cos(yaw));
  const left = j.left.set(Math.cos(yaw), 0, -Math.sin(yaw));
  const up = new THREE.Vector3(0, 1, 0);
  const toWorld = (c: V3, out: THREE.Vector3) => out.copy(root).addScaledVector(left, c[0]).addScaledVector(up, c[1]).addScaledVector(fwd, c[2]);
  toWorld(pose.hip, j.hip);
  // Upper body: pitched forward by pelvis + spine, twisted about the spine.
  const a = pose.pelvis + pose.spine;
  const spineDir = j.spineDir.copy(up).multiplyScalar(Math.cos(a)).addScaledVector(fwd, Math.sin(a)).normalize();
  const chestFwd = j.chestFwd.copy(fwd).multiplyScalar(Math.cos(a)).addScaledVector(up, -Math.sin(a));
  const chestLeft = j.chestLeft.copy(left).applyAxisAngle(spineDir, pose.twist);
  chestFwd.applyAxisAngle(spineDir, pose.twist);
  j.chest.copy(j.hip).addScaledVector(spineDir, SEG.spine);
  j.neck.copy(j.chest).addScaledVector(spineDir, SEG.neck);
  // Head: pitched (bow) and turned (look) from the chest frame.
  const hf = new THREE.Vector3().copy(chestFwd).applyAxisAngle(spineDir, pose.look);
  const hl = new THREE.Vector3().copy(chestLeft).applyAxisAngle(spineDir, pose.look);
  const hu = new THREE.Vector3().copy(spineDir).applyAxisAngle(hl, pose.head);
  hf.applyAxisAngle(hl, pose.head);
  j.headFwd.copy(hf);
  j.headUp.copy(hu);
  j.head.copy(j.neck).addScaledVector(hu, SEG.headUp).addScaledVector(hf, 0.015);
  j.shoulderL.copy(j.chest).addScaledVector(chestLeft, SEG.shoulder).addScaledVector(spineDir, -0.035);
  j.shoulderR.copy(j.chest).addScaledVector(chestLeft, -SEG.shoulder).addScaledVector(spineDir, -0.035);
  j.hipL.copy(j.hip).addScaledVector(left, SEG.pelvisHalf);
  j.hipR.copy(j.hip).addScaledVector(left, -SEG.pelvisHalf);

  const target = new THREE.Vector3();
  const pole = new THREE.Vector3();
  // Legs: knees point forward and a little out.
  toWorld(pose.footL, target);
  pole.copy(fwd).addScaledVector(left, 0.15);
  ik(j.hipL, target, SEG.thigh, SEG.shin, pole, j.kneeL, j.ankleL);
  toWorld(pose.footR, target);
  pole.copy(fwd).addScaledVector(left, -0.15);
  ik(j.hipR, target, SEG.thigh, SEG.shin, pole, j.kneeR, j.ankleR);
  // Arms: elbows point back, out and down.
  toWorld(pose.handL, target);
  pole.copy(chestFwd).multiplyScalar(-0.6).addScaledVector(chestLeft, 0.5).addScaledVector(spineDir, -0.5);
  ik(j.shoulderL, target, SEG.upper, SEG.fore, pole, j.elbowL, j.handL);
  toWorld(pose.handR, target);
  pole.copy(chestFwd).multiplyScalar(-0.6).addScaledVector(chestLeft, -0.5).addScaledVector(spineDir, -0.5);
  ik(j.shoulderR, target, SEG.upper, SEG.fore, pole, j.elbowR, j.handR);
  j.toesL = pose.toesL;
  j.toesR = pose.toesR;
  j.ground = root.y;
}

// ---------- Body ----------
// Built from simple shapes after the concept turnaround (not shipped): a knee-length
// linen tunic with wide short sleeves and a rope belt, wrapped shins, bare feet, hair in
// a bun with a bone pin, a shell necklace. Faceless, as figures are in INSIDE.
const UP = new THREE.Vector3(0, 1, 0);
const _m = new THREE.Matrix4();
const _y = new THREE.Vector3();
const _z = new THREE.Vector3();
function limb(mesh: THREE.Object3D, a: THREE.Vector3, b: THREE.Vector3) {
  const d = tmp.c.subVectors(b, a);
  const len = d.length();
  mesh.position.copy(a).addScaledVector(d, 0.5);
  mesh.quaternion.setFromUnitVectors(UP, d.normalize());
  mesh.scale.set(1, Math.max(1e-3, len), 1);
}
/** Set a mesh's matrix from an origin and three (possibly scaled) axes. */
function frame(mesh: THREE.Object3D, o: THREE.Vector3, x: THREE.Vector3, y: THREE.Vector3, z: THREE.Vector3) {
  mesh.matrix.copy(_m.makeBasis(x, y, z).setPosition(o));
  mesh.matrixWorldNeedsUpdate = true;
}

/** Canvas textures for the cloth: plain-woven linen, and criss-crossed leg wraps. */
function clothTexture(kind: "linen" | "wrap") {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  let seed = kind === "linen" ? 21 : 23;
  const r = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  g.fillStyle = kind === "linen" ? "#9b8869" : "#857660";
  g.fillRect(0, 0, 256, 256);
  // Uneven dye.
  for (let i = 0; i < 40; i++) {
    const x = r() * 256;
    const y = r() * 256;
    const rad = 20 + r() * 60;
    const grd = g.createRadialGradient(x, y, 0, x, y, rad);
    const dark = r() < 0.5;
    grd.addColorStop(0, dark ? "rgba(50,36,20,0.10)" : "rgba(255,240,210,0.08)");
    grd.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grd;
    g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  if (kind === "linen") {
    for (let y = 0; y < 256; y += 2) {
      g.fillStyle = `rgba(255,240,215,${0.03 + r() * 0.07})`;
      g.fillRect(0, y, 256, 1);
    }
    for (let x = 0; x < 256; x += 2) {
      g.fillStyle = `rgba(40,28,16,${0.03 + r() * 0.07})`;
      g.fillRect(x, 0, 1, 256);
    }
    // Slubs: thicker bits of thread.
    for (let i = 0; i < 260; i++) {
      g.fillStyle = `rgba(${r() < 0.5 ? "255,238,205" : "60,44,26"},${0.12 + r() * 0.15})`;
      g.fillRect(r() * 256, Math.floor(r() * 128) * 2, 4 + r() * 14, 1);
    }
  } else {
    g.lineCap = "round";
    for (const dir of [1, -1]) {
      for (let k = -256; k < 512; k += 36) {
        g.strokeStyle = "rgba(30,22,12,0.2)";
        g.lineWidth = 3;
        g.beginPath();
        g.moveTo(k, 0);
        g.lineTo(k + dir * 150, 256);
        g.stroke();
        g.strokeStyle = "rgba(255,240,210,0.06)";
        g.lineWidth = 12;
        g.beginPath();
        g.moveTo(k + 8, 0);
        g.lineTo(k + 8 + dir * 150, 256);
        g.stroke();
      }
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}

/** Torso profile from the hip (y = 0) to the neck opening (y = 1): r in metres. */
const TORSO: [number, number][] = [
  [0.13, 0], [0.122, 0.15], [0.116, 0.3], [0.128, 0.48], [0.145, 0.63], [0.15, 0.73], [0.138, 0.84], [0.112, 0.92], [0.08, 0.97], [0.05, 1],
];
const TORSO_LEN = SEG.spine + 0.025;
const TORSO_DEPTH = 0.68;
const BELT_AT = 0.3;

class Body {
  readonly group = new THREE.Group();
  private parts: Record<string, THREE.Mesh> = {};
  private torso: THREE.Mesh;
  private belt: THREE.Mesh;
  private necklace = new THREE.Group();
  private skirt: THREE.Mesh;
  private skirtGeo: THREE.BufferGeometry;
  private rings = 10;
  private seg = 40;
  hem = new THREE.Vector3();
  private hemVel = new THREE.Vector3();
  private lastHip = new THREE.Vector3();
  private hipVel = new THREE.Vector3();
  private first = true;

  constructor() {
    const linenMap = clothTexture("linen");
    linenMap.repeat.set(3, 2);
    const wrapMap = clothTexture("wrap");
    wrapMap.repeat.set(1, 1.1);
    const linen = new THREE.MeshStandardMaterial({ color: 0xffffff, map: linenMap, roughness: 1, side: THREE.DoubleSide });
    const wraps = new THREE.MeshStandardMaterial({ color: 0xffffff, map: wrapMap, roughness: 1 });
    const rope = new THREE.MeshStandardMaterial({ color: 0x8c7045, roughness: 1 });
    const skin = new THREE.MeshStandardMaterial({ color: 0x9a6648, roughness: 0.7 });
    const hair = new THREE.MeshStandardMaterial({ color: 0x15100c, roughness: 0.55 });
    const bone = new THREE.MeshStandardMaterial({ color: 0xe6dcc8, roughness: 0.5 });
    const cyl = (r0: number, r1: number, open = false) => new THREE.CylinderGeometry(r1, r0, 1, 16, 1, open);
    const add = (name: string, geo: THREE.BufferGeometry, mat: THREE.Material) => {
      const m = new THREE.Mesh(geo, mat);
      m.castShadow = true;
      m.receiveShadow = true;
      this.parts[name] = m;
      this.group.add(m);
      return m;
    };
    this.torso = add("torso", new THREE.LatheGeometry(TORSO.map(([r, y]) => new THREE.Vector2(r, y)), 32), linen);
    this.torso.matrixAutoUpdate = false;
    this.belt = add("belt", new THREE.TorusGeometry(0.128, 0.016, 8, 40).rotateX(Math.PI / 2), rope);
    this.belt.matrixAutoUpdate = false;
    add("knot", new THREE.SphereGeometry(0.022, 10, 8), rope);
    add("tieA", cyl(0.011, 0.008), rope);
    add("tieB", cyl(0.011, 0.008), rope);
    add("neck", cyl(0.047, 0.042), skin);
    add("head", new THREE.SphereGeometry(0.09, 28, 18), skin);
    // Hair: a sphere set back and up from the head, so the face shows below a soft hairline.
    add("hair", new THREE.SphereGeometry(0.094, 28, 18), hair);
    add("bun", new THREE.SphereGeometry(0.048, 16, 12), hair);
    add("pin", cyl(0.006, 0.005), bone);
    for (let i = 0; i < 18; i++) {
      const bead = new THREE.Mesh(new THREE.SphereGeometry(0.011, 8, 6), bone);
      const a = (i / 18) * Math.PI * 2;
      bead.position.set(Math.cos(a) * 0.072, 0, Math.sin(a) * 0.064);
      bead.scale.set(1, 0.75, 1.3);
      bead.lookAt(0, 0, 0);
      this.necklace.add(bead);
    }
    this.group.add(this.necklace);
    for (const s of ["L", "R"]) {
      add(`shoulder${s}`, new THREE.SphereGeometry(0.064, 16, 12), linen);
      add(`sleeve${s}`, cyl(0.058, 0.072, true), linen);
      add(`upper${s}`, cyl(0.04, 0.032), skin);
      add(`elbow${s}`, new THREE.SphereGeometry(0.032, 12, 8), skin);
      add(`fore${s}`, cyl(0.033, 0.023), skin);
      add(`hand${s}`, new THREE.SphereGeometry(0.045, 14, 10), skin);
      add(`thigh${s}`, cyl(0.066, 0.05), skin);
      add(`knee${s}`, new THREE.SphereGeometry(0.049, 12, 8), skin);
      add(`shin${s}`, cyl(0.045, 0.033), skin);
      add(`wrap${s}`, cyl(0.051, 0.042), wraps);
      add(`foot${s}`, new THREE.SphereGeometry(0.05, 16, 10), skin);
    }
    this.parts.head!.scale.set(0.86, 1.05, 0.95);
    // The tunic below the belt: a tube that follows the knees, with a lagging hem.
    const verts = this.rings * (this.seg + 1);
    this.skirtGeo = new THREE.BufferGeometry();
    this.skirtGeo.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(verts * 3), 3));
    const uv = new Float32Array(verts * 2);
    for (let r = 0; r < this.rings; r++) {
      for (let s = 0; s <= this.seg; s++) {
        const i = r * (this.seg + 1) + s;
        uv[i * 2] = (s / this.seg) * 1.3;
        uv[i * 2 + 1] = (r / (this.rings - 1)) * 0.5;
      }
    }
    this.skirtGeo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    const idx: number[] = [];
    for (let r = 0; r < this.rings - 1; r++) {
      for (let s = 0; s < this.seg; s++) {
        const a = r * (this.seg + 1) + s;
        const b = a + this.seg + 1;
        idx.push(a, b, a + 1, a + 1, b, b + 1);
      }
    }
    this.skirtGeo.setIndex(idx);
    this.skirt = new THREE.Mesh(this.skirtGeo, linen);
    this.skirt.castShadow = true;
    this.skirt.receiveShadow = true;
    this.skirt.frustumCulled = false;
    this.group.add(this.skirt);
  }

  /** A point on her for cameras to look at (the chest). */
  readonly focus = new THREE.Vector3();

  update(j: Joints, dt: number) {
    const p = this.parts;
    this.focus.copy(j.chest);
    // Torso and belt follow the chest frame, flattened front to back.
    frame(this.torso, j.hip, j.chestLeft, _y.copy(j.spineDir).multiplyScalar(TORSO_LEN), _z.copy(j.chestFwd).multiplyScalar(TORSO_DEPTH));
    const beltO = tmp.a.copy(j.hip).addScaledVector(j.spineDir, BELT_AT * TORSO_LEN);
    frame(this.belt, beltO, j.chestLeft, j.spineDir, _z.copy(j.chestFwd).multiplyScalar(TORSO_DEPTH));
    // The belt is tied in front; the ends hang down and swing with the hem.
    const knot = tmp.b.copy(beltO).addScaledVector(j.chestFwd, 0.128 * TORSO_DEPTH + 0.008).addScaledVector(j.chestLeft, 0.03);
    p.knot!.position.copy(knot);
    const hang = new THREE.Vector3().copy(j.spineDir).multiplyScalar(-0.5).addScaledVector(UP, -0.5).normalize();
    hang.addScaledVector(this.hem, 1.5).normalize();
    limb(p.tieA!, knot, knot.clone().addScaledVector(hang, 0.22).addScaledVector(j.chestLeft, 0.012));
    limb(p.tieB!, knot, knot.clone().addScaledVector(hang, 0.17).addScaledVector(j.chestLeft, -0.018));
    // Neck, head, hair, pin, necklace.
    limb(p.neck!, j.chest, j.neck.clone().addScaledVector(j.headUp, 0.05));
    p.head!.position.copy(j.head);
    const m = new THREE.Matrix4().lookAt(new THREE.Vector3(), j.headFwd, j.headUp);
    p.head!.quaternion.setFromRotationMatrix(m).multiply(new THREE.Quaternion().setFromAxisAngle(UP, Math.PI));
    p.hair!.position.copy(j.head).addScaledVector(j.headFwd, -0.012).addScaledVector(j.headUp, 0.016);
    p.hair!.quaternion.copy(p.head!.quaternion);
    p.hair!.scale.set(0.9, 1, 1);
    const bun = p.bun!.position.copy(j.head).addScaledVector(j.headFwd, -0.1).addScaledVector(j.headUp, -0.035);
    const headLeft = tmp.c.crossVectors(j.headUp, j.headFwd).normalize();
    limb(p.pin!, bun.clone().addScaledVector(headLeft, -0.085).addScaledVector(j.headUp, 0.01), bun.clone().addScaledVector(headLeft, 0.085).addScaledVector(j.headUp, 0.025));
    const nUp = new THREE.Vector3().copy(j.spineDir).addScaledVector(j.chestFwd, 0.45).normalize();
    this.necklace.position.copy(j.chest).addScaledVector(j.spineDir, -0.01).addScaledVector(j.chestFwd, 0.012);
    this.necklace.quaternion.setFromRotationMatrix(_m.makeBasis(j.chestLeft, nUp, new THREE.Vector3().crossVectors(j.chestLeft, nUp)));
    for (const s of ["L", "R"] as const) {
      const sh = s === "L" ? j.shoulderL : j.shoulderR;
      const el = s === "L" ? j.elbowL : j.elbowR;
      const ha = s === "L" ? j.handL : j.handR;
      const hp = s === "L" ? j.hipL : j.hipR;
      const kn = s === "L" ? j.kneeL : j.kneeR;
      const an = s === "L" ? j.ankleL : j.ankleR;
      p[`shoulder${s}`]!.position.copy(sh);
      p[`shoulder${s}`]!.quaternion.setFromUnitVectors(UP, j.spineDir);
      p[`shoulder${s}`]!.scale.set(1, 0.85, 0.9);
      // The sleeve: from inside the shoulder to just past the middle of the upper arm.
      const arm = new THREE.Vector3().subVectors(el, sh);
      limb(p[`sleeve${s}`]!, sh.clone().addScaledVector(arm, -0.12), sh.clone().addScaledVector(arm, 0.52));
      limb(p[`upper${s}`]!, sh, el);
      p[`elbow${s}`]!.position.copy(el);
      limb(p[`fore${s}`]!, el, ha);
      const hand = p[`hand${s}`]!;
      const hd = tmp.c.subVectors(ha, el).normalize();
      hand.position.copy(ha).addScaledVector(hd, 0.035);
      hand.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), hd);
      hand.scale.set(0.85, 0.42, 1.25);
      limb(p[`thigh${s}`]!, hp, kn);
      p[`knee${s}`]!.position.copy(kn);
      limb(p[`shin${s}`]!, kn, an);
      const shin = new THREE.Vector3().subVectors(an, kn);
      limb(p[`wrap${s}`]!, kn.clone().addScaledVector(shin, 0.2), an.clone().addScaledVector(shin, 0.02));
      // Foot: flat and forward when standing; when kneeling, the instep lies on the ground pointing back.
      const toes = s === "L" ? j.toesL : j.toesR;
      const foot = p[`foot${s}`]!;
      const back = tmp.c.subVectors(an, kn).setY(0);
      const fdir = back.lengthSq() > 1e-6 ? back.normalize() : j.fwd.clone().negate();
      const dir = new THREE.Vector3().copy(j.fwd).lerp(fdir, toes).normalize();
      foot.position.copy(an).addScaledVector(dir, 0.06 * (1 - toes) + 0.07 * toes).setY(Math.max(j.ground + 0.022, an.y - 0.035));
      foot.lookAt(foot.position.clone().add(dir));
      foot.rotateX(-toes * 0.15);
      foot.scale.set(0.85, 0.48, 2.1);
    }
    this.updateSkirt(j, dt);
  }

  private updateSkirt(j: Joints, dt: number) {
    // Hip velocity drives a damped spring on the hem: it swings a little behind the body.
    if (this.first) {
      this.lastHip.copy(j.hip);
      this.first = false;
    }
    if (dt > 0) {
      const v = tmp.c.subVectors(j.hip, this.lastHip).divideScalar(dt);
      this.hipVel.lerp(v, Math.min(1, dt * 10));
    }
    this.lastHip.copy(j.hip);
    const k = 60;
    const damp = 9;
    const target = tmp.a.copy(this.hipVel).multiplyScalar(-0.05);
    target.y = 0;
    this.hemVel.addScaledVector(tmp.b.subVectors(target, this.hem), k * dt).multiplyScalar(Math.max(0, 1 - damp * dt));
    this.hem.addScaledVector(this.hemVel, dt);
    if (this.hem.length() > 0.12) this.hem.setLength(0.12);

    const pos = this.skirtGeo.attributes.position as THREE.BufferAttribute;
    const kneeMid = new THREE.Vector3().addVectors(j.kneeL, j.kneeR).multiplyScalar(0.5);
    const kneeSpan = j.kneeL.distanceTo(j.kneeR) / 2;
    // The hem sits at the knees; it never goes under the ground.
    const hemC = kneeMid.clone().addScaledVector(j.spineDir, -0.03).add(this.hem);
    const waistC = j.hip.clone().addScaledVector(j.spineDir, BELT_AT * TORSO_LEN - 0.01);
    const left = j.left;
    const fwdLow = new THREE.Vector3().subVectors(kneeMid, j.hip).setY(0);
    const kneelFwd = fwdLow.lengthSq() > 1e-4 ? fwdLow.normalize() : j.fwd;
    const swing = this.hem.length() * 6;
    for (let r = 0; r < this.rings; r++) {
      const s = r / (this.rings - 1);
      // A-line: wider toward the hem, with a slight bulge over the thighs.
      const c = new THREE.Vector3().lerpVectors(waistC, hemC, s);
      const rl = lerp(0.124, Math.max(0.2, kneeSpan + 0.11), s) + 0.02 * Math.sin(Math.PI * s);
      const rf = lerp(0.085, 0.165, s) + 0.02 * Math.sin(Math.PI * s);
      for (let i = 0; i <= this.seg; i++) {
        const th = (i / this.seg) * Math.PI * 2;
        // Soft vertical folds, deeper toward the hem and when the cloth swings.
        const fold = 1 + (0.035 + 0.03 * swing) * s * Math.sin(th * 9 + 1.3 * Math.sin(th * 4));
        const x = Math.cos(th) * fold;
        const z = Math.sin(th) * fold;
        const v = new THREE.Vector3().copy(c).addScaledVector(left, x * rl).addScaledVector(kneelFwd, z * rf);
        // Cloth behind the body drapes down toward the ground when she kneels.
        const behind = Math.max(0, -z) * s;
        v.y = Math.max(j.ground + 0.02, v.y - behind * Math.max(0, c.y - j.ground - 0.06) * 0.6);
        pos.setXYZ(r * (this.seg + 1) + i, v.x, v.y, v.z);
      }
    }
    pos.needsUpdate = true;
    this.skirtGeo.computeVertexNormals();
  }
}

// ---------- The mother ----------
export interface Path {
  points: THREE.Vector3[];
}

export class Mother {
  readonly group: THREE.Group;
  private body = new Body();
  private j = newJoints();
  /** Seconds since "Every morning…" began; < 0 while she waits at the hearth. */
  t = -1;
  private clock = 0;
  readonly seat: THREE.Vector3;
  readonly seatYaw: number;
  readonly jarSpot: THREE.Vector3;
  readonly jarYaw: number;
  private path: THREE.Vector3[];
  private lengths: number[] = [];
  private total = 0;
  readonly speed = 0.75;
  readonly flareAt = 1.05;

  /** The way she faces once she has turned toward the door. */
  readonly doorYaw: number;

  constructor(opts: { seat: THREE.Vector3; seatYaw: number; via: THREE.Vector3[]; jarSpot: THREE.Vector3; jarYaw: number }) {
    this.group = this.body.group;
    this.seat = opts.seat;
    this.seatYaw = opts.seatYaw;
    this.jarSpot = opts.jarSpot;
    this.jarYaw = opts.jarYaw;
    const first = opts.via[0] ?? opts.jarSpot;
    this.doorYaw = Math.atan2(first.x - opts.seat.x, first.z - opts.seat.z);
    const start = this.charToWorld(ROSE_AT, this.seat, this.doorYaw);
    this.path = [start, ...opts.via, opts.jarSpot];
    for (let i = 1; i < this.path.length; i++) {
      const l = this.path[i]!.distanceTo(this.path[i - 1]!);
      this.lengths.push(l);
      this.total += l;
    }
  }

  /** Total length of her timeline from "Every morning…", in seconds. */
  get duration() {
    return STAND_UP_END + this.total / this.speed + KNEEL_END;
  }

  /** Where a close camera should look. */
  get focus() {
    return this.body.focus;
  }

  get kneelingAtJar() {
    return clamp01((this.t - (STAND_UP_END + this.total / this.speed)) / KNEEL_END);
  }

  private charToWorld(c: V3, root: THREE.Vector3, yaw: number) {
    return new THREE.Vector3(
      root.x + Math.cos(yaw) * c[0] + Math.sin(yaw) * c[2],
      root.y + c[1],
      root.z - Math.sin(yaw) * c[0] + Math.cos(yaw) * c[2],
    );
  }
  private worldToChar(w: THREE.Vector3, root: THREE.Vector3, yaw: number): V3 {
    const dx = w.x - root.x;
    const dz = w.z - root.z;
    return [Math.cos(yaw) * dx - Math.sin(yaw) * dz, w.y - root.y, Math.sin(yaw) * dx + Math.cos(yaw) * dz];
  }

  private along(d: number) {
    let left = Math.min(Math.max(0, d), this.total);
    for (let i = 0; i < this.lengths.length; i++) {
      const l = this.lengths[i]!;
      if (left <= l) return { p: new THREE.Vector3().lerpVectors(this.path[i]!, this.path[i + 1]!, l > 0 ? left / l : 0), seg: i };
      left -= l;
    }
    return { p: this.path[this.path.length - 1]!.clone(), seg: this.lengths.length - 1 };
  }
  private heading(d: number) {
    const a = this.along(Math.max(0, d - 0.25)).p;
    const b = this.along(Math.min(this.total, d + 0.25)).p;
    return Math.atan2(b.x - a.x, b.z - a.z);
  }

  update(dt: number, motion: number) {
    this.clock += dt;
    if (this.t >= 0) this.t += dt;
    const breathe = 0.012 * Math.sin(this.clock * 1.5) * motion;
    let pose: Pose;
    let root: THREE.Vector3;
    let yaw: number;
    const walkStart = STAND_UP_END;
    const walkEnd = STAND_UP_END + this.total / this.speed;
    if (this.t < walkStart) {
      pose = sample(HEARTH, Math.max(0, this.t));
      root = this.seat;
      // Her head turns first (the `look` keys); her body follows on her knees.
      const turn = easeInOutSine((this.t - TURN.from) / (TURN.to - TURN.from));
      yaw = this.seatYaw + angleDiff(this.seatYaw, this.doorYaw) * turn;
    } else if (this.t < walkEnd) {
      const w = this.t - walkStart;
      const d = w * this.speed;
      ({ pose, root, yaw } = this.walkPose(d, w, walkEnd - walkStart));
    } else {
      const k = this.t - walkEnd;
      root = this.jarSpot;
      const arriveYaw = this.heading(this.total);
      yaw = arriveYaw + angleDiff(arriveYaw, this.jarYaw) * smooth(k / 0.8);
      pose = sample(AT_JAR, k);
    }
    pose = { ...pose, spine: pose.spine + breathe, head: pose.head - breathe * 0.5 };
    solve(pose, root, yaw, this.j);
    this.body.update(this.j, dt);
  }

  /** Walking: feet planted along the path, hips bob, arms swing opposite to the legs. */
  private walkPose(d: number, w: number, dur: number): { pose: Pose; root: THREE.Vector3; yaw: number } {
    const S = 0.36; // half a stride
    const ramp = Math.min(1, w * 1.6, (dur - w) * 1.6 + 0.3);
    const here = this.along(d).p;
    let yaw = this.heading(d);
    // Blend in from the way she faced while standing up.
    if (w < 0.6) yaw = this.doorYaw + angleDiff(this.doorYaw, yaw) * smooth(w / 0.6);
    const foot = (off: number) => {
      const ph = (d + off) / (2 * S);
      const k = Math.floor(ph);
      const f = ph - k;
      const plant = (n: number) => this.along((n + 0.25) * 2 * S - off).p;
      if (f < 0.5) return { p: plant(k), lift: 0 };
      const s = (f - 0.5) / 0.5;
      const a = plant(k);
      const b = plant(k + 1);
      return { p: new THREE.Vector3().lerpVectors(a, b, easeInOutSine(s)), lift: Math.sin(Math.PI * s) * 0.07 };
    };
    const fl = foot(0);
    const fr = foot(S);
    const lift = (fp: { p: THREE.Vector3; lift: number }, side: number): V3 => {
      const c = this.worldToChar(fp.p, here, yaw);
      // Blend the stride in and out so standing still has the feet together.
      return [lerp(side * 0.09, c[0] + side * 0.09, ramp), 0.06 + fp.lift * ramp + (fp.p.y - here.y), lerp(0, c[2], ramp)];
    };
    const phase = (d / (2 * S)) * Math.PI * 2;
    const bob = (0.025 * Math.cos(phase * 2) - 0.012) * ramp;
    const swing = Math.sin(phase) * 0.2 * ramp;
    const onRamp = Math.abs(this.along(d + 0.3).p.y - this.along(d - 0.3).p.y) > 0.05 ? 0.1 : 0;
    const pose: Pose = {
      ...STAND,
      hip: [0.012 * Math.sin(phase) * ramp, 0.89 + bob, 0.02 * ramp],
      spine: 0.05 + onRamp,
      head: 0.1 + onRamp * 0.5,
      twist: -0.06 * Math.sin(phase) * ramp,
      handL: [0.19, 0.25, 0.02 - swing],
      handR: [-0.19, 0.25, 0.02 + swing],
      footL: lift(fl, 1),
      footR: lift(fr, -1),
    };
    return { pose, root: here, yaw };
  }
}

function angleDiff(a: number, b: number) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}
