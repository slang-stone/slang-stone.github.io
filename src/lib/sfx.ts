// Meme-style sound effects, synthesized live with the Web Audio API.
// These are original sounds *inspired by* famous meme audio (vine boom, sad trombone, MLG airhorn…),
// not copies of the recordings — so there are no audio files to license or download.

export type Sfx =
  | 'ding' | 'slide' | 'coin' | 'airhorn' // good
  | 'boom' | 'trombone' | 'buzzer' | 'scratch' // bad
  | 'tada' | 'newBest' | 'blip';

let ctx: AudioContext | null = null;
let enabled = true;
let master: GainNode | null = null;

export function setSoundEnabled(on: boolean) { enabled = on; }

/** Games announce answers; the reaction-pic overlay listens (works even when sound is muted). */
export const REACTION_EVENT = 'slang-reaction';
const react = (kind: 'right' | 'wrong') => window.dispatchEvent(new CustomEvent(REACTION_EVENT, { detail: kind }));

function ac() {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.55;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

const env = (g: GainNode, t: number, peak: number, attack: number, decay: number) => {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
};

function tone(c: AudioContext, type: OscillatorType, freq: number, t: number, dur: number, peak = 0.3, out: AudioNode = master!) {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  env(g, t, peak, 0.01, dur);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + dur + 0.05);
  return o;
}

function noise(c: AudioContext, dur: number) {
  const buf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const s = c.createBufferSource();
  s.buffer = buf;
  return s;
}

function distortion(c: AudioContext, amount: number) {
  const ws = c.createWaveShaper();
  const curve = new Float32Array(1024);
  for (let i = 0; i < curve.length; i++) {
    const x = (i / curve.length) * 2 - 1;
    curve[i] = ((1 + amount) * x) / (1 + amount * Math.abs(x));
  }
  ws.curve = curve;
  return ws;
}

/** Simple generated reverb tail. */
function reverb(c: AudioContext, seconds: number) {
  const len = Math.ceil(c.sampleRate * seconds);
  const buf = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3;
  }
  const conv = c.createConvolver();
  conv.buffer = buf;
  return conv;
}

