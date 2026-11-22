// Pointer, touch and keyboard folded into one lamp target and one "pressed" flag (R1.3, R9.2).

export type KeyCommand = "pause" | "skip" | "mute" | "confirm";

export class Input {
  /** Lamp target in CSS px. */
  x: number;
  y: number;
  /** Pointer or Space held down (brushing). */
  pressed = false;
  /** Seconds since last user activity (for the idle hint, R1.5). */
  idle = 0;
  /** Set for one frame when the user clicks / taps / presses Enter. */
  confirmed = false;

  private arrows = { left: false, right: false, up: false, down: false };
  private space = false;
  private pointerDown = false;
  private listeners: Array<(c: KeyCommand) => void> = [];

  constructor(private surface: HTMLElement, w: number, h: number) {
    this.x = w / 2;
    this.y = h / 2;

    window.addEventListener("pointermove", (e) => {
      this.x = e.clientX;
      this.y = e.clientY;
      this.idle = 0;
    });
    surface.addEventListener("pointerdown", (e) => {
      this.x = e.clientX;
      this.y = e.clientY;
      this.pointerDown = true;
      this.idle = 0;
      this.confirmed = true;
      surface.setPointerCapture?.(e.pointerId);
    });
    const up = () => {
      this.pointerDown = false;
    };
    surface.addEventListener("pointerup", up);
    surface.addEventListener("pointercancel", up);
    window.addEventListener("blur", () => {
      this.pointerDown = false;
      this.space = false;
      this.arrows = { left: false, right: false, up: false, down: false };
    });

    window.addEventListener("keydown", (e) => {
      if (this.isTyping(e)) return;
      const k = e.key;
      let handled = true;
      if (k === "ArrowLeft") this.arrows.left = true;
      else if (k === "ArrowRight") this.arrows.right = true;
      else if (k === "ArrowUp") this.arrows.up = true;
      else if (k === "ArrowDown") this.arrows.down = true;
      else if (k === " " && this.onCanvas(e)) this.space = true;
      else if (k === "Enter" && this.onCanvas(e)) {
        this.confirmed = true;
        this.emit("confirm");
      } else if (k === "p" || k === "P") this.emit("pause");
      else if (k === "s" || k === "S") this.emit("skip");
      else if (k === "m" || k === "M") this.emit("mute");
      else handled = false;
      if (handled) {
        this.idle = 0;
        if (k.startsWith("Arrow") || (k === " " && this.onCanvas(e))) e.preventDefault();
      }
    });
    window.addEventListener("keyup", (e) => {
      const k = e.key;
      if (k === "ArrowLeft") this.arrows.left = false;
      else if (k === "ArrowRight") this.arrows.right = false;
      else if (k === "ArrowUp") this.arrows.up = false;
      else if (k === "ArrowDown") this.arrows.down = false;
      else if (k === " ") this.space = false;
    });
  }

  on(fn: (c: KeyCommand) => void) {
    this.listeners.push(fn);
  }

  /** Called once per frame before scenes update. */
  update(dt: number, w: number, h: number) {
    this.idle += dt;
    const speed = Math.min(w, h) * 0.55;
    const dx = (this.arrows.right ? 1 : 0) - (this.arrows.left ? 1 : 0);
    const dy = (this.arrows.down ? 1 : 0) - (this.arrows.up ? 1 : 0);
    if (dx || dy) {
      const len = Math.hypot(dx, dy);
      this.x = Math.min(w, Math.max(0, this.x + (dx / len) * speed * dt));
      this.y = Math.min(h, Math.max(0, this.y + (dy / len) * speed * dt));
    }
    this.pressed = this.pointerDown || this.space;
  }

  /** Called once per frame after scenes update. */
  endFrame() {
    this.confirmed = false;
  }

  release() {
    this.pointerDown = false;
    this.space = false;
  }

  private emit(c: KeyCommand) {
    for (const fn of this.listeners) fn(c);
  }

  /** Space / Enter act on the story only when focus is not on a button. */
  private onCanvas(e: KeyboardEvent): boolean {
    const t = e.target as HTMLElement | null;
    return !t || t === document.body || t === this.surface || t.id === "stage";
  }

  private isTyping(e: KeyboardEvent): boolean {
    const t = e.target as HTMLElement | null;
    return !!t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA");
  }
}
