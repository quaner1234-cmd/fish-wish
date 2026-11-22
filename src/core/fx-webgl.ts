// Optional WebGL layer: dust that shows only where light falls, a soft halo and film
// grain. Composited with CSS `mix-blend-mode: screen`. If WebGL is missing, or the
// user prefers reduced motion, the layer is simply not drawn (design §1).

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAG = `precision mediump float;
uniform vec2 uRes; uniform float uTime; uniform vec3 uLamp; uniform vec4 uBeam;
uniform float uGlow; uniform float uDust;
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float motes(vec2 px, float cell, float speed, float seed){
  vec2 q = px / cell + vec2(uTime * speed * 0.3, -uTime * speed);
  vec2 id = floor(q); vec2 f = fract(q);
  float h = hash(id + seed);
  vec2 c = vec2(hash(id + seed + 1.7), hash(id + seed + 3.1));
  c += 0.25 * vec2(sin(uTime * 0.7 + h * 6.28), cos(uTime * 0.5 + h * 6.28));
  float d = length(f - c) * cell;
  float size = mix(0.6, 1.8, h);
  return step(0.55, h) * (1.0 - smoothstep(0.0, size + 1.0, d));
}
void main(){
  vec2 px = gl_FragCoord.xy;
  float dl = length(px - uLamp.xy);
  float lampLight = 1.0 - smoothstep(0.0, uLamp.z, dl);
  float db = length(px - uBeam.xy);
  float beamLight = uBeam.w * (1.0 - smoothstep(0.0, uBeam.z, db));
  float light = clamp(lampLight + beamLight, 0.0, 1.0);
  float m = motes(px, 34.0, 0.025, 0.0) + 0.6 * motes(px, 21.0, 0.04, 9.0);
  vec3 col = vec3(1.0, 0.86, 0.66) * m * light * uDust * 0.85;
  float halo = exp(-dl / max(1.0, uLamp.z * 0.9)) * uGlow * 0.16;
  col += vec3(1.0, 0.62, 0.3) * halo;
  col += vec3(0.95, 0.9, 1.0) * beamLight * 0.08;
  col += vec3(hash(px + fract(uTime * 7.0) * 100.0) * 0.022);
  gl_FragColor = vec4(col, 1.0);
}`;

export interface FxParams {
  lamp: { x: number; y: number; r: number };
  beam?: { x: number; y: number; r: number; i: number };
  glow: number;
  dust: number;
}

export class FxLayer {
  private gl: WebGLRenderingContext;
  private u: Record<string, WebGLUniformLocation | null> = {};
  private scale = 1;
  private t = 0;

  static create(canvas: HTMLCanvasElement): FxLayer | null {
    try {
      const gl = canvas.getContext("webgl", { alpha: false, antialias: false, premultipliedAlpha: false });
      return gl ? new FxLayer(canvas, gl) : null;
    } catch {
      return null;
    }
  }
  private constructor(private canvas: HTMLCanvasElement, gl: WebGLRenderingContext) {
    this.gl = gl;
    const shader = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader");
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, shader(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? "link");
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    for (const name of ["uRes", "uTime", "uLamp", "uBeam", "uGlow", "uDust"]) this.u[name] = gl.getUniformLocation(prog, name);
  }

  resize(w: number, h: number, dpr: number) {
    this.scale = Math.min(dpr, 1.5);
    this.canvas.width = Math.round(w * this.scale);
    this.canvas.height = Math.round(h * this.scale);
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  render(dt: number, p: FxParams) {
    const gl = this.gl;
    if (gl.isContextLost()) return;
    this.t += dt;
    const s = this.scale;
    const H = this.canvas.height;
    gl.uniform2f(this.u.uRes!, this.canvas.width, H);
    gl.uniform1f(this.u.uTime!, this.t);
    gl.uniform3f(this.u.uLamp!, p.lamp.x * s, H - p.lamp.y * s, p.lamp.r * s);
    const b = p.beam ?? { x: -1e4, y: -1e4, r: 1, i: 0 };
    gl.uniform4f(this.u.uBeam!, b.x * s, H - b.y * s, b.r * s, b.i);
    gl.uniform1f(this.u.uGlow!, p.glow);
    gl.uniform1f(this.u.uDust!, p.dust);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}
