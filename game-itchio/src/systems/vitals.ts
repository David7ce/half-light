import { ASTRAL } from '../config';
import type { CharacterStats } from '../types';

/**
 * Health and the astral bar. Kept free of Phaser so it can be reasoned about (and
 * tested) on its own.
 */
export class Vitals {
  hp: number;
  readonly maxHp: number;
  energy: number;
  readonly maxEnergy: number;
  private readonly drain: number;
  private readonly regen: number;
  private cooldown = 0;

  constructor(stats: CharacterStats, hp = stats.maxHp, energy = stats.maxEnergy) {
    this.maxHp = stats.maxHp;
    this.maxEnergy = stats.maxEnergy;
    this.drain = ASTRAL.drain * stats.drain;
    this.regen = ASTRAL.regen * stats.regen;
    this.hp = Math.max(1, Math.min(hp, this.maxHp));
    this.energy = Math.max(0, Math.min(energy, this.maxEnergy));
  }

  update(dt: number, projected: boolean): void {
    if (projected) {
      this.energy = Math.max(0, this.energy - this.drain * dt);
      this.cooldown = ASTRAL.regenDelay;
      return;
    }
    if (this.cooldown > 0) {
      this.cooldown = Math.max(0, this.cooldown - dt);
      return;
    }
    this.energy = Math.min(this.maxEnergy, this.energy + this.regen * dt);
  }

  get ratio(): number {
    return this.energy / this.maxEnergy;
  }

  spend(amount: number): boolean {
    if (this.energy < amount) return false;
    this.energy -= amount;
    return true;
  }

  refillEnergy(amount: number): void {
    this.energy = Math.min(this.maxEnergy, this.energy + amount);
  }

  heal(amount: number): void {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  hurt(amount = 1): boolean {
    if (this.hp <= 0) return false;
    this.hp = Math.max(0, this.hp - amount);
    return this.hp === 0;
  }
}
