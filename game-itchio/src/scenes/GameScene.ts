import Phaser from 'phaser';
import { ASTRAL, DEPTH, TILE, VIEW_H, VIEW_W } from '../config';
import { lines, t } from '../content/strings';
import { parseLevel, type ParsedLevel, type TileKind } from '../content/level';
import { Emitter, type Bus, type GameEvents } from '../core/events';
import { Input } from '../core/input';
import { loadSettings, saveSettings, writeSave } from '../core/save';
import type { Run } from '../core/run';
import { audio } from '../audio/engine';
import { music } from '../audio/music';
import { Backdrop } from '../core/backdrop';
import { Vitals } from '../systems/vitals';
import { AstralSystem } from '../systems/astral';
import { Player } from '../entities/Player';
import { Walker, Wisp } from '../entities/Enemy';
import { MovingPlatform, Spinner } from '../entities/Platforms';
import { Hud } from '../ui/hud';
import { Dialogue } from '../ui/dialogue';
import type { AllySpec, Lang, LevelObject } from '../types';

interface GameData {
  run: Run;
  /** True when coming back from a death: use the checkpoint, not the spawn. */
  respawn?: boolean;
}

interface Pickup {
  image: Phaser.GameObjects.Image;
  kind: 'potion' | 'health' | 'shard';
  id: string;
  baseY: number;
  phase: number;
}

interface AllyRuntime {
  spec: AllySpec;
  image: Phaser.GameObjects.Image;
}

export class GameScene extends Phaser.Scene {
  private run!: Run;
  private lang: Lang = 'es';
  private bus!: Bus;
  private keys!: Input;
  private vitals!: Vitals;
  private astral!: AstralSystem;
  private player!: Player;
  private hud!: Hud;
  private dialogue!: Dialogue;
  private backdrop!: Backdrop;
  private level!: ParsedLevel;

  private worldW = 0;
  private worldH = 0;
  private groundGroup!: Phaser.Physics.Arcade.StaticGroup;
  private wallGroup!: Phaser.Physics.Arcade.StaticGroup;
  private slabGroup!: Phaser.Physics.Arcade.StaticGroup;
  private hazardGroup!: Phaser.Physics.Arcade.StaticGroup;

  private wallTiles: Phaser.GameObjects.Image[] = [];
  private slabTiles: Phaser.GameObjects.Image[] = [];
  private cells = new Map<string, TileKind>();
  private wallCells = new Set<string>();

  private movers: MovingPlatform[] = [];
  private spinners: Spinner[] = [];
  private walkers: Walker[] = [];
  private wisps: Wisp[] = [];
  private pickups: Pickup[] = [];
  private allies: AllyRuntime[] = [];
  private door!: Phaser.GameObjects.Image;
  private altar: Phaser.GameObjects.Image | null = null;

  private motes!: Phaser.GameObjects.Particles.ParticleEmitter;
  private astralVeil!: Phaser.GameObjects.Rectangle;
  private pausePanel: Phaser.GameObjects.Container | null = null;
  private pauseLabel: Phaser.GameObjects.Text | null = null;

  private invuln = 0;
  private wasOnGround = true;
  private dead = false;
  private finishing = false;
  private paused = false;
  private altarArmed = true;
  private taughtAstral = false;
  private elapsed = 0;

  constructor() {
    super('game');
  }

  create(data: GameData): void {
    this.run = data.run;
    this.lang = loadSettings().language;
    this.dead = false;
    this.finishing = false;
    this.paused = false;
    this.taughtAstral = false;
    this.invuln = 0;
    this.elapsed = 0;
    this.altarArmed = true;
    this.wallTiles = [];
    this.slabTiles = [];
    this.cells.clear();
    this.wallCells.clear();
    this.movers = [];
    this.spinners = [];
    this.walkers = [];
    this.wisps = [];
    this.pickups = [];
    this.allies = [];

    this.bus = new Emitter<GameEvents>();
    this.vitals = new Vitals(this.run.character.stats, this.run.hp, this.run.energy);
    this.astral = new AstralSystem(this.vitals, this.bus);

    this.level = parseLevel(this.run.level);
    this.worldW = this.level.width * TILE;
    this.worldH = this.level.height * TILE;

    this.cameras.main.setBackgroundColor('#080a1c');
    this.cameras.main.setBounds(0, 0, this.worldW, this.worldH);
    this.physics.world.setBounds(0, 0, this.worldW, this.worldH);

    this.backdrop = new Backdrop(this, this.worldH);
    this.buildTiles();
    this.buildObjects();
    this.buildSpawns(data.respawn === true);
    this.buildUi();
    this.wireEvents();

    this.keys = new Input(this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.keys.destroy());

    music.play(this.run.chapter.theme);
    music.setAstral(false);
    music.setVolume(0.9);

    this.cameras.main.fadeIn(420, 5, 4, 12);
  }

