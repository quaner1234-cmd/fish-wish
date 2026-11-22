// Rendering base for the 3D act 4 (D-011 prototype): HDR buffer, bloom, tone mapping,
// then a grade pass (split toning, vignette, grain, fade). Two quality tiers.

import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

export interface Quality {
  name: "high" | "low";
  pixelRatio: number;
  sunShadow: number;
  fireShadow: number;
  bloom: boolean;
  grass: number;
}

export function pickQuality(): Quality {
  const q = new URLSearchParams(location.search).get("q");
  const small = Math.min(innerWidth, innerHeight) < 600 || matchMedia("(pointer: coarse)").matches;
  if (q === "low" || (q !== "high" && small)) {
    return { name: "low", pixelRatio: Math.min(devicePixelRatio || 1, 1.25), sunShadow: 1024, fireShadow: 256, bloom: true, grass: 5000 };
  }
  return { name: "high", pixelRatio: Math.min(devicePixelRatio || 1, 2), sunShadow: 2048, fireShadow: 512, bloom: true, grass: 14000 };
}

const GradeShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uTime: { value: 0 },
    uAspect: { value: 1 },
    uVignette: { value: 0.75 },
    uGrain: { value: 0.035 },
    uShadowTint: { value: new THREE.Vector3(0.9, 0.96, 1.06) },
    uHighTint: { value: new THREE.Vector3(1.05, 0.99, 0.92) },
    uFade: { value: 0 },
    uFadeColor: { value: new THREE.Vector3(0.012, 0.008, 0.004) },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime, uAspect, uVignette, uGrain, uFade;
    uniform vec3 uShadowTint, uHighTint, uFadeColor;
    varying vec2 vUv;
    float h(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main() {
      vec4 c = texture2D(tDiffuse, vUv);
      float l = dot(c.rgb, vec3(0.299, 0.587, 0.114));
      c.rgb *= mix(uShadowTint, uHighTint, smoothstep(0.12, 0.7, l));
      vec2 d = vUv - 0.5;
      d.x *= uAspect;
      float v = smoothstep(1.05, 0.25, length(d));
      c.rgb *= mix(1.0 - uVignette, 1.0, v);
      float n = h(vUv * 913.0 + fract(uTime * 7.13) * 101.0);
      c.rgb += (n - 0.5) * uGrain;
      c.rgb = mix(c.rgb, uFadeColor, uFade);
      gl_FragColor = c;
    }
  `,
};

export class Stage {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(30, 1, 0.1, 900);
  private composer: EffectComposer;
  private bloom: UnrealBloomPass;
  private grade: ShaderPass;
  private w = 1;
  private h = 1;

  constructor(
    readonly canvas: HTMLCanvasElement,
    readonly quality: Quality,
  ) {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance" });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.localClippingEnabled = true;
    renderer.setPixelRatio(quality.pixelRatio);
    this.renderer = renderer;

    const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: quality.name === "high" ? 4 : 0 });
    this.composer = new EffectComposer(renderer, target);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    // Keep emissive peaks around 2-3 so the glow never washes out into white.
    this.bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.55, 0.7, 0.92);
    this.bloom.enabled = quality.bloom;
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
    this.grade = new ShaderPass(GradeShader);
    this.composer.addPass(this.grade);
  }

  get aspect() {
    return this.w / this.h;
  }

  resize(w: number, h: number) {
    this.w = Math.max(1, w);
    this.h = Math.max(1, h);
    this.renderer.setSize(this.w, this.h, false);
    this.composer.setPixelRatio(this.quality.pixelRatio);
    this.composer.setSize(this.w, this.h);
    this.camera.aspect = this.w / this.h;
    this.camera.updateProjectionMatrix();
    this.grade.uniforms.uAspect!.value = this.w / this.h;
  }

  /** 0 = clear, 1 = solid fade colour. */
  setFade(a: number) {
    this.grade.uniforms.uFade!.value = a;
  }

  render(time: number) {
    this.grade.uniforms.uTime!.value = time;
    this.composer.render();
  }

  dispose() {
    this.composer.dispose();
    this.renderer.dispose();
  }
}
