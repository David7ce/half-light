/**
 * Web Audio, no files. The chain is: instruments → music filter → master
 * compressor → speakers, with a generated plate reverb feeding back in.
 *
 * Browsers only allow sound after a gesture, so nothing is created until the
 * title screen is touched or a key is pressed.
 */
export type SfxName =
  | 'jump'
  | 'land'
  | 'astralIn'
  | 'astralOut'
  | 'denied'
  | 'potion'
  | 'shard'
  | 'hurt'
  | 'die'
  | 'save'
  | 'door'
  | 'blip'
  | 'win';

const MASTER = 0.72;

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicFilter: BiquadFilterNode | null = null;
  private reverb: ConvolverNode | null = null;
  private started = false;
  private muted = false;

  get context(): AudioContext | null {
    return this.ctx;
  }

  get running(): boolean {
    return this.started && this.ctx !== null;
  }

  get isMuted(): boolean {
    return this.muted;
  }

  /** Node music instruments connect into; the astral filter lives downstream. */
  get musicInput(): AudioNode | null {
    return this.musicFilter;
  }

  ensure(): AudioContext {
    if (!this.ctx) {
      const Ctor: typeof AudioContext =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctor();
      const master = ctx.createGain();
      master.gain.value = this.muted ? 0 : MASTER;
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -16;
      compressor.knee.value = 20;
      compressor.ratio.value = 3;
      compressor.attack.value = 0.005;
      compressor.release.value = 0.25;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 12000;
      filter.Q.value = 0.4;

      const reverb = ctx.createConvolver();
      reverb.buffer = this.impulse(ctx, 2.6, 2.4);

      const reverbGain = ctx.createGain();
      reverbGain.gain.value = 0.5;

      filter.connect(master);
      reverb.connect(reverbGain).connect(master);
      master.connect(compressor).connect(ctx.destination);

      this.ctx = ctx;
      this.master = master;
      this.musicFilter = filter;
      this.reverb = reverb;
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  start(): void {
    this.ensure();
    this.started = true;
  }

  toggleMute(): boolean {
    this.applyMute(!this.muted);
    return this.muted;
  }

  applyMute(muted: boolean): void {
    this.muted = muted;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(muted ? 0 : MASTER, this.ctx.currentTime, 0.05);
    }
  }

  /** Slow the air down: the music is heard from underwater while projected. */
  setAstral(active: boolean, seconds = 0.35): void {
    if (!this.ctx || !this.musicFilter) return;
    const now = this.ctx.currentTime;
    this.musicFilter.frequency.cancelScheduledValues(now);
    this.musicFilter.frequency.setTargetAtTime(active ? 900 : 12000, now, seconds / 3);
  }

  private impulse(ctx: AudioContext, seconds: number, decay: number): AudioBuffer {
    const length = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let channel = 0; channel < 2; channel += 1) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < length; i += 1) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }
    return buffer;
  }

  private send(node: AudioNode, amount: number): void {
    if (!this.reverb) return;
    const gain = this.ctx!.createGain();
    gain.gain.value = amount;
    node.connect(gain).connect(this.reverb);
  }

  /** A single enveloped oscillator; the building block of every sound here. */
  tone(options: {
    freq: number;
    to?: number;
    type?: OscillatorType;
    dur?: number;
    gain?: number;
    delay?: number;
    attack?: number;
    wet?: number;
    filter?: number;
    detune?: number;
    /** Absolute AudioContext time, used by the sequencer. */
    at?: number;
  }): void {
    if (!this.ctx || !this.musicFilter) return;
    const {
      freq,
      to = freq,
      type = 'sine',
      dur = 0.2,
      gain = 0.16,
      delay = 0,
      attack = 0.008,
      wet = 0,
      filter,
      detune = 0,
      at,
    } = options;
    const ctx = this.ctx;
    const start = at ?? ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (to !== freq) osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), start + dur);
    osc.detune.value = detune;

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, start);
    env.gain.exponentialRampToValueAtTime(gain, start + attack);
    env.gain.exponentialRampToValueAtTime(0.0001, start + dur);

    let last: AudioNode = osc;
    if (filter) {
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = filter;
      last.connect(lp);
      last = lp;
    }
    last.connect(env);
    env.connect(this.musicFilter);
    if (wet > 0) this.send(env, wet);

    osc.start(start);
    osc.stop(start + dur + 0.03);
  }

  noise(dur = 0.25, gain = 0.12, cutoff = 1400, delay = 0, at?: number): void {
    if (!this.ctx || !this.musicFilter) return;
    const ctx = this.ctx;
    const start = at ?? ctx.currentTime + delay;
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;
    const env = ctx.createGain();
    env.gain.setValueAtTime(gain, start);
    env.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    source.connect(filter).connect(env).connect(this.musicFilter);
    source.start(start);
  }

  sfx(name: SfxName): void {
    if (!this.ctx) return;
    switch (name) {
      case 'jump':
        this.tone({ freq: 300, to: 520, type: 'triangle', dur: 0.16, gain: 0.1 });
        break;
      case 'land':
        this.noise(0.09, 0.1, 700);
        this.tone({ freq: 120, to: 70, type: 'sine', dur: 0.12, gain: 0.12 });
        break;
      case 'astralIn':
        this.tone({ freq: 220, to: 880, type: 'sine', dur: 0.5, gain: 0.1, wet: 0.5 });
        this.tone({ freq: 330, to: 1320, type: 'triangle', dur: 0.6, gain: 0.05, wet: 0.6 });
        this.noise(0.4, 0.05, 2600);
        break;
      case 'astralOut':
        this.tone({ freq: 660, to: 165, type: 'sine', dur: 0.34, gain: 0.1, wet: 0.4 });
        break;
      case 'denied':
        this.tone({ freq: 190, to: 150, type: 'square', dur: 0.1, gain: 0.06 });
        break;
      case 'potion':
        this.tone({ freq: 620, type: 'sine', dur: 0.1, gain: 0.1 });
        this.tone({ freq: 930, type: 'sine', dur: 0.16, gain: 0.09, delay: 0.07 });
        break;
      case 'shard':
        this.tone({ freq: 1046, type: 'sine', dur: 0.2, gain: 0.1, wet: 0.4 });
        this.tone({ freq: 1568, type: 'sine', dur: 0.34, gain: 0.08, delay: 0.09, wet: 0.5 });
        break;
      case 'hurt':
        this.tone({ freq: 240, to: 90, type: 'sawtooth', dur: 0.24, gain: 0.13 });
        this.noise(0.2, 0.1, 900);
        break;
      case 'die':
        this.tone({ freq: 320, to: 60, type: 'sawtooth', dur: 0.8, gain: 0.16, wet: 0.3 });
        this.noise(0.6, 0.12, 600);
        break;
      case 'save':
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, index) => {
          this.tone({ freq, type: 'sine', dur: 0.7, gain: 0.07, delay: index * 0.09, wet: 0.5 });
        });
        break;
      case 'door':
        this.tone({ freq: 110, to: 330, type: 'triangle', dur: 1.1, gain: 0.12, wet: 0.4 });
        this.noise(0.9, 0.07, 1200);
        break;
      case 'blip':
        this.tone({ freq: 520, type: 'square', dur: 0.045, gain: 0.035 });
        break;
      case 'win':
        [392, 523.25, 659.25, 783.99, 1046.5].forEach((freq, index) => {
          this.tone({ freq, type: 'triangle', dur: 0.9, gain: 0.08, delay: index * 0.13, wet: 0.5 });
        });
        break;
    }
  }
}

export const audio = new AudioEngine();