  // -------------------------------------------------------------------------
  // Building
  // -------------------------------------------------------------------------

  private buildTiles(): void {
    this.groundGroup = this.physics.add.staticGroup();
    this.wallGroup = this.physics.add.staticGroup();
    this.slabGroup = this.physics.add.staticGroup();
    this.hazardGroup = this.physics.add.staticGroup();

    for (const tile of this.level.tiles) {
      const key = `${tile.tx},${tile.ty}`;
      this.cells.set(key, tile.kind);
      if (tile.kind === 'wall') this.wallCells.add(key);
    }

    for (const tile of this.level.tiles) {
      const cx = tile.tx * TILE + TILE / 2;
      switch (tile.kind) {
        case 'ground': {
          const above = this.cells.get(`${tile.tx},${tile.ty - 1}`);
          const capped = above !== 'ground' && above !== 'wall';
          const texture = capped
            ? 'tile-ground-top'
            : tile.tx % 3 === 0
              ? 'tile-ground-1'
              : 'tile-ground-0';
          const image = this.groundGroup.create(cx, tile.ty * TILE + TILE / 2, texture) as
            Phaser.Physics.Arcade.Image;
          image.setDepth(DEPTH.tiles);
          break;
        }
        case 'wall': {
          const image = this.wallGroup.create(
            cx,
            tile.ty * TILE + TILE / 2,
            'tile-wall'
          ) as Phaser.Physics.Arcade.Image;
          image.setDepth(DEPTH.tiles + 1);
          this.wallTiles.push(image);
          break;
        }
        case 'platform': {
          const image = this.groundGroup.create(cx, tile.ty * TILE + 4, 'tile-platform') as
            Phaser.Physics.Arcade.Image;
          image.setDepth(DEPTH.platforms);
          break;
        }
        case 'astral': {
          const image = this.slabGroup.create(cx, tile.ty * TILE + 4, 'tile-astral') as
            Phaser.Physics.Arcade.Image;
          image.setDepth(DEPTH.astralGlow).setAlpha(0.16);
          this.slabTiles.push(image);
          break;
        }
        case 'hazard': {
          const image = this.hazardGroup.create(cx, tile.ty * TILE + TILE - 8, 'tile-hazard') as
            Phaser.Physics.Arcade.Image;
          image.setDepth(DEPTH.tiles + 1);
          break;
        }
      }
    }
  }

  private buildObjects(): void {
    for (const object of this.run.level.objects as LevelObject[]) {
      if (object.type === 'mover') this.movers.push(new MovingPlatform(this, object));
      else if (object.type === 'spinner') this.spinners.push(new Spinner(this, object));
    }
  }

