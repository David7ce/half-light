import Phaser from 'phaser';
import { TILE } from '../config';

/**
 * A shade that patrols a ledge, and a wisp that only exists for the projection.
 * Neither can be fought: the game is about going around them.
 */
export class Walker {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  private direction = 1;
  private readonly speed = 58;

  constructor(scene: Phaser.Scene, x: number, y: number, direction = 1) {
    this.sprite = scene.physics.add.sprite(x, y, 'walker').setOrigin(0.5, 1);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setSize(18, 18);
    body.setOffset(3, 6);
    this.direction = direction;
    this.sprite.setFlipX(direction < 0);
  }

  get x(): number {
    return this.sprite.x;
  }

  get y(): number {
    return this.sprite.y;
  }

  update(solidAt: (x: number, y: number) => boolean): void {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    if (body.blocked.left) this.direction = 1;
    if (body.blocked.right) this.direction = -1;

    // No floor ahead? Turn before walking off the ledge.
    const aheadX = this.sprite.x + this.direction * 16;
    const probeY = this.sprite.y + 6;
    if (!solidAt(aheadX, probeY)) this.direction *= -1;

    this.sprite.setVelocityX(this.speed * this.direction);
    this.sprite.setFlipX(this.direction < 0);
  }

  setAstral(on: boolean): void {
    this.sprite.setAlpha(on ? 0.32 : 1);
    this.sprite.setTint(on ? 0x6fa8ff : 0xffffff);
  }

  get bounds(): Phaser.Geom.Rectangle {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    return new Phaser.Geom.Rectangle(body.x, body.y, body.width, body.height);
  }
}

export class Wisp {
  readonly sprite: Phaser.GameObjects.Image;
  private readonly home: { x: number; y: number };
  private t = 0;
  private readonly phase: number;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.home = { x, y };
    this.phase = (x / TILE) * 0.7;
    this.sprite = scene.add
      .image(x, y, 'wisp')
      .setScale(1.6)
      .setBlendMode(Phaser.BlendModes.SCREEN)
      .setAlpha(0.25);
    scene.tweens.add({
      targets: this.sprite,
      scale: { from: 1.4, to: 1.8 },
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  update(dt: number, astral: boolean): void {
    this.t += dt;
    this.sprite.x = this.home.x + Math.sin(this.t * 1.3 + this.phase) * TILE * 0.9;
    this.sprite.y = this.home.y + Math.cos(this.t * 0.9 + this.phase) * TILE * 0.6;
    this.sprite.setAlpha(astral ? 1 : 0.25);
    this.sprite.setTint(astral ? 0xd8fbff : 0x88b8e8);
  }

  touches(x: number, y: number, radius = 26): boolean {
    return Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, x, y) < radius;
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
