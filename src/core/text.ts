// DOM text layer (R9.3): the face's voice, quiet hints, and plain captions.
// The voice appears letter by letter; screen readers still get the whole line at once.

class Line {
  private pending: number | undefined;
  constructor(private el: HTMLElement) {}

  /** `seconds`: how long the spoken line lasts, so the letters keep pace with the voice. */
  show(text: string, voice = false, seconds = 0) {
    if (this.el.dataset.text === text && this.el.classList.contains("visible")) return;
    window.clearTimeout(this.pending);
    if (this.el.classList.contains("visible")) {
      this.el.classList.remove("visible");
      this.pending = window.setTimeout(() => this.set(text, voice, seconds), 450);
    } else {
      this.set(text, voice, seconds);
    }
  }

  hide() {
    window.clearTimeout(this.pending);
    this.el.classList.remove("visible");
  }

  clear() {
    window.clearTimeout(this.pending);
    this.el.classList.remove("visible");
    this.el.textContent = "";
    delete this.el.dataset.text;
  }

  private set(text: string, voice: boolean, seconds: number) {
    this.el.dataset.text = text;
    this.el.classList.toggle("voice", voice);
    if (voice) {
      this.el.textContent = "";
      const frag = document.createDocumentFragment();
      const chars = [...text];
      // The letters arrive over most of the spoken line, never too slow to read.
      const step = seconds > 0 ? Math.min(0.09, Math.max(0.03, ((seconds - 0.6) * 0.8) / chars.length)) : 0.045;
      chars.forEach((ch, i) => {
        const span = document.createElement("span");
        span.textContent = ch;
        span.style.animationDelay = `${(i * step).toFixed(3)}s`;
        frag.append(span);
      });
      this.el.append(frag);
    } else {
      this.el.textContent = text;
    }
    // Force a style flush so the fade-in transition runs.
    void this.el.offsetWidth;
    this.el.classList.add("visible");
  }
}

export class TextLayer {
  readonly narration: Line;
  readonly hint: Line;
  constructor() {
    this.narration = new Line(document.getElementById("narration")!);
    this.hint = new Line(document.getElementById("hint")!);
  }
  clear() {
    this.narration.clear();
    this.hint.clear();
  }
}
