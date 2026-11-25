/**
 * Tuning lives here, not scattered through the scenes: a change to how the game
 * feels should be one number in one file. Sizes are in pixels of the 960×540
 * canvas; the art is drawn in 16-pixel units at 2×, so a tile is 32 px.
 */
export const TILE = 32;
/** One art unit: every pixel-art sprite is drawn in units and scaled by this. */
export const UNIT = 2;

export const VIEW_W = 960;
export const VIEW_H = 540;

export const PHYSICS = {
  gravity: 2000,
  maxFall: 980,
  runSpeed: 235,
  groundAccel: 2400,
  airAccel: 1500,
  groundDrag: 2600,
  airDrag: 320,
  jumpSpeed: 680,
  jumpCut: 0.42,
  /** Grace after leaving a ledge during which a jump still counts. */
  coyoteMs: 110,
  /** A jump pressed this early before landing is remembered. */
  jumpBufferMs: 130,
} as const;

export const ASTRAL = {
  /** >1 slows the whole world; the player gets a compensating multiplier. */
  worldTimeScale: 2.5,
  /** While projected the avatar moves this much faster than the slowed world. */
  speedBoost: 1.55,
  jumpBoost: 1.12,
  /** Energy per second while projected. */
  drain: 24,
  /** Energy per second while material, once the cooldown has passed. */
  regen: 18,
  /** Seconds after leaving projection before regeneration starts. */
  regenDelay: 0.9,
  /** Seconds locked out after the bar empties on its own. */
  burnoutMs: 1600,
  /** Shards restore a little energy the moment they are touched. */
  shardEnergy: 8,
  /** Potion sizes. */
  potionEnergy: 45,
  potionHealth: 1,
  /** Flight: holding jump while projected rises at flySpeed. */
  flySpeed: 215,
  /** Fraction of gravity that still applies while projected (0 = none). */
  flyGravity: 0.35,
} as const;

export const PLAYER = {
  width: 20,
  height: 44,
  /** Invulnerability after a hit, in milliseconds. */
  hurtMs: 1100,
  knockback: 260,
  knockLift: 300,
} as const;

export const SAVE_KEY = 'game-itchio.save.v1';
export const SETTINGS_KEY = 'game-itchio.settings.v1';

export const DEPTH = {
  sky: 0,
  stars: 1,
  far: 2,
  tiles: 10,
  astralGlow: 9,
  platforms: 12,
  actors: 20,
  player: 25,
  /** Astral-only geometry is drawn over the body, as if it were a veil. */
  astralOverlay: 34,
  fx: 30,
  fog: 40,
  hud: 100,
} as const;
