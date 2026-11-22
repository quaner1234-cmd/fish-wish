// The voice's arc across the story (D-009). At first the face speaks through a
// "costume": a lower shadow voice under it and the hollow ring of the clay jar.
// By the end the costume is gone and one clear, gentle voice is left.
// Used by voice-gen.mjs (the performance) and voice-encode.mjs (the mix).

const CHARACTER =
  "Character: the face painted inside a clay basin that has covered a small child's burial jar for six thousand years. " +
  "It is not a monster. It is an old guardian made out of love, and it has waited a long time in the dark. " +
  "The listener is the child.";

export const ACTS = {
  dig: {
    scene: "Deep in the earth, it wakes because someone is digging above. It has not spoken for thousands of years.",
    guidance: "A dry, faint, hushed whisper, half asleep, close to the ear. Uncanny and ancient, a little unsettling.",
    costume: 1,
  },
  inside: {
    scene: "The child's light finds its face in the dark. It knows the child may be afraid of it.",
    guidance: "A close, breathy whisper. Still strange and eerie, but it is trying to calm the child.",
    costume: 0.75,
  },
  hole: {
    scene: "It tells the child about the small hole the father made in the basin.",
    guidance: "A softer, warmer murmur, explaining gently, with a little sadness.",
    costume: 0.45,
  },
  ascent: {
    scene: "Rising into the dawn, it remembers the house and the mother who lit the fire every morning.",
    guidance: "A quiet, warm, remembering voice, tender and a little sad, almost no whisper now.",
    costume: 0.25,
  },
  again: {
    scene: "In warm light it lets the child look at it again, and finally says what it really is.",
    guidance: "A clear, gentle, loving voice, soft and close, no whisper and no eeriness at all.",
    costume: 0.1,
  },
};

/** Which act each story line belongs to. */
export const ACT_OF = {
  digSomeone: "dig",
  digLong: "dig",
  digCareful: "dig",
  thereYouAre: "inside",
  dontBeAfraid: "inside",
  motherMade: "inside",
  fishToHold: "inside",
  fatherHole: "hole",
  motherSoul: "hole",
  fatherBreathe: "hole",
  followLight: "hole",
  notTheField: "ascent",
  byTheDoor: "ascent",
  everyMorning: "ascent",
  lookAgain: "again",
  eyesClosed: "again",
  promise: "again",
  stillDoes: "again",
};

/** Lines that turn the arc: the costume comes off on these. */
const COSTUME_OVERRIDE = { promise: 0, stillDoes: 0 };

export const costumeOf = (id) => COSTUME_OVERRIDE[id] ?? ACTS[ACT_OF[id]].costume;

/** Extra direction for single lines that a whisper tends to blur. */
const LINE_NOTE = {
  digSomeone: "Articulate the word 'digging' clearly, with a distinct 'd' and a hard 'g'.",
};

export function direction(id) {
  const act = ACTS[ACT_OF[id]];
  if (!act) throw new Error(`No act for line: ${id}`);
  return (
    `${CHARACTER} Scene: ${act.scene} Guidance: ${act.guidance} ` +
    "Speak at a slow, unhurried pace, but keep the sentence flowing; short natural pauses only, no long gaps." +
    (LINE_NOTE[id] ? ` ${LINE_NOTE[id]}` : "")
  );
}

/** The text sent to the voice. A leading ellipsis is a visual pause; it is not read. */
export const spokenText = (line) => line.replace(/^[\s.…]+/, "").replace(/^\w/, (c) => c.toUpperCase());
