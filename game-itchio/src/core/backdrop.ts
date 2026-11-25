/**
 * Parallax background: a night sky with towers, and a second, colder sky that
 * fades in when the player projects. Both are generated once at boot.
 */
import Phaser from 'phaser';
import { DEPTH, VIEW_H, VIEW_W } from '../config';
import { mulberry32 } from './rng';
import { makeRawTexture } from './art';

const LAYER_W = 1440;

function sky(material: boolean): (ctx: CanvasRenderingContext2D) => void {
  return (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    if (material) {
      g.addColorStop(0, '#080a1c');
      g.addColorStop(0.45, '#151436');
      g.addColorStop(0.78, '#332148');
      g.addColorStop(1, '#4a2c4f');
    } else {
      g.addColorStop(0, '#040a22');
      g.addColorStop(0.45, '#0b1b48');
      g.addColorStop(0.8, '#123a63');
      g.addColorStop(1, '#1d5a7a');
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, LAYER_W, VIEW_H);

    // A wide nebula wash, so the sky is not a flat ramp.
    const nebula = ctx.createRadialGradient(430, 210, 30, 430, 210, 420);
    nebula.addColorStop(0, material ? 'rgba(120,70,160,0.22)' : 'rgba(90,190,255,0.22)');
    nebula.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = nebula;
    ctx.fillRect(0, 0, LAYER_W, VIEW_H);

    const rng = mulberry32(material ? 12 : 13);
    for (let i = 0; i < 260; i += 1) {
      const x = Math.floor(rng() * LAYER_W);
      const y = Math.floor(rng() * VIEW_H * 0.8);
      const size = rng() > 0.9 ? 2 : 1;
      const alpha = 0.25 + rng() * 0.7;
      ctx.fillStyle = material ? `rgba(255,240,214,${alpha})` : `rgba(210,246,255,${alpha})`;
      ctx.fillRect(x, y, size, size);
    }

    // The moon.
    const moonX = 1120;
    const moonY = 105;
    const halo = ctx.createRadialGradient(moonX, moonY, 10, moonX, moonY, 95);
    halo.addColorStop(0, material ? 'rgba(255,225,170,0.45)' : 'rgba(190,240,255,0.5)');
    halo.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(moonX - 100, moonY - 100, 200, 200);
    ctx.fillStyle = material ? '#f4dcae' : '#d9f6ff';
    ctx.beginPath();
    ctx.arc(moonX, moonY, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = material ? 'rgba(90,70,120,0.35)' : 'rgba(80,140,200,0.35)';
    ctx.beginPath();
    ctx.arc(moonX - 8, moonY - 5, 6, 0, Math.PI * 2);
    ctx.arc(moonX + 9, moonY + 8, 4, 0, Math.PI * 2);
    ctx.fill();
  };
}

function towers(near: boolean): (ctx: CanvasRenderingContext2D) => void {
  return (ctx) => {
    const rng = mulberry32(near ? 41 : 40);
    const baseY = VIEW_H;
    const colour = near ? '#0e0c1e' : '#191636';
    const lit = near ? 'rgba(120,220,235,0.75)' : 'rgba(230,186,110,0.65)';
    let x = -40;
    while (x < LAYER_W + 60) {
      const w = 40 + Math.floor(rng() * (near ? 70 : 90));
      const h = 110 + Math.floor(rng() * (near ? 190 : 240));
      ctx.fillStyle = colour;
      ctx.fillRect(x, baseY - h, w, h);

      // A spire on some of them.
      if (rng() > 0.45) {
        ctx.beginPath();
        ctx.moveTo(x + w / 2, baseY - h - 34 - rng() * 30);
        ctx.lineTo(x + w / 2 - 9, baseY - h);
        ctx.lineTo(x + w / 2 + 9, baseY - h);
        ctx.closePath();
        ctx.fill();
      }

      // Lit windows.
      const cols = Math.max(1, Math.floor(w / 18));
      for (let cx = 0; cx < cols; cx += 1) {
        for (let cy = baseY - h + 20; cy < baseY - 16; cy += 22) {
          if (rng() > 0.72) {
            ctx.fillStyle = lit;
            ctx.fillRect(x + 8 + cx * 18, cy, 5, 7);
          }
        }
      }

      x += w + 10 + Math.floor(rng() * 40);
    }
  };
}

export function ensureBackdropTextures(scene: Phaser.Scene): void {
  if (scene.textures.exists('bg-sky')) return;
  makeRawTexture(scene, 'bg-sky', LAYER_W, VIEW_H, sky(true));
  makeRawTexture(scene, 'bg-sky-astral', LAYER_W, VIEW_H, sky(false));
  makeRawTexture(scene, 'bg-far', LAYER_W, VIEW_H, towers(false));
  makeRawTexture(scene, 'bg-near', LAYER_W, VIEW_H, towers(true));
}

export class Backdrop {
  private readonly material: Phaser.GameObjects.Image;
  private readonly astral: Phaser.GameObjects.Image;
  private readonly far: Phaser.GameObjects.Image;
  private readonly near: Phaser.GameObjects.Image;
  private readonly haze: Phaser.GameObjects.Image;
  private active = false;
  private readonly scene: Phaser.Scene;

  constructor(scene: Phaser.Scene, worldHeight: number) {
    this.scene = scene;
    ensureBackdropTextures(scene);

    const bottom = worldHeight - VIEW_H;
    this.material = scene.add
      .image(0, 0, 'bg-sky')
      .setOrigin(0, 0)
      .setScrollFactor(0.04)
      .setDepth(DEPTH.sky);
    this.astral = scene.add
      .image(0, 0, 'bg-sky-astral')
      .setOrigin(0, 0)
      .setScrollFactor(0.04)
      .setDepth(DEPTH.sky)
      .setAlpha(0);
    this.far = scene.add
      .image(0, bottom, 'bg-far')
      .setOrigin(0, 0)
      .setScrollFactor(0.22)
      .setDepth(DEPTH.far);
    this.near = scene.add
      .image(0, bottom, 'bg-near')
      .setOrigin(0, 0)
      .setScrollFactor(0.42)
      .setDepth(DEPTH.far + 1)
      .setAlpha(0.9);
    this.haze = scene.add
      .image(VIEW_W / 2, VIEW_H / 2, 'fog')
      .setScrollFactor(0)
      .setDepth(DEPTH.fog)
      .setAlpha(0)
      .setScale(4.4, 2.6)
      .setBlendMode(Phaser.BlendModes.SCREEN);
  }

  setAstral(active: boolean, duration = 260): void {
    if (active === this.active) return;
    this.active = active;
    this.scene.tweens.add({
      targets: this.material,
      alpha: active ? 0.55 : 1,
      duration,
      ease: 'Sine.easeInOut',
    });
    this.scene.tweens.add({
      targets: this.astral,
      alpha: active ? 1 : 0,
      duration,
      ease: 'Sine.easeInOut',
    });
    this.scene.tweens.add({
      targets: this.haze,
      alpha: active ? 0.5 : 0,
      duration: duration * 1.6,
      ease: 'Sine.easeInOut',
    });
    this.scene.tweens.add({
      targets: [this.far, this.near],
      alpha: active ? 0.75 : 0.9,
      duration,
    });
  }

  /** Slow drift, so the astral veil never looks like a static tint. */
  update(time: number, astralAmount: number): void {
    this.haze.x = VIEW_W / 2 + Math.sin(time / 4200) * 90;
    this.haze.y = VIEW_H / 2 + Math.cos(time / 3100) * 30;
    this.haze.alpha = astralAmount * 0.45;
  }

  get astralAmount(): number {
    return this.astral.alpha;
  }
}
