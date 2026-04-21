// Procedural "metal mode" riff played via the Web Audio API.
// No assets on disk — a distorted 4-beat chug loop built from oscillators
// fed through a tanh waveshaper. Plays in parallel with (or in place of)
// KAPLAY's MusicSystem.

type AC = AudioContext;

const BPM = 180;
const BEAT_MS = 60000 / BPM;
const LOOKAHEAD_MS = 100;
const SCHEDULE_AHEAD_S = 0.25;

// Power-chord roots in Hz, one per beat. E2 low-tuning-ish, with a G and D flavour.
const PATTERN: number[] = [
  82.4, 82.4, 82.4, 110.0, // E E E A
  82.4, 82.4, 98.0, 87.3,  // E E G F#
];

let ctx: AC | null = null;
let masterGain: GainNode | null = null;
let shaper: WaveShaperNode | null = null;
let running = false;
let nextNoteTime = 0;
let beatIndex = 0;
let intervalId: number | null = null;

function ensureContext(): AC {
  if (ctx) return ctx;
  const Ctor: typeof AudioContext =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  ctx = new Ctor();

  // Soft-clipping distortion (tanh-ish).
  const curve = new Float32Array(4096);
  for (let i = 0; i < curve.length; i++) {
    const x = (i / curve.length) * 2 - 1;
    curve[i] = Math.tanh(x * 4);
  }
  shaper = ctx.createWaveShaper();
  shaper.curve = curve;
  shaper.oversample = "4x";

  masterGain = ctx.createGain();
  masterGain.gain.value = 0.18;

  shaper.connect(masterGain);
  masterGain.connect(ctx.destination);

  return ctx;
}

function scheduleChord(rootHz: number, startTime: number): void {
  if (!ctx || !shaper) return;
  const duration = (BEAT_MS / 1000) * 0.85;
  // Root + fifth (+7 semitones ≈ x1.4983) + octave (x2)
  const freqs = [rootHz, rootHz * 1.4983, rootHz * 2];

  const chordGain = ctx.createGain();
  chordGain.gain.setValueAtTime(0.0001, startTime);
  chordGain.gain.exponentialRampToValueAtTime(1.0, startTime + 0.01);
  chordGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  chordGain.connect(shaper);

  for (const f of freqs) {
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(f, startTime);
    osc.connect(chordGain);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  }
}

function tick(): void {
  if (!ctx || !running) return;
  const now = ctx.currentTime;
  while (nextNoteTime < now + SCHEDULE_AHEAD_S) {
    scheduleChord(PATTERN[beatIndex % PATTERN.length], nextNoteTime);
    beatIndex += 1;
    nextNoteTime += BEAT_MS / 1000;
  }
}

export function startMetalRiff(): void {
  if (running) return;
  const c = ensureContext();
  if (c.state === "suspended") {
    void c.resume();
  }
  running = true;
  beatIndex = 0;
  nextNoteTime = c.currentTime + 0.05;
  intervalId = window.setInterval(tick, LOOKAHEAD_MS);
}

export function stopMetalRiff(): void {
  running = false;
  if (intervalId !== null) {
    window.clearInterval(intervalId);
    intervalId = null;
  }
  if (masterGain && ctx) {
    const t = ctx.currentTime;
    try {
      masterGain.gain.cancelScheduledValues(t);
      masterGain.gain.setValueAtTime(masterGain.gain.value, t);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
      window.setTimeout(() => {
        if (masterGain) masterGain.gain.value = 0.18;
      }, 250);
    } catch {
      // ignore
    }
  }
}

export function pauseMetalRiff(): void {
  if (!running || !ctx) return;
  void ctx.suspend();
}

export function resumeMetalRiff(): void {
  if (!running || !ctx) return;
  void ctx.resume();
}