const SOUNDS: Record<Sfx, (c: AudioContext, t: number) => void> = {
  // bright "correct answer" bell
  ding: (c, t) => { tone(c, 'sine', 1318.5, t, 0.5, 0.35); tone(c, 'sine', 1760, t + 0.09, 0.7, 0.3); tone(c, 'triangle', 3520, t + 0.09, 0.25, 0.05); },
  // ascending slide whistle — the "sheeesh" rise
  slide: (c, t) => {
    const o = c.createOscillator(), g = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(500, t);
    o.frequency.exponentialRampToValueAtTime(1900, t + 0.45);
    lfo.frequency.value = 9; lg.gain.value = 25;
    lfo.connect(lg).connect(o.frequency);
    env(g, t, 0.28, 0.03, 0.7);
    o.connect(g).connect(master!);
    o.start(t); lfo.start(t); o.stop(t + 0.8); lfo.stop(t + 0.8);
  },
  // retro coin pickup
  coin: (c, t) => { tone(c, 'square', 987.8, t, 0.08, 0.12); tone(c, 'square', 1318.5, t + 0.08, 0.35, 0.12); },
  // MLG-style air horn: three blasts of a detuned, distorted chord
  airhorn: (c, t) => {
    const out = c.createGain();
    out.gain.value = 0.22;
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1400; bp.Q.value = 0.6;
    const dist = distortion(c, 30);
    dist.connect(bp).connect(out).connect(master!);
    [0, 0.17, 0.34].forEach((off, k) => {
      const dur = k === 2 ? 0.55 : 0.13;
      for (const f of [466, 470, 587, 698]) {
        const o = c.createOscillator(), g = c.createGain();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(f * 0.94, t + off);
        o.frequency.linearRampToValueAtTime(f, t + off + 0.04);
        g.gain.setValueAtTime(0.0001, t + off);
        g.gain.linearRampToValueAtTime(0.5, t + off + 0.02);
        g.gain.setValueAtTime(0.5, t + off + dur - 0.03);
        g.gain.linearRampToValueAtTime(0.0001, t + off + dur);
        o.connect(g).connect(dist);
        o.start(t + off); o.stop(t + off + dur + 0.02);
      }
    });
  },
  // vine-boom-style bass drop with a distorted thud and a reverb tail
  boom: (c, t) => {
    const rv = reverb(c, 1.6), wet = c.createGain(); wet.gain.value = 0.35;
    rv.connect(wet).connect(master!);
    const o = c.createOscillator(), g = c.createGain(), dist = distortion(c, 8);
    o.type = 'sine';
    o.frequency.setValueAtTime(160, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.5);
    env(g, t, 0.9, 0.005, 1.1);
    o.connect(dist).connect(g);
    g.connect(master!); g.connect(rv);
    o.start(t); o.stop(t + 1.3);
    const n = noise(c, 0.12), ng = c.createGain(), lp = c.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 700;
    env(ng, t, 0.5, 0.002, 0.1);
    n.connect(lp).connect(ng).connect(master!);
    n.start(t);
  },
  // sad trombone: wah, wah, wah, waaaah
  trombone: (c, t) => {
    const notes = [293.7, 277.2, 261.6, 246.9];
    notes.forEach((f, k) => {
      const start = t + k * 0.42, dur = k === 3 ? 1.1 : 0.38;
      const o = c.createOscillator(), g = c.createGain(), lp = c.createBiquadFilter();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(f, start);
      lp.type = 'lowpass'; lp.Q.value = 4;
      lp.frequency.setValueAtTime(350, start);
      lp.frequency.linearRampToValueAtTime(1300, start + 0.12);
      lp.frequency.linearRampToValueAtTime(500, start + dur);
      if (k === 3) {
        const lfo = c.createOscillator(), lg = c.createGain();
        lfo.frequency.value = 6; lg.gain.value = 6;
        lfo.connect(lg).connect(o.frequency);
        lfo.start(start); lfo.stop(start + dur);
      }
      g.gain.setValueAtTime(0.0001, start);
      g.gain.linearRampToValueAtTime(0.22, start + 0.05);
      g.gain.setValueAtTime(0.22, start + dur - 0.08);
      g.gain.linearRampToValueAtTime(0.0001, start + dur);
      o.connect(lp).connect(g).connect(master!);
      o.start(start); o.stop(start + dur + 0.02);
    });
  },
  // game-show wrong-answer buzzer
  buzzer: (c, t) => {
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1800;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.18, t + 0.02);
    g.gain.setValueAtTime(0.18, t + 0.55); g.gain.linearRampToValueAtTime(0.0001, t + 0.62);
    lp.connect(g).connect(master!);
    for (const f of [110, 116.5]) { const o = c.createOscillator(); o.type = 'square'; o.frequency.value = f; o.connect(lp); o.start(t); o.stop(t + 0.65); }
  },
  // record scratch for running out of time
  scratch: (c, t) => {
    const n = noise(c, 0.5), bp = c.createBiquadFilter(), g = c.createGain();
    bp.type = 'bandpass'; bp.Q.value = 3;
    bp.frequency.setValueAtTime(3000, t);
    bp.frequency.exponentialRampToValueAtTime(300, t + 0.18);
    bp.frequency.exponentialRampToValueAtTime(2500, t + 0.32);
    bp.frequency.exponentialRampToValueAtTime(200, t + 0.45);
    env(g, t, 0.6, 0.01, 0.45);
    n.connect(bp).connect(g).connect(master!);
    n.start(t);
  },
  // victory arpeggio
  tada: (c, t) => { [523.3, 659.3, 784, 1046.5].forEach((f, k) => tone(c, 'triangle', f, t + k * 0.09, k === 3 ? 0.7 : 0.2, 0.22)); },
  newBest: (c, t) => { SOUNDS.airhorn(c, t); SOUNDS.tada(c, t + 0.95); },
  blip: (c, t) => { tone(c, 'square', 330, t, 0.08, 0.06); },
};

export function play(name: Sfx) {
  if (!enabled) return;
  try {
    const c = ac();
    if (!c || !master) return;
    SOUNDS[name](c, c.currentTime + 0.01);
  } catch { /* audio is a bonus; never break the game */ }
}

const GOOD: Sfx[] = ['ding', 'slide', 'coin'];
const BAD: Sfx[] = ['boom', 'trombone', 'buzzer'];
let lastGood = -1, lastBad = -1;

/** Right answer. Every 3rd answer in a streak gets the air horn. */
export function playRight(streak = 0) {
  react('right');
  if (streak >= 3 && streak % 3 === 0) return play('airhorn');
  lastGood = (lastGood + 1 + Math.floor(Math.random() * (GOOD.length - 1))) % GOOD.length;
  play(GOOD[lastGood]);
}

/** Wrong answer (rotates so it doesn't get repetitive). Timeouts get a record scratch. */
export function playWrong(timedOut = false) {
  react('wrong');
  if (timedOut) return play('scratch');
  lastBad = (lastBad + 1 + Math.floor(Math.random() * (BAD.length - 1))) % BAD.length;
  play(BAD[lastBad]);
}