  private buildSpawns(respawn: boolean): void {
    const checkpoint =
      respawn &&
      this.run.checkpoint &&
      this.run.checkpoint.chapterIndex === this.run.chapterIndex &&
      this.run.checkpoint.levelIndex === this.run.levelIndex
        ? this.run.checkpoint
        : null;

    const spawnX = checkpoint ? checkpoint.x : this.level.player.tx * TILE + TILE / 2;
    const spawnY = checkpoint ? checkpoint.y : this.level.player.ty * TILE + TILE;

    for (const spawn of this.level.spawns) {
      const x = spawn.tx * TILE + TILE / 2;
      const y = spawn.ty * TILE + TILE;

      switch (spawn.kind) {
        case 'potion':
        case 'health': {
          const image = this.add
            .image(x, y - 6, spawn.kind === 'potion' ? 'pickup-energy' : 'pickup-health')
            .setOrigin(0.5, 1)
            .setDepth(DEPTH.actors);
          this.tweens.add({
            targets: image,
            y: image.y - 6,
            duration: 1300,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
          });
          this.pickups.push({
            image,
            kind: spawn.kind,
            id: spawn.id,
            baseY: image.y,
            phase: spawn.tx,
          });
          break;
        }
        case 'shard': {
          if (this.run.shards.has(spawn.id)) break;
          const glow = this.add
            .image(x, y - 20, 'glow')
            .setTint(0xffc46b)
            .setAlpha(0.45)
            .setScale(0.7)
            .setBlendMode(Phaser.BlendModes.ADD)
            .setDepth(DEPTH.astralGlow);
          const image = this.add
            .image(x, y - 20, 'shard')
            .setScale(1.4)
            .setDepth(DEPTH.actors)
            .setData('glow', glow);
          this.tweens.add({
            targets: [image, glow],
            y: { from: y - 24, to: y - 14 },
            duration: 1600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
          });
          this.tweens.add({
            targets: glow,
            alpha: { from: 0.25, to: 0.6 },
            duration: 1100,
            yoyo: true,
            repeat: -1,
          });
          this.pickups.push({
            image,
            kind: 'shard',
            id: spawn.id,
            baseY: image.y,
            phase: spawn.tx,
          });
          break;
        }
        case 'walker':
          this.walkers.push(new Walker(this, x, y, spawn.tx % 2 === 0 ? 1 : -1));
          break;
        case 'wisp':
          this.wisps.push(new Wisp(this, x, y - TILE));
          break;
        case 'door':
          break;
        case 'altar': {
          const glow = this.add
            .image(x, y - 34, 'glow')
            .setTint(0xffb44d)
            .setAlpha(0.4)
            .setScale(1.1)
            .setBlendMode(Phaser.BlendModes.ADD)
            .setDepth(DEPTH.astralGlow);
          this.tweens.add({
            targets: glow,
            alpha: { from: 0.25, to: 0.55 },
            duration: 1400,
            yoyo: true,
            repeat: -1,
          });
          this.altar = this.add.image(x, y, 'altar').setOrigin(0.5, 1).setDepth(DEPTH.platforms);
          break;
        }
        case 'ally': {
          const spec = this.run.level.objects.find(
            (object): object is AllySpec =>
              object.type === 'ally' && object.tx === spawn.tx && object.ty === spawn.ty
          );
          if (!spec) break;
          this.add
            .image(x, y - 34, 'glow')
            .setTint(0x8fe6ff)
            .setAlpha(0.32)
            .setScale(1)
            .setBlendMode(Phaser.BlendModes.ADD)
            .setDepth(DEPTH.astralGlow);
          this.allies.push({
            spec,
            image: this.add
              .image(x, y, 'ally')
              .setOrigin(0.5, 1)
              .setScale(1.3)
              .setDepth(DEPTH.actors),
          });
          break;
        }
      }
    }

    this.buildDoor();

    this.player = new Player(this, spawnX, spawnY, this.run.character);    this.player.body.setCollideWorldBounds(false);
    this.player.setProjected(false);

    this.physics.add.collider(this.player, this.groundGroup);
    this.physics.add.collider(this.player, this.wallGroup, undefined, () =>
      this.astral.active ? false : true
    );
    this.physics.add.collider(this.player, this.slabGroup, undefined, () =>
      this.astral.active
    );
    this.physics.add.overlap(this.player, this.hazardGroup, () => this.hurt(this.player.x));

    for (const walker of this.walkers) {
      this.physics.add.collider(walker.sprite, this.groundGroup);
    }
    for (const mover of this.movers) {
      this.physics.add.collider(this.player, mover.image);
    }
    for (const spinner of this.spinners) {
      for (const pad of spinner.pads) this.physics.add.collider(this.player, pad.image);
    }

    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setDeadzone(220, 110);
  }

  private buildDoor(): void {
    const x = this.level.door.tx * TILE + TILE / 2;
    const y = this.level.door.ty * TILE + TILE;
    const glow = this.add
      .image(x, y - 34, 'glow')
      .setTint(0xc9b6ff)
      .setAlpha(0.4)
      .setScale(1.6)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(DEPTH.astralGlow);
    this.tweens.add({
      targets: glow,
      alpha: { from: 0.25, to: 0.6 },
      duration: 1800,
      yoyo: true,
      repeat: -1,
    });
    this.door = this.add
      .image(x, y, 'door')
      .setOrigin(0.5, 1)
      .setScale(1.7)
      .setDepth(DEPTH.platforms);
  }

