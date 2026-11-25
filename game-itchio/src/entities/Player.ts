import Phaser from 'phaser';
import { ASTRAL, PHYSICS, PLAYER } from '../config';
import type { CharacterDef } from '../types';
import { characterKey, type Pose } from '../core/art';

/**
 * The body. One class, three characters; the stats only change numbers.
 */
export class Player extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  readonly def: CharacterDef;
  facing: 1 | -1 = 1;
  projected = false;
  /** Set by the scene when the player is standing on something that moves. */
  private carry = { x: 0, y: 0 };

  private coyote = 0;
  private buffer = 0;
  private jumpHeld = true;
  private walkTimer = 0;
  private pose: Pose = 'idle';
  private glow: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, x: number, y: number, def: CharacterDef) {
    super(scene, x, y, characterKey(def.id, 'idle'));
    this.def = def;
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setOrigin(0.5, 1);
    this.body.setSize(PLAYER.width, PLAYER.height);
    this.body.setOffset((32 - PLAYER.width) / 2, 48 - PLAYER.height);
    this.body.setMaxVelocity(600, PHYSICS.maxFall);
    this.setCollideWorldBounds(false);

    this.glow = scene.add
      .image(x, y - 24, 'glow')
      .setBlendMode(Phaser.BlendModes.SCREEN)
      .setTint(0x8fe6ff)
      .setAlpha(0)
      .setScale(1.1);
  }

  get onGround(): boolean {
    return this.body.blocked.down || this.body.touching.down;
  }

  /** The scene passes the horizontal intent and the two edges. */
  move(dt: number, moveX: number, jumpEdge: boolean, jumpHeld: boolean, speedScale: number): boolean {
    const stats = this.def.stats;
    const speed = PHYSICS.runSpeed * stats.speed * speedScale;
    const target = moveX * speed;
    const rate =
      moveX === 0
        ? this.onGround
          ? PHYSICS.groundDrag
          : PHYSICS.airDrag
        : this.onGround
          ? PHYSICS.groundAccel
          : PHYSICS.airAccel;

    const vx = this.body.velocity.x;
    const step = rate * dt;
    this.body.setVelocityX(
      vx < target ? Math.min(target, vx + step) : Math.max(target, vx - step)
    );

    if (moveX !== 0) this.facing = moveX > 0 ? 1 : -1;
    this.setFlipX(this.facing === -1);

    if (this.onGround) this.coyote = PHYSICS.coyoteMs / 1000;
    else this.coyote = Math.max(0, this.coyote - dt);

    if (jumpEdge) this.buffer = PHYSICS.jumpBufferMs / 1000;
    else this.buffer = Math.max(0, this.buffer - dt);

    let jumped = false;
    if (this.buffer > 0 && this.coyote > 0) {
      this.body.setVelocityY(-PHYSICS.jumpSpeed * stats.jump);
      this.buffer = 0;
      this.coyote = 0;
      jumped = true;
    }

    // Releasing jump early cuts the arc; holding it keeps the full height.
    if (!jumpHeld && this.jumpHeld && this.body.velocity.y < -140) {
      this.body.setVelocityY(this.body.velocity.y * PHYSICS.jumpCut);
    }
    this.jumpHeld = jumpHeld;

    this.applyPose(dt, moveX !== 0, jumped);
    return jumped;
  }

  private applyPose(dt: number, walking: boolean, jumped: boolean): void {
    let next: Pose;
    if (jumped) {
      next = 'jump';
    } else if (!this.onGround) {
      next = this.body.velocity.y < 0 ? 'jump' : 'fall';
    } else if (walking) {
      this.walkTimer += dt;
      next = Math.floor(this.walkTimer / 0.14) % 2 === 0 ? 'walkA' : 'walkB';
    } else {
      this.walkTimer = 0;
      next = 'idle';
    }
    if (next !== this.pose) {
      this.pose = next;
      this.setTexture(characterKey(this.def.id, next));
    }
  }

  setProjected(on: boolean): void {
    this.projected = on;
    this.setAlpha(on ? 0.72 : 1);
    this.glow.setAlpha(on ? 0.55 : 0);
    if (on) this.setTint(0xa8ecff);
    else this.clearTint();
  }

  /** Displacement of the platform under the feet, applied by the scene. */
  carryBy(dx: number, dy: number): void {
    if (dx === 0 && dy === 0) return;
    this.body.position.x += dx;
    this.body.position.y += dy;
  }

  resetCarry(): void {
    this.carry.x = 0;
    this.carry.y = 0;
  }

  get carried(): { x: number; y: number } {
    return this.carry;
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    this.glow.setPosition(this.x, this.y - PLAYER.height / 2 - 4);
  }

  kill(): void {
    this.body.setVelocity(0, 0);
    this.body.enable = false;
    this.setVisible(false);
    this.glow.setVisible(false);
  }

  revive(x: number, y: number): void {
    this.body.enable = true;
    this.setVisible(true);
    this.glow.setVisible(true);
    this.setPosition(x, y);
    this.body.reset(x, y);
    this.setAlpha(this.projected ? 0.72 : 1);
  }

  /** Astral jump feels lighter; the gravity stays the world's. */
  get astralJumpBonus(): number {
    return this.projected ? ASTRAL.jumpBoost : 1;
  }
}
