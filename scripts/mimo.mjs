// Minimal client for the Xiaomi MiMo API: speech synthesis and audio understanding.
// The key comes from XIAOMI_API_KEY and is only ever sent in the request header.

const BASE = process.env.MIMO_BASE_URL ?? "https://api.xiaomimimo.com/v1";

function key() {
  const k = process.env.XIAOMI_API_KEY;
  if (!k) throw new Error("XIAOMI_API_KEY is not set.");
  return k;
}

async function post(body) {
  const res = await fetch(`${BASE}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "api-key": key() },
    body: JSON.stringify(body),
  });
  const raw = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${raw.slice(0, 300)}`);
  return JSON.parse(raw);
}

/** Text to speech. Returns WAV bytes (24 kHz, 16-bit, mono). */
export async function synth({ voice, direction, text, model = "mimo-v2.5-tts" }) {
  const data = await post({
    model,
    messages: [
      { role: "user", content: direction },
      { role: "assistant", content: text },
    ],
    audio: { format: "wav", voice },
  });
  const b64 = data?.choices?.[0]?.message?.audio?.data;
  if (!b64) throw new Error("No audio in response.");
  return Buffer.from(b64, "base64");
}

const LISTEN =
  "Listen carefully. Reply with JSON only, no prose: " +
  '{"transcript": "<exact words heard>", "voice": "<gender, apparent age, timbre in a few words>", ' +
  '"delivery": "<whisper/murmur/normal, pace, pauses>", ' +
  '"problems": "<mispronunciations, extra words, glitches, noise, distortion, or none>"}';

/** Ask an audio-understanding model what it hears. A machine opinion, not a listening test. */
export async function listen(buf, mime = "audio/wav", model = "mimo-v2.6-flash") {
  const data = await post({
    model,
    messages: [
      {
        role: "user",
        content: [
          { type: "input_audio", input_audio: { data: `data:${mime};base64,${buf.toString("base64")}` } },
          { type: "text", text: LISTEN },
        ],
      },
    ],
    max_completion_tokens: 1024,
  });
  const content = (data.choices?.[0]?.message?.content ?? "").replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(content);
  } catch {
    return { transcript: content, problems: "unparsed reply" };
  }
}

/** Words only, lower case, for comparing a transcript with the line. */
export const words = (s) =>
  String(s ?? "")
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^a-z' ]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);

export function sameWords(a, b) {
  const x = words(a);
  const y = words(b);
  return x.length === y.length && x.every((w, i) => w === y[i]);
}

export const clean = (problems) => /^\s*(none|no|n\/a)?\s*\.?\s*$/i.test(String(problems ?? ""));

/** Duration of a PCM WAV, read from its header. */
export function wavSeconds(buf) {
  const bytesPerSec = buf.readUInt32LE(28);
  let off = 12;
  while (off + 8 <= buf.length) {
    const tag = buf.toString("ascii", off, off + 4);
    const size = buf.readUInt32LE(off + 4);
    if (tag === "data") return Math.min(size, buf.length - off - 8) / bytesPerSec;
    off += 8 + size + (size % 2);
  }
  return NaN;
}