  private buildUi(): void {
    this.hud = new Hud(this, this.lang);
    this.dialogue = new Dialogue(this, this.lang);

    this.hud.setChapter(
      t(this.lang, 'hud.chapter', {
        n: `${this.run.chapterIndex + 1}`,
        name: this.run.chapter.name[this.lang],
      }),
      this.run.level.name[this.lang]
    );
    this.hud.setShards(this.run.shards.size);
    this.hud.setHp(this.vitals.hp, this.vitals.maxHp);
    this.hud.setEnergy(this.vitals.ratio, false, this.astral.locked);
    this.hud.setHint(true, false);

    this.astralVeil = this.add
      .rectangle(0, 0, VIEW_W, VIEW_H, 0x2f5fbf, 0)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(DEPTH.fog - 1)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.motes = this.add.particles(0, 0, 'spark', {
      x: { min: 0, max: VIEW_W },
      y: { min: 0, max: VIEW_H },
      lifespan: 5200,
      speedY: { min: -26, max: -8 },
      speedX: { min: -8, max: 8 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.7, end: 0 },
      quantity: 1,
      frequency: 140,
      blendMode: 'ADD',
    });
    this.motes.setScrollFactor(0).setDepth(DEPTH.fog);
    this.motes.stop();

    this.time.delayedCall(500, () => {
      this.hud.toast(t(this.lang, 'toast.level', { name: this.run.level.name[this.lang] }), 'plain');
    });
  }

  private wireEvents(): void {
    this.bus.on('astral:enter', () => {
      this.onAstral(true);
      if (!this.taughtAstral) {
        this.taughtAstral = true;
        this.hud.toast(t(this.lang, 'toast.astral'), 'good');
      }
    });
    this.bus.on('astral:exit', ({ reason }) => {
      this.onAstral(false);
      if (reason === 'empty') {
        this.unstick();
        this.hud.toast(t(this.lang, 'toast.empty'), 'bad');
      }
    });
    this.bus.on('astral:denied', ({ reason }) => {
      audio.sfx('denied');
      if (reason === 'burnout') this.hud.toast(t(this.lang, 'toast.empty'), 'bad');
    });
    this.bus.on('potion:taken', ({ kind }) => {
      this.hud.toast(t(this.lang, kind === 'energy' ? 'toast.energy' : 'toast.health'), 'good');
    });
    this.bus.on('shard:taken', ({ total }) => {
      this.hud.setShards(total);
      this.hud.toast(t(this.lang, 'toast.shard', { n: `${total}/9` }), 'good');
    });
    this.bus.on('checkpoint:saved', () => {
      this.hud.toast(t(this.lang, 'toast.saved'), 'good');
    });
  }

  // -------------------------------------------------------------------------
  // Frame
  // -------------------------------------------------------------------------

  update(_time: number, delta: number): void {
    const dt = Math.min(delta / 1000, 0.05);
    this.elapsed += dt;
    this.hud.update(dt);

    if (this.paused) {
      this.updatePause();
      return;
    }

    if (this.dialogue.isOpen) {
      const advance = this.keys.consume('interact') || this.keys.consume('jump');
      this.dialogue.update(dt, advance);
      return;
    }

    if (this.dead || this.finishing) return;

    if (this.keys.consume('pause')) {
      this.openPause();
      return;
    }
    if (this.keys.consume('mute')) this.toggleMute();
    // Drain the pause-menu key so it does not fire when the menu opens.
    this.keys.consume('quit');
    if (this.keys.consume('restart')) {
      this.restartLevel(false);
      return;
    }

    if (this.invuln > 0) {
      this.invuln = Math.max(0, this.invuln - dt);
      this.player.setAlpha(this.invuln > 0 && Math.floor(this.invuln * 12) % 2 === 0 ? 0.35 : 1);
    }

    this.astral.update(dt, this.keys.astralHeld, this.canMaterialise());
    this.hud.setEnergy(this.vitals.ratio, this.astral.active, this.astral.locked);
    this.hud.setHp(this.vitals.hp, this.vitals.maxHp);
    this.hud.setHint(!this.astral.active, this.astral.active);

    const jump = this.keys.consume('jump');
    const jumped = this.player.move(
      dt,
      this.keys.moveX,
      jump,
      this.keys.jumpHeld,
      this.astral.speedScale
    );
    if (jumped) audio.sfx('jump');
    if (!this.wasOnGround && this.player.onGround) audio.sfx('land');
    this.wasOnGround = this.player.onGround;

    this.updatePlatforms(dt);

    for (const walker of this.walkers) {
      walker.update((x, y) => this.solidAt(x, y));
      if (!this.astral.active && this.overlapsWalker(walker)) this.hurt(walker.x);
    }

    for (const wisp of this.wisps) {
      wisp.update(dt, this.astral.active);
      if (this.astral.active && wisp.touches(this.player.x, this.player.y - 22)) {
        this.hurt(wisp.sprite.x);
      }
    }

    this.checkPickups();
    this.checkAltar();
    this.checkDoor();
    this.checkAllies();

    if (this.player.y > this.worldH + 90) this.die();

    this.backdrop.update(this.elapsed * 1000, this.backdrop.astralAmount);
  }

