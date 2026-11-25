import { ASTRAL } from '../config';
import type { Bus } from '../core/events';
import type { Vitals } from './vitals';

/**
 * Hold SHIFT to leave the body. The world slows to a crawl, walls stop being
 * walls, and the bar pays for every second. Emptying it locks projection for a
 * moment, so the bar is a budget, not a cooldown.
 */
export class AstralSystem {
  active = false;
  private burnout = 0;
  private lastWant = false;
  private readonly vitals: Vitals;
  private readonly bus: Bus;

  constructor(vitals: Vitals, bus: Bus) {
    this.vitals = vitals;
    this.bus = bus;
  }

  /** Multiplier the player applies to its own speed while projected. */
  get speedScale(): number {
    return this.active ? ASTRAL.speedBoost : 1;
  }

  get locked(): boolean {
    return this.burnout > 0;
  }

  /**
   * `canMaterialise` is false while the body is inside a wall; the projection
   * then holds until the player is somewhere a body fits.
   */
  update(dt: number, want: boolean, canMaterialise: boolean): void {
    if (this.burnout > 0) {
      this.burnout = Math.max(0, this.burnout - dt);
      want = false;
    }

    if (want && !this.active) {
      if (!this.enter()) {
        if (!this.lastWant) this.bus.emit('astral:denied', { reason: 'empty' });
        this.vitals.update(dt, false);
        this.lastWant = want;
        return;
      }
    }

    if (!want && this.active && canMaterialise) {
      this.active = false;
      this.bus.emit('astral:exit', { reason: 'manual' });
    }

    this.vitals.update(dt, this.active);
    this.bus.emit('energy:changed', { value: this.vitals.energy, max: this.vitals.maxEnergy });

    if (this.active && this.vitals.energy <= 0) {
      this.active = false;
      this.burnout = ASTRAL.burnoutMs / 1000;
      this.bus.emit('astral:exit', { reason: 'empty' });
      this.bus.emit('astral:denied', { reason: 'burnout' });
    }

    this.lastWant = want;
  }

  /** Used on death and on level changes: no projection survives either. */
  forceExit(reason: 'hurt' | 'level'): void {
    if (!this.active) return;
    this.active = false;
    this.bus.emit('astral:exit', { reason });
  }

  private enter(): boolean {
    if (this.active) return true;
    if (this.burnout > 0) return false;
    if (this.vitals.energy < 4) return false;
    this.active = true;
    this.bus.emit('astral:enter', { free: false });
    return true;
  }
}
