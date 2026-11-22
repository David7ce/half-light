import Phaser from 'phaser';
import { COLS, ROWS, TILE, centre, parseLevel, type TileKind } from '../level';
import { consumeJump, consumeShift, touch } from '../touch';

type Mode = 'alive' | 'ghost';

interface Palette {
  bg: number;
  floor: number;
  floorTop: number;
  wall: number;
  wallTop: number;
  furniture: number;
  furnitureTop: number;
  salt: number;
  player: number;
  echo: number;
  door: number;
  doorOpen: number;
}

const PALETTE: Record<Mode, Palette> = {
  alive: {
    bg: 0x15110d,
    floor: 0x2a241c,
    floorTop: 0x3b3327,
    wall: 0x4b4234,
    wallTop: 0x645541,
    furniture: 0x6a4a2e,
    furnitureTop: 0x8f6639,
    salt: 0xefe9dc,
    player: 0xe8b06a,
    echo: 0xffd166,
    door: 0x5a6b4a,
    doorOpen: 0xa8d58a,
  },
  ghost: {
    bg: 0x070d14,
    floor: 0x16232f,
    floorTop: 0x1e3142,
    wall: 0x2b5a78,
    wallTop: 0x3f7ea3,
    furniture: 0x244a63,
    furnitureTop: 0x356f8f,
    salt: 0xbfe9ff,
    player: 0x9fd8ff,
    echo: 0x8ef2c0,
    door: 0x274a3c,
    doorOpen: 0x6fe0a0,
  },
};

const GHOST_ALPHA = 0.34;
const WORLD_W = COLS * TILE;
const WORLD_H = ROWS * TILE;
const SPEED = { alive: 210, ghost: 160 };
const JUMP = { alive: -520, ghost: -430 };

export class GameScene extends Phaser.Scene {
  private mode: Mode = 'alive';
  private player!: Phaser.GameObjects.Rectangle;
  private body!: Phaser.Physics.Arcade.Body;
  private floorTiles: Phaser.GameObjects.Rectangle[] = [];
  private wallTiles: Phaser.GameObjects.Rectangle[] = [];
  private furnitureTiles: Phaser.GameObjects.Rectangle[] = [];
  private saltZones: Phaser.GameObjects.Rectangle[] = [];
  private saltDecor: Phaser.GameObjects.Rectangle[] = [];
  private echoes: Phaser.GameObjects.Arc[] = [];
  private door!: Phaser.GameObjects.Rectangle;
  private doorInner!: Phaser.GameObjects.Rectangle;
  private hud!: Phaser.GameObjects.Text;
  private spawn = new Phaser.Math.Vector2();
  private wallCollider!: Phaser.Physics.Arcade.Collider;
  private furnitureCollider!: Phaser.Physics.Arcade.Collider;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<'A' | 'D' | 'W', Phaser.Input.Keyboard.Key>;
  private shiftQueued = false;
  private jumpQueued = false;
  private dead = false;
  private won = false;
  private doorHintShown = false;
  private banner = document.getElementById('banner')!;
  private hint = document.getElementById('hint')!;

  constructor() {
    super('game');
  }

