// Act 4 in 3D (D-011 prototype): rise out of the jar through the earth to the house at
// dawn; the mother feeds the fire and goes out to kneel by the jar.

import * as THREE from "three";
import { Fire, Smoke } from "./fx";
import { Mother } from "./mother";
import { Stage, pickQuality } from "./stage";
import { clamp01, easeInOutCubic, lerp, smooth } from "./util";
import { LAYOUT, World } from "./world";

export const RISE = 15;

const H = LAYOUT.house;

export class Act4 {
  readonly stage: Stage;
  readonly world: World;
  readonly fire: Fire;
  readonly smoke: Smoke;
  readonly mother: Mother;
  t = 0;
  private grave = 0;
  private graveTarget = 0;
  private door = 0;
  private doorTarget = 0;
  private pan = 0;
  private panTarget = 0;
  private flare = 0;
  private flared = false;
  /** 0..1: the camera leaning in while she kneels by the jar. */
  private push = 0;
  /** Debug: follow the mother with a close camera. */
  closeUp = false;
  /** Debug: angle of the close camera around her, in radians (0 = front right). */
  closeUpAngle = 0;

  constructor(canvas: HTMLCanvasElement) {
    const quality = pickQuality();
    this.stage = new Stage(canvas, quality);
    this.world = new World(this.stage.scene, quality);
    const hearth = new THREE.Vector3(LAYOUT.hearth.x, H.floor, LAYOUT.hearth.z);
    this.fire = new Fire(this.stage.scene, hearth, quality.fireShadow);
    this.smoke = new Smoke(this.stage.scene, new THREE.Vector3(H.cx, H.roofH + 0.05, -0.12));
    // She kneels behind and to the right of the fire, facing it: from the open side of the
    // house she is seen three-quarters on, beside the flames rather than behind them, and
    // her way out to the door passes clear of the hearth.
    const seat = new THREE.Vector3(LAYOUT.hearth.x + 0.55, H.floor, LAYOUT.hearth.z - 0.55);
    const r = LAYOUT.ramp;
    this.mother = new Mother({
      seat,
      seatYaw: Math.atan2(hearth.x - seat.x, hearth.z - seat.z),
      via: [new THREE.Vector3(r.x0, H.floor, -0.38), new THREE.Vector3(r.x1, 0, -0.38)],
      jarSpot: new THREE.Vector3(LAYOUT.jar.x - 0.48, 0, -0.42),
      jarYaw: Math.PI / 2,
    });
    this.stage.scene.add(this.mother.group);
  }

  resize(w: number, h: number) {
    this.stage.resize(w, h);
  }

  get arrived() {
    return this.t >= RISE;
  }

  /** "They did not take you to the field…": light the cemetery (and look over to it on a phone). */
  showField(on: boolean) {
    this.graveTarget = on ? 1 : 0;
    this.panTarget = on && this.stage.aspect < 1 ? 11.5 - this.baseX() : 0;
  }
  /** "They kept you here, by the door." */
  showDoor(on: boolean) {
    this.doorTarget = on ? 1 : 0;
  }
  /** "Every morning she lit the fire…" */
  startMother() {
    if (this.mother.t < 0) this.mother.t = 0;
  }
  get motherDone() {
    return this.mother.t >= this.mother.duration;
  }

  private baseX() {
    return this.stage.aspect < 1 ? -1.6 : 2.4;
  }

  private placeCamera() {
    const cam = this.stage.camera;
    const aspect = this.stage.aspect;
    const p = easeInOutCubic(clamp01(this.t / RISE));
    const settle = smooth(clamp01((this.t - RISE) / 40));
    // Wide framing: about 21 m across on a landscape screen, 9 m on a portrait one.
    const width = aspect < 1 ? 9.5 : 21;
    const dist = width / 2 / (Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * aspect);
    const wideX = this.baseX() + this.pan + (aspect < 1 ? 0.4 : -0.9) * settle;
    const look = new THREE.Vector3(lerp(LAYOUT.jar.x, wideX, p), lerp(-0.68, 0.95, p), 0);
    const pos = new THREE.Vector3(look.x + lerp(0, 0.2, p), lerp(-0.66, 2.3, p), lerp(2.1, dist * (1 - 0.14 * settle), Math.pow(p, 1.6)));
    // While she kneels, lean in slowly on the two of them: her above, you in the jar below.
    const k = easeInOutCubic(this.push);
    if (k > 0) {
      const tx = LAYOUT.jar.x - 0.3;
      look.x = lerp(look.x, tx, k);
      look.y = lerp(look.y, 0.1, k);
      pos.x = lerp(pos.x, tx + 0.25, k);
      pos.y = lerp(pos.y, 0.95, k);
      pos.z = lerp(pos.z, pos.z * 0.42, k);
    }
    if (this.closeUp) {
      // From the front and to one side, so the fire is beside her rather than in front.
      const m = this.mother.focus;
      look.set(m.x, m.y - 0.25, m.z);
      const a = Math.atan2(1.35, 2.5) + this.closeUpAngle;
      pos.set(m.x + Math.sin(a) * 2.84, m.y + 0.15, m.z + Math.cos(a) * 2.84);
    }
    cam.position.copy(pos);
    cam.lookAt(look);
  }

  update(dt: number, motion = 1) {
    this.t += dt;
    const time = this.t;
    this.grave += (this.graveTarget - this.grave) * Math.min(1, dt * 1.2);
    this.door += (this.doorTarget - this.door) * Math.min(1, dt * 1.2);
    this.pan += (this.panTarget - this.pan) * Math.min(1, dt * 0.9);
    // About 9 s to settle, starting once she is down.
    if (this.mother.kneelingAtJar > 0.6) this.push = Math.min(1, this.push + dt / 9);
    this.mother.update(dt, motion);
    if (this.mother.t >= this.mother.flareAt && !this.flared) {
      this.flared = true;
      this.flare = 1;
    }
    this.flare = Math.max(0, this.flare - dt / 5);
    const p = clamp01(this.t / RISE);
    const day = clamp01((easeInOutCubic(p) - 0.25) / 0.75);
    const sunrise = smooth((this.t - RISE) / 45);
    const kneel = this.mother.kneelingAtJar;
    this.world.update({
      day,
      sunrise,
      jarGlow: (0.25 + 0.6 * p + 0.6 * this.door + 0.8 * kneel) * (0.9 + 0.1 * Math.sin(time * 1.3)),
      graveGlow: this.grave,
      doorGlow: this.door,
      fire: 1 + this.flare,
      time,
    });
    this.fire.update(dt, time, this.stage.camera, this.flare, motion);
    this.smoke.update(dt, time, day, this.flare, motion);
    this.placeCamera();
    // Start from the pale light of the hole (the scene before fades out to pale).
    this.stage.setFade(0);
  }

  render() {
    this.stage.render(this.t);
  }
}
