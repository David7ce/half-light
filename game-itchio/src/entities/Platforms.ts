import Phaser from 'phaser';
import { TILE } from '../config';
import type { MoverSpec, SpinnerSpec } from '../types';

/**
 * Kinematic platforms. They move with velocity (so Arcade resolves collisions
 * properly) and the scene carries the player with the frame delta, because
 * Arcade does not stick a body to a moving floor by itself.
 */
export class Carried {
  readonly image: Phaser.Physics.Arcade.Image;
  prevX = 0;
  prevY = 0;

  constructor(image: Phaser.Physics.Arcade.Image) {
    this.image = image;
    this.prevX = image.x;
    this.prevY = image.y;
  }

  get dx(): number {
    return this.image.x - this.prevX;
  }

  get dy(): number {
    return this.image.y - this.prevY;
  }

  commit(): void {
    this.prevX = this.image.x;
    this.prevY = this.image.y;
  }

  /** Is this platform under the given body's feet? */
  supports(body: Phaser.Physics.Arcade.Body): boolean {
    const platform = this.image.body as Phaser.Physics.Arcade.Body;
    const feet = body.bottom;
    const top = platform.top;
    const overlap = Math.min(body.right, platform.right) - Math.max(body.left, platform.left);
    // Feet on the surface, and the body mostly over the pad: a shoulder touching
    // the edge is not a floor.
    return overlap > 8 && feet >= top - 2 && feet <= top + 5;
  }
}

export class MovingPlatform extends Carried {
  private readonly origin: { x: number; y: number };
  private readonly axis: 'x' | 'y';
  private readonly distance: number;
  private direction = 1;
  private readonly speed: number;

  constructor(scene: Phaser.Scene, spec: MoverSpec) {
    const length = (spec.length ?? 3) * TILE;
    const image = scene.physics.add
      .image(spec.tx * TILE, spec.ty * TILE, 'tile-pad')
      .setOrigin(0, 0)
      .setDisplaySize(length, 8);
    const body = image.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);
    body.setSize(length, 8);
    body.setOffset(0, 0);
    super(image);

    this.origin = { x: image.x, y: image.y };
    this.axis = spec.axis;
    this.distance = spec.distance * TILE;
    this.speed = (this.distance * 2) / Math.max(1, spec.period);

    // Start somewhere inside the run so the level does not begin all in sync.
    const offset = ((spec.phase ?? 0) % 1) * this.distance;
    if (this.axis === 'x') image.x += offset * this.direction;
    else image.y -= offset * this.direction;
    body.reset(image.x, image.y);
    this.prevX = image.x;
    this.prevY = image.y;
  }

  update(): void {
    const travelled =
      this.axis === 'x' ? this.image.x - this.origin.x : this.origin.y - this.image.y;
    if (travelled >= this.distance) this.direction = -1;
    if (travelled <= 0) this.direction = 1;
    const velocity = this.speed * this.direction;
    (this.image.body as Phaser.Physics.Arcade.Body).setVelocity(
      this.axis === 'x' ? velocity : 0,
      this.axis === 'y' ? -velocity : 0
    );
  }
}

interface Pad extends Carried {
  angle: number;
}

export class Spinner {
  readonly pads: Pad[] = [];
  readonly hub: Phaser.GameObjects.Image;
  private readonly cx: number;
  private readonly cy: number;
  private readonly radius: number;
  private readonly speed: number;
  private angle = 0;

  constructor(scene: Phaser.Scene, spec: SpinnerSpec) {
    this.cx = spec.tx * TILE;
    this.cy = spec.ty * TILE;
    this.radius = spec.radius * TILE;
    this.speed = (Math.PI * 2) / Math.max(0.5, spec.period);

    this.hub = scene.add
      .image(this.cx, this.cy, 'gear')
      .setScale(1.4)
      .setAlpha(0.75)
      .setDepth(8);

    for (let i = 0; i < spec.pads; i += 1) {
      const image = scene.physics.add.image(this.cx, this.cy, 'tile-pad');
      image.setOrigin(0.5, 0.5);
      image.setDisplaySize(TILE * 2, 8);
      const body = image.body as Phaser.Physics.Arcade.Body;
      body.setAllowGravity(false);
      body.setImmovable(true);
      body.setSize(TILE * 2, 8);
      const pad = new Carried(image) as Pad;
      pad.angle = (Math.PI * 2 * i) / spec.pads;
      this.pads.push(pad);
    }
  }

  update(dt: number): void {
    this.angle += this.speed * dt;
    this.hub.rotation += this.speed * dt * 0.6;
    for (const pad of this.pads) {
      const angle = this.angle + pad.angle;
      const x = this.cx + Math.cos(angle) * this.radius;
      const y = this.cy + Math.sin(angle) * this.radius;
      pad.image.setPosition(x, y);
      pad.image.rotation = angle;
      (pad.image.body as Phaser.Physics.Arcade.Body).reset(x, y);
    }
  }
}