  create(): void {
    const level = parseLevel();
    this.spawn.set(centre(level.spawn).x, level.spawn.y * TILE + TILE - 15);
    this.mode = 'alive';
    this.dead = false;
    this.won = false;
    this.doorHintShown = false;
    this.floorTiles = [];
    this.wallTiles = [];
    this.furnitureTiles = [];
    this.saltZones = [];
    this.saltDecor = [];
    this.echoes = [];
    this.banner.hidden = true;
    this.hint.hidden = false;

    this.buildTiles(level.tiles);
    this.buildPieces(level);
    this.buildPlayer();
    this.buildColliders();
    this.buildInput();
    this.buildHud();
    this.applyPalette();
    this.updateHud();
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H + 200);
  }

  private buildTiles(tiles: { kind: TileKind; x: number; y: number }[]): void {
    const solid = new Set<string>();
    for (const tile of tiles) {
      if (tile.kind === 'floor' || tile.kind === 'wall' || tile.kind === 'furniture') {
        solid.add(`${tile.x},${tile.y}`);
      }
    }

    for (const tile of tiles) {
      const x = tile.x * TILE + TILE / 2;
      const y = tile.y * TILE + TILE / 2;

      if (tile.kind === 'salt') {
        const zone = this.add.rectangle(x, y, TILE, TILE, 0xffffff, 0);
        this.physics.add.existing(zone, true);
        this.saltZones.push(zone);
        const strand = this.add.rectangle(x + (tile.x % 2 === 0 ? -8 : 8), y, 3, TILE, 0xffffff);
        strand.setData('kind', 'salt');
        this.saltDecor.push(strand);
        continue;
      }

      const rect = this.add.rectangle(x, y, TILE, TILE, 0xffffff);
      rect.setData('kind', tile.kind);
      rect.setData('tx', tile.x);
      rect.setData('ty', tile.y);
      this.physics.add.existing(rect, true);

      if (tile.kind === 'floor') this.floorTiles.push(rect);
      if (tile.kind === 'wall') this.wallTiles.push(rect);
      if (tile.kind === 'furniture') this.furnitureTiles.push(rect);

      // A lighter lip on every surface you can stand on: without it the
      // monochrome tiles read as one slab at a glance.
      if (!solid.has(`${tile.x},${tile.y - 1}`)) {
        const lip = this.add.rectangle(x, y - TILE / 2 + 2, TILE, 4, 0xffffff);
        lip.setData('kind', tile.kind === 'wall' ? 'wallTop' : 'floorTop');
        lip.setData('lip', true);
      }
    }
  }

  private buildPieces(level: ReturnType<typeof parseLevel>): void {
    const doorPos = centre(level.door);
    this.door = this.add.rectangle(doorPos.x, doorPos.y, 24, 44, 0xffffff);
    this.doorInner = this.add.rectangle(doorPos.x, doorPos.y, 12, 30, 0x000000, 0.55);
    this.door.setData('kind', 'door');
    this.physics.add.existing(this.door, true);

    for (const echo of level.echoes) {
      const pos = centre(echo);
      const orb = this.add.circle(pos.x, pos.y, 9, 0xffffff);
      orb.setData('kind', 'echo');
      this.physics.add.existing(orb, true);
      this.echoes.push(orb);
      this.tweens.add({
        targets: orb,
        alpha: { from: 1, to: 0.45 },
        scale: { from: 1, to: 1.25 },
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });
    }
  }

  private buildPlayer(): void {
    this.player = this.add.rectangle(this.spawn.x, this.spawn.y, 20, 28, 0xffffff);
    this.player.setDepth(5);
    this.physics.add.existing(this.player);
    this.body = this.player.body as Phaser.Physics.Arcade.Body;
    this.body.setSize(20, 28);
    this.body.setMaxVelocity(420, 900);
  }

  private buildColliders(): void {
    this.physics.add.collider(this.player, this.floorTiles);
    this.wallCollider = this.physics.add.collider(this.player, this.wallTiles);
    this.furnitureCollider = this.physics.add.collider(this.player, this.furnitureTiles);

    this.physics.add.overlap(this.player, this.saltZones, () => {
      if (this.mode === 'ghost' && !this.dead && !this.won) this.die();
    });

    this.physics.add.overlap(this.player, this.echoes, (_player, orb) => this.collect(orb as Phaser.GameObjects.Arc));

    this.physics.add.overlap(this.player, this.door, () => this.tryDoor());
  }

  private buildInput(): void {
    const keyboard = this.input.keyboard!;
    this.cursors = keyboard.createCursorKeys();
    this.keys = keyboard.addKeys('A,D,W') as Record<'A' | 'D' | 'W', Phaser.Input.Keyboard.Key>;
    this.shiftQueued = false;
    this.jumpQueued = false;

    // Queued on the event, not polled: a tap shorter than one frame still
    // counts, which is what a quick Shift press on a keyboard actually is.
    keyboard.on('keydown-SHIFT', () => {
      this.shiftQueued = true;
    });
    keyboard.on('keydown-SPACE', () => {
      this.jumpQueued = true;
    });
    keyboard.on('keydown-UP', () => {
      this.jumpQueued = true;
    });
    keyboard.on('keydown-W', () => {
      this.jumpQueued = true;
    });
    keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R).on('down', () => this.restart());
  }

  private buildHud(): void {
    this.hud = this.add.text(14, 10, '', {
      fontFamily: 'ui-monospace, Cascadia Mono, Consolas, monospace',
      fontSize: '14px',
      color: '#e8e2d6',
    });
    this.hud.setDepth(10);
    this.hud.setAlpha(0.85);
  }

  private applyPalette(): void {
    const palette = PALETTE[this.mode];
    this.cameras.main.setBackgroundColor(palette.bg);
    const ghost = this.mode === 'ghost';

    const paint = (tile: Phaser.GameObjects.Rectangle, colour: number, alpha = 1) => {
      tile.setFillStyle(colour, alpha);
    };

    for (const tile of this.floorTiles) paint(tile, palette.floor);
    for (const tile of this.wallTiles) paint(tile, palette.wall, ghost ? GHOST_ALPHA : 1);
    for (const tile of this.furnitureTiles) paint(tile, palette.furniture, ghost ? GHOST_ALPHA * 0.8 : 1);

    this.children.list.forEach((child) => {
      const rect = child as Phaser.GameObjects.Rectangle;
      if (rect.getData?.('lip') !== true) return;
      paint(rect, rect.getData('kind') === 'wallTop' ? palette.wallTop : palette.floorTop, ghost ? GHOST_ALPHA : 1);
    });

    for (const strand of this.saltDecor) strand.setFillStyle(palette.salt, ghost ? 0.9 : 0.75);

    this.player.setFillStyle(palette.player, ghost ? 0.78 : 1);
    for (const orb of this.echoes) orb.setFillStyle(palette.echo);
    this.door.setFillStyle(this.echoes.length === 0 ? palette.doorOpen : palette.door);
    this.doorInner.setVisible(true);

    this.body.setAllowGravity(true);
    this.wallCollider.active = !ghost;
    this.furnitureCollider.active = !ghost;
  }

  private shift(): void {
    if (this.dead || this.won) return;
    const next: Mode = this.mode === 'alive' ? 'ghost' : 'alive';

    if (next === 'alive') {
      const inside =
        this.physics.overlap(this.player, this.wallTiles) ||
        this.physics.overlap(this.player, this.furnitureTiles);
      if (inside) {
        this.cameras.main.shake(120, 0.006);
        this.hudFlash('#ff9a8a', 'Not here: you would materialise inside stone.');
        return;
      }
    }

    this.mode = next;
    this.applyPalette();
    this.cameras.main.flash(110, next === 'ghost' ? 40 : 70, next === 'ghost' ? 90 : 40, next === 'ghost' ? 120 : 20);
    this.updateHud();
  }

  private collect(orb: Phaser.GameObjects.Arc): void {
    if (this.dead || this.won) return;
    const index = this.echoes.indexOf(orb);
    if (index === -1) return;
    this.echoes.splice(index, 1);
    this.tweens.killTweensOf(orb);
    this.tweens.add({
      targets: orb,
      alpha: 0,
      scale: 2,
      duration: 220,
      onComplete: () => orb.destroy(),
    });
    this.door.setFillStyle(PALETTE[this.mode].doorOpen);
    this.updateHud();
  }

  private tryDoor(): void {
    if (this.dead || this.won) return;
    if (this.echoes.length > 0) {
      if (!this.doorHintShown) {
        this.doorHintShown = true;
        this.hudFlash('#ffd166', `The door wants all three echoes (${this.echoes.length} left).`);
      }
      return;
    }
    if (this.mode === 'ghost') {
      if (!this.doorHintShown) {
        this.doorHintShown = true;
        this.hudFlash('#9fd8ff', 'The dead cannot open it. Cross back.');
      }
      return;
    }
    this.win();
  }

  private win(): void {
    this.won = true;
    this.body.setVelocity(0, 0);
    this.body.moves = false;
    this.banner.innerHTML = '<strong>YOU CROSSED OVER</strong>Press R to walk it again.';
    this.banner.hidden = false;
    this.hint.hidden = true;
    this.cameras.main.flash(400, 120, 220, 150);
  }

  private restart(): void {
    this.scene.restart();
  }

  private die(): void {
    if (this.dead) return;
    this.dead = true;
    this.body.setVelocity(0, 0);
    this.body.moves = false;
    this.player.setVisible(false);
    this.cameras.main.flash(160, 120, 20, 20);
    this.time.delayedCall(260, () => {
      this.dead = false;
      this.body.moves = true;
      this.player.setVisible(true);
      this.player.setPosition(this.spawn.x, this.spawn.y);
      this.body.setVelocity(0, 0);
      if (this.mode === 'ghost') {
        this.mode = 'alive';
        this.applyPalette();
        this.updateHud();
      }
    });
  }

  private hudFlash(colour: string, message: string): void {
    this.hud.setColor(colour);
    this.hud.setText(message);
    this.time.delayedCall(1400, () => this.updateHud());
  }

  private updateHud(): void {
    const mode = this.mode === 'alive' ? 'LIVING' : 'DEAD';
    this.hud.setColor(this.mode === 'alive' ? '#e8b06a' : '#9fd8ff');
    this.hud.setText(`ECHOES ${3 - this.echoes.length}/3   ·   ${mode}   ·   SHIFT crosses over`);
  }

  update(): void {
    if (this.won) return;

    const left = this.cursors.left.isDown || this.keys.A.isDown || touch.left;
    const right = this.cursors.right.isDown || this.keys.D.isDown || touch.right;
    const jump = this.jumpQueued || consumeJump();
    const shiftPressed = this.shiftQueued || consumeShift();
    this.jumpQueued = false;
    this.shiftQueued = false;

    if (shiftPressed) this.shift();
    if (this.dead) return;

    if (!this.body.moves) return;
    const speed = SPEED[this.mode];
    if (left && !right) this.body.setVelocityX(-speed);
    else if (right && !left) this.body.setVelocityX(speed);

    const onFloor = this.body.blocked.down || this.body.touching.down;
    if (jump && onFloor) this.body.setVelocityY(JUMP[this.mode]);

    if (this.player.y > WORLD_H + 48) this.die();
  }
}