  private updatePlatforms(dt: number): void {
    for (const mover of this.movers) mover.update();
    for (const spinner of this.spinners) spinner.update(dt);

    const carried: Array<{ dx: number; dy: number; supports: boolean }> = [];
    // Arcade already carries a body standing on a platform that moves by
    // velocity, so only the pads we reposition by hand are carried here.
    for (const spinner of this.spinners) {
      for (const pad of spinner.pads) {
        carried.push({ dx: pad.dx, dy: pad.dy, supports: pad.supports(this.player.body) });
      }
    }
    for (const entry of carried) {
      if (entry.supports) this.player.carryBy(entry.dx, entry.dy);
    }
    for (const mover of this.movers) mover.commit();
    for (const spinner of this.spinners) {
      for (const pad of spinner.pads) pad.commit();
    }
  }

  // -------------------------------------------------------------------------
  // World queries
  // -------------------------------------------------------------------------

  private solidAt(x: number, y: number): boolean {
    const kind = this.cells.get(`${Math.floor(x / TILE)},${Math.floor(y / TILE)}`);
    return kind === 'ground' || kind === 'wall' || kind === 'platform';
  }

  private canMaterialise(): boolean {
    const body = this.player.body;
    const x0 = Math.floor(body.left / TILE);
    const x1 = Math.floor((body.right - 1) / TILE);
    const y0 = Math.floor(body.top / TILE);
    const y1 = Math.floor((body.bottom - 1) / TILE);
    for (let y = y0; y <= y1; y += 1) {
      for (let x = x0; x <= x1; x += 1) {
        if (this.wallCells.has(`${x},${y}`)) return false;
      }
    }
    return true;
  }

  /** If the bar ran out inside a wall, find the nearest free tile. */
  private unstick(): void {
    if (this.canMaterialise()) return;
    const body = this.player.body;
    const originX = Math.floor(this.player.x / TILE);
    const originY = Math.floor((body.top + body.height / 2) / TILE);
    for (let step = 1; step <= 6; step += 1) {
      for (const [dx, dy] of [
        [0, -step],
        [step, 0],
        [-step, 0],
        [0, step],
      ]) {
        const tx = originX + dx;
        const ty = originY + dy;
        if (!this.wallCells.has(`${tx},${ty}`) && !this.wallCells.has(`${tx},${ty - 1}`)) {
          const x = tx * TILE + TILE / 2;
          const y = ty * TILE + TILE;
          this.player.body.reset(x, y);
          this.player.setPosition(x, y);
          return;
        }
      }
    }
  }

  private overlapsWalker(walker: Walker): boolean {
    const body = this.player.body;
    const bounds = walker.bounds;
    return (
      body.right > bounds.left + 4 &&
      body.left < bounds.right - 4 &&
      body.bottom > bounds.top + 4 &&
      body.top < bounds.bottom
    );
  }

  // -------------------------------------------------------------------------
  // Interactions
  // -------------------------------------------------------------------------

