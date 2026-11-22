/**
 * Every sound is synthesised here with Web Audio: no audio files, no licences,
 * nothing to download. Two slow chords sit under the level and cross-fade when
 * the player changes state, so the shift is audible before it is visible.
 *
 * The context is created on the first user gesture (Enter or a click on the
 * title), which is what browsers require; nothing plays before that.
 */
export type Mode = 'alive' | 'ghost';

interface ToneOptions {
  freq: number;
  to?: number;
  type?: OscillatorType;
  dur?: number;
  gain?: number;
  delay?: number;
}

let context: AudioContext | null = null;
let master: GainNode | null = null;
let ambientAlive: GainNode | null = null;
let ambientGhost: GainNode | null = null;
let started = false;
let muted = false;
let mode: Mode = 'alive';

const MASTER_GAIN = 0.55;

function ensure(): AudioContext {
  if (!context) {
    context = new AudioContext();
    master = context.createGain();
    master.gain.value = muted ? 0 : MASTER_GAIN;
    master.connect(context.destination);
  }
  if (context.state === 'suspended') void context.resume();
  return context;
}

function tone(options: ToneOptions): void {
  const c = ensure();
  if (!master) return;
  const { freq, to = freq, type = 'sine', dur = 0.2, gain = 0.18, delay = 0 } = options;
  const start = c.currentTime + delay;
  const osc = c.createOscillator();
  const env = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), start + dur);
  env.gain.setValueAtTime(0.0001, start);
  env.gain.exponentialRampToValueAtTime(gain, start + 0.012);
  env.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(env).connect(master);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

function noise(dur = 0.3): void {
  const c = ensure();
  if (!master) return;
  const buffer = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;

  const source = c.createBufferSource();
  source.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 900;
  const env = c.createGain();
  env.gain.setValueAtTime(0.18, c.currentTime);
  env.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
  source.connect(filter).connect(env).connect(master);
  source.start();
}

function chord(freqs: number[], gain: number): GainNode {
  const c = ensure();
  const bus = c.createGain();
  bus.gain.value = gain;
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 700;
  filter.Q.value = 0.6;
  bus.connect(filter).connect(master!);

  freqs.forEach((freq, index) => {
    const osc = c.createOscillator();
    osc.type = index === 0 ? 'triangle' : 'sine';
    osc.frequency.value = freq;
    osc.detune.value = index * 4 - 4;
    const voice = c.createGain();
    voice.gain.value = 0.5 / freqs.length;
    osc.connect(voice).connect(bus);
    osc.start();

    // A slow breathing LFO per voice keeps it from sounding like a test tone.
    const lfo = c.createOscillator();
    lfo.frequency.value = 0.05 + index * 0.017;
    const lfoGain = c.createGain();
    lfoGain.gain.value = 0.22 / freqs.length;
    lfo.connect(lfoGain).connect(voice.gain);
    lfo.start();
  });

  return bus;
}

/** Idempotent: called on the title's Enter/click and again on scene create. */
export function startAudio(): void {
  if (started) return;
  ensure();
  if (!master) return;
  started = true;
  // A warm fifth for the living, a cold tritone for the dead.
  ambientAlive = chord([110, 164.81, 220], 0.05);
  ambientGhost = chord([98, 138.59, 196], 0.045);
  ambientGhost.gain.value = 0;
  if (mode === 'ghost') {
    ambientAlive.gain.value = 0;
    ambientGhost.gain.value = 0.045;
  }
}

export function setAudioMode(next: Mode): void {
  mode = next;
  if (!context || !ambientAlive || !ambientGhost) return;
  const now = context.currentTime;
  const alive = next === 'alive';
  ambientAlive.gain.cancelScheduledValues(now);
  ambientGhost.gain.cancelScheduledValues(now);
  ambientAlive.gain.setTargetAtTime(alive ? 0.05 : 0, now, 0.18);
  ambientGhost.gain.setTargetAtTime(alive ? 0 : 0.045, now, 0.18);
}

export function toggleMute(): boolean {
  muted = !muted;
  if (master) master.gain.value = muted ? 0 : MASTER_GAIN;
  return muted;
}

export function isMuted(): boolean {
  return muted;
}

/** For the dev hook and for a browser check; not used by gameplay. */
export function audioState(): { started: boolean; state: string; muted: boolean } {
  return { started, state: context?.state ?? 'none', muted };
}

export type Sfx = 'shift' | 'echo' | 'death' | 'deny' | 'win';

export function playSfx(name: Sfx): void {
  if (!started) return;
  switch (name) {
    case 'shift':
      tone({ freq: 520, to: 150, type: 'triangle', dur: 0.22, gain: 0.16 });
      noise(0.12);
      break;
    case 'echo':
      tone({ freq: 880, type: 'sine', dur: 0.12, gain: 0.14 });
      tone({ freq: 1320, type: 'sine', dur: 0.22, gain: 0.12, delay: 0.09 });
      break;
    case 'death':
      tone({ freq: 220, to: 55, type: 'sawtooth', dur: 0.4, gain: 0.2 });
      noise(0.35);
      break;
    case 'deny':
      tone({ freq: 180, to: 140, type: 'square', dur: 0.12, gain: 0.1 });
      break;
    case 'win':
      tone({ freq: 523.25, type: 'sine', dur: 0.5, gain: 0.14 });
      tone({ freq: 659.25, type: 'sine', dur: 0.5, gain: 0.12, delay: 0.12 });
      tone({ freq: 783.99, type: 'sine', dur: 0.7, gain: 0.12, delay: 0.24 });
      break;
  }
}
