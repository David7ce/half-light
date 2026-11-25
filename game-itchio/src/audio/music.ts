/**
 * A small step sequencer: 16th notes, four bars of loop, scheduled ahead of the
 * clock so the timing does not depend on the frame rate. Each chapter has its
 * own progression; the astral state adds a high shimmer and the engine closes
 * the filter, so shifting is audible before it is visible.
 */
import { audio } from './engine';
import type { ThemeId } from '../types';

interface Theme {
  bpm: number;
  /** One chord per bar, as MIDI note numbers. */
  chords: number[][];
  /** A bell line, one entry per 16th, 0 = rest. Loops every four bars. */
  melody: number[];
  hat: number;
  arp: number;
  lead: number;
}

const THEMES: Record<ThemeId, Theme> = {
  menu: {
    bpm: 54,
    chords: [
      [57, 60, 64, 67],
      [53, 57, 60, 65],
      [48, 52, 55, 60],
      [55, 59, 62, 67],
    ],
    melody: [0, 0, 0, 0, 76, 0, 0, 0, 0, 0, 72, 0, 0, 0, 0, 0],
    hat: 0.12,
    arp: 0.35,
    lead: 0.75,
  },
  threshold: {
    bpm: 62,
    chords: [
      [50, 53, 57, 64],
      [46, 50, 53, 58],
      [53, 57, 60, 65],
      [48, 52, 55, 60],
    ],
    melody: [0, 0, 0, 0, 0, 74, 0, 0, 0, 0, 0, 72, 0, 0, 69, 0],
    hat: 0.25,
    arp: 0.55,
    lead: 1,
  },
  wheels: {
    bpm: 78,
    chords: [
      [55, 58, 62],
      [51, 55, 58],
      [48, 51, 55],
      [50, 54, 57],
    ],
    melody: [0, 70, 0, 74, 0, 0, 77, 0, 0, 75, 0, 74, 0, 70, 0, 0],
    hat: 0.5,
    arp: 0.75,
    lead: 0.9,
  },
  tower: {
    bpm: 66,
    chords: [
      [57, 60, 64],
      [53, 57, 60],
      [48, 52, 55],
      [55, 59, 62],
    ],
    melody: [0, 0, 76, 0, 0, 74, 0, 0, 72, 0, 0, 71, 0, 0, 69, 0],
    hat: 0.35,
    arp: 0.6,
    lead: 1,
  },
  finale: {
    bpm: 58,
    chords: [
      [50, 54, 57, 62],
      [45, 49, 52, 57],
      [47, 50, 54, 59],
      [43, 47, 50, 55],
    ],
    melody: [0, 0, 74, 78, 0, 0, 81, 0, 0, 78, 0, 74, 0, 0, 0, 0],
    hat: 0.2,
    arp: 0.45,
    lead: 1.1,
  },
};

function hz(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

class Music {
  private theme: Theme | null = null;
  private themeId: ThemeId | null = null;
  private step = 0;
  private nextTime = 0;
  private timer: number | null = null;
  private astral = false;
  private volume = 1;

  play(id: ThemeId): void {
    if (this.themeId === id && this.timer !== null) return;
    this.themeId = id;
    this.theme = THEMES[id];
    this.step = 0;
    this.nextTime = (audio.context?.currentTime ?? 0) + 0.06;
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = window.setInterval(() => this.tick(), 25);
    this.tick();
  }

  stop(): void {
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
    this.theme = null;
    this.themeId = null;
  }

  setAstral(active: boolean): void {
    this.astral = active;
  }

  /** 0..1, used by the title card and the ending. */
  setVolume(value: number): void {
    this.volume = Math.max(0, Math.min(1, value));
  }

  private tick(): void {
    const ctx = audio.context;
    if (!ctx || !this.theme) return;
    if (this.nextTime < ctx.currentTime) this.nextTime = ctx.currentTime + 0.05;
    while (this.nextTime < ctx.currentTime + 0.18) {
      this.schedule(this.step, this.nextTime);
      const stepSeconds = 60 / this.theme.bpm / 4;
      this.nextTime += stepSeconds;
      this.step = (this.step + 1) % 64;
    }
  }

  private schedule(step: number, time: number): void {
    const theme = this.theme;
    if (!theme) return;
    const ctx = audio.context;
    if (!ctx) return;
    const beat = 60 / theme.bpm;
    const bar = Math.floor(step / 16) % theme.chords.length;
    const chord = theme.chords[bar];
    const gain = this.volume;

    if (step % 16 === 0) {
      // Pad: two detuned voices per note, long attack, big tail.
      const dur = beat * 4.2;
      for (const note of chord) {
        for (const detune of [-7, 7]) {
          audio.tone({
            freq: hz(note),
            type: 'sawtooth',
            dur,
            gain: 0.024 * gain,
            attack: 0.9,
            filter: this.astral ? 700 : 1500,
            wet: 0.55,
            detune,
            at: time,
          });
        }
      }
      // Bass, once per bar.
      audio.tone({
        freq: hz(chord[0] - 12),
        type: 'triangle',
        dur: beat * 2.2,
        gain: 0.11 * gain,
        attack: 0.02,
        wet: 0.1,
        at: time,
      });
    }

    if (step % 8 === 4) {
      audio.tone({
        freq: hz(chord[0] - 12),
        type: 'sine',
        dur: beat * 0.9,
        gain: 0.06 * gain,
        at: time + beat * 0.02,
      });
    }

    // Arpeggio, quiet and steady.
    const arpNote = chord[step % chord.length] + (this.astral ? 24 : 12);
    audio.tone({
      freq: hz(arpNote),
      type: 'triangle',
      dur: beat * 0.45,
      gain: 0.035 * theme.arp * gain,
      wet: 0.3,
      at: time,
    });

    // Bell line.
    const note = theme.melody[step % theme.melody.length];
    if (note > 0 && step % 2 === 0) {
      audio.tone({
        freq: hz(note + (this.astral ? 12 : 0)),
        type: 'sine',
        dur: beat * 2.4,
        gain: 0.052 * theme.lead * gain,
        attack: 0.005,
        wet: 0.7,
        at: time,
      });
      audio.tone({
        freq: hz(note + 12),
        type: 'sine',
        dur: beat * 1.2,
        gain: 0.016 * theme.lead * gain,
        wet: 0.8,
        at: time,
      });
    }

    // Astral shimmer: high, slow, and only while projected.
    if (this.astral) {
      const shimmer = chord[step % chord.length] + 36;
      audio.tone({
        freq: hz(shimmer),
        type: 'sine',
        dur: beat * 3,
        gain: 0.018 * gain,
        attack: 0.4,
        wet: 0.9,
        at: time,
      });
    }

    // A brush, not a drum kit.
    if (step % 4 === 2 && theme.hat > 0) {
      audio.noise(0.035, 0.014 * theme.hat * gain, 3600, 0, time);
    }
  }
}

export const music = new Music();