  private checkPickups(): void {
    const px = this.player.x;
    const py = this.player.y - 22;
    for (const pickup of this.pickups) {
      if (!pickup.image.active) continue;
      if (Phaser.Math.Distance.Between(px, py, pickup.image.x, pickup.image.y - 10) > 34) continue;

      if (pickup.kind === 'shard') {
        this.run.shards.add(pickup.id);
        this.vitals.refillEnergy(ASTRAL.shardEnergy);
        audio.sfx('shard');
        this.bus.emit('shard:taken', { id: pickup.id, total: this.run.shards.size });
        const glow = pickup.image.getData('glow') as Phaser.GameObjects.Image | undefined;
        glow?.destroy();
      } else if (pickup.kind === 'potion') {
        this.vitals.refillEnergy(ASTRAL.potionEnergy);
        audio.sfx('potion');
        this.bus.emit('potion:taken', { kind: 'energy' });
      } else {
        this.vitals.heal(ASTRAL.potionHealth);
        audio.sfx('potion');
        this.bus.emit('potion:taken', { kind: 'health' });
      }
      pickup.image.destroy();
    }
  }

  private checkAltar(): void {
    if (!this.altar) return;
    const near =
      Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        this.altar.x,
        this.altar.y - 16
      ) < 38;
    if (!near) {
      this.altarArmed = true;
      return;
    }
    if (!this.altarArmed) return;
    this.altarArmed = false;
    this.run.checkpoint = {
      chapterIndex: this.run.chapterIndex,
      levelIndex: this.run.levelIndex,
      x: this.player.x,
      y: this.player.y,
    };
    this.run.hp = this.vitals.hp;
    this.run.energy = this.vitals.energy;
    writeSave(this.run.toSave());
    audio.sfx('save');
    this.bus.emit('checkpoint:saved', { label: this.run.level.id });
    this.cameras.main.flash(180, 255, 200, 120, false);
  }

  private checkDoor(): void {
    if (!this.door) return;
    const near =
      Phaser.Math.Distance.Between(this.player.x, this.player.y, this.door.x, this.door.y - 30) <
      64;
    if (near) this.finishLevel();
  }

  private checkAllies(): void {
    for (const ally of this.allies) {
      const near =
        Phaser.Math.Distance.Between(
          this.player.x,
          this.player.y,
          ally.image.x,
          ally.image.y - 24
        ) < 54;
      if (!near) continue;
      const key = `ally:${this.run.level.id}:${ally.spec.name}`;
      if (this.run.seen.has(key)) continue;
      this.run.seen.add(key);
      if (ally.spec.gift) {
        this.vitals.refillEnergy(ally.spec.gift);
        audio.sfx('save');
      }
      this.talk(ally.spec);
      return;
    }
  }

  private talk(spec: AllySpec): void {
    this.astral.forceExit('level');
    this.physics.pause();
    this.dialogue.show(spec.name, lines(this.lang, spec.lines), () => {
      this.physics.resume();
      this.keys.flush();
    });
  }

  // -------------------------------------------------------------------------
  // Astral
  // -------------------------------------------------------------------------

  private onAstral(active: boolean): void {
    this.physics.world.timeScale = active ? ASTRAL.worldTimeScale : 1;
    this.time.timeScale = active ? ASTRAL.worldTimeScale : 1;
    this.tweens.timeScale = active ? ASTRAL.worldTimeScale : 1;

    this.player.setProjected(active);
    this.backdrop.setAstral(active);
    audio.setAstral(active);
    music.setAstral(active);
    audio.sfx(active ? 'astralIn' : 'astralOut');

    this.tweens.add({
      targets: this.astralVeil,
      alpha: active ? 0.16 : 0,
      duration: 220,
    });

    for (const tile of this.wallTiles) {
      tile.setTint(active ? 0xa8ecff : 0xffffff);
      tile.setAlpha(active ? 0.5 : 1);
    }
    for (const tile of this.slabTiles) {
      tile.setAlpha(active ? 1 : 0.16);
    }
    for (const walker of this.walkers) walker.setAstral(active);

    if (active) this.motes.start();
    else this.motes.stop();
  }

  // -------------------------------------------------------------------------
  // Damage and flow
  // -------------------------------------------------------------------------

  private hurt(fromX: number): void {
    if (this.invuln > 0 || this.dead || this.finishing) return;
    this.invuln = 1.05;
    this.astral.forceExit('hurt');
    const died = this.vitals.hurt(1);
    audio.sfx('hurt');
    this.cameras.main.shake(140, 0.008);
    this.player.body.setVelocity(
      this.player.x < fromX ? -PLAYER_KNOCK_X : PLAYER_KNOCK_X,
      -PLAYER_KNOCK_Y
    );
    this.hud.setHp(this.vitals.hp, this.vitals.maxHp);
    if (died) this.die();
  }

  private die(): void {
    if (this.dead) return;
    this.dead = true;
    this.astral.forceExit('level');
    audio.sfx('die');
    this.player.kill();
    this.cameras.main.shake(240, 0.012);
    this.cameras.main.fadeOut(420, 5, 4, 12);
    this.time.delayedCall(600, () => this.restartLevel(true));
  }

  private restartLevel(fromDeath: boolean): void {
    this.run.hp = this.run.character.stats.maxHp;
    this.run.energy = this.run.character.stats.maxEnergy;
    this.scene.restart({ run: this.run, respawn: fromDeath });
  }

  private finishLevel(): void {
    if (this.finishing) return;
    this.finishing = true;
    this.astral.forceExit('level');
    audio.sfx('door');
    this.player.body.setVelocity(0, 0);
    this.cameras.main.fadeOut(520, 255, 240, 200);
    this.time.delayedCall(560, () => {
      if (!this.run.isLastLevelOfChapter) {
        this.run.levelIndex += 1;
        this.scene.restart({ run: this.run });
      } else {
        this.scene.start('story', {
          run: this.run,
          kind: 'outro',
          chapterIndex: this.run.chapterIndex,
        });
      }
    });
  }

  // -------------------------------------------------------------------------
  // Pause
  // -------------------------------------------------------------------------

  private toggleMute(): void {
    const muted = audio.toggleMute();
    saveSettings({ ...loadSettings(), mute: muted });
    if (this.pauseLabel) this.pauseLabel.setText(this.pauseLines().mute);
  }

  private pauseLines(): { title: string; resume: string; restart: string; quit: string; mute: string } {
    return {
      title: t(this.lang, 'pause.title'),
      resume: t(this.lang, 'pause.resume'),
      restart: t(this.lang, 'pause.restart'),
      quit: t(this.lang, 'pause.quit'),
      mute: t(this.lang, 'pause.mute', {
        state: audio.isMuted ? t(this.lang, 'pause.on') : t(this.lang, 'pause.off'),
      }),
    };
  }

  private openPause(): void {
    this.paused = true;
    this.physics.pause();
    const copy = this.pauseLines();
    const panel = this.add.graphics();
    panel.fillStyle(0x05040c, 0.86);
    panel.fillRect(0, 0, VIEW_W, VIEW_H);

    const title = this.add
      .text(VIEW_W / 2, 180, copy.title, {
        fontFamily: 'monospace',
        fontSize: '40px',
        color: '#f2e8d5',
      })
      .setOrigin(0.5)
      .setLetterSpacing(10);

    const resume = this.add
      .text(VIEW_W / 2, 270, `ESC · ${copy.resume}`, {
        fontFamily: 'monospace',
        fontSize: '19px',
        color: '#8fe6ff',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    resume.on('pointerdown', () => this.closePause());

    const restart = this.add
      .text(VIEW_W / 2, 312, `R · ${copy.restart}`, {
        fontFamily: 'monospace',
        fontSize: '17px',
        color: '#d9d2c4',
      })
      .setOrigin(0.5);

    const quit = this.add
      .text(VIEW_W / 2, 352, `T · ${copy.quit}`, {
        fontFamily: 'monospace',
        fontSize: '17px',
        color: '#d9d2c4',
      })
      .setOrigin(0.5);

    this.pauseLabel = this.add
      .text(VIEW_W / 2, 392, `M · ${copy.mute}`, {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#98a6c4',
      })
      .setOrigin(0.5);

    this.pausePanel = this.add
      .container(0, 0, [panel, title, resume, restart, quit, this.pauseLabel])
      .setScrollFactor(0)
      .setDepth(DEPTH.hud + 20);
  }

  private closePause(): void {
    this.paused = false;
    this.physics.resume();
    this.pausePanel?.destroy(true);
    this.pausePanel = null;
    this.pauseLabel = null;
    this.keys.flush();
  }

  private updatePause(): void {
    if (this.keys.consume('pause')) {
      this.closePause();
      return;
    }
    if (this.keys.consume('mute')) this.toggleMute();
    if (this.keys.consume('restart')) {
      this.closePause();
      this.restartLevel(false);
      return;
    }
    if (this.keys.consume('quit')) {
      this.closePause();
      this.scene.start('title');
    }
  }
}

const PLAYER_KNOCK_X = 240;
const PLAYER_KNOCK_Y = 300;
