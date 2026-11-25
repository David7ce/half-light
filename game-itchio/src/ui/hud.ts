import Phaser from 'phaser';
import { VIEW_H, VIEW_W, DEPTH } from '../config';
import type { Lang } from '../types';
import { t } from '../content/strings';
import { totalShards } from '../content/chapters';

const CREAM = '#f2e8d5';
const CYAN = '#8fe6ff';
const AMBER = '#f2c46b';
const BAD = '#ff8a8a';

const BAR_X = 24;
const BAR_Y = 50;
const BAR_W = 230;
const BAR_H = 12;

/** The HUD is drawn in the scene (not DOM) so it scales with the canvas. */
export class Hud {
  private readonly lang: Lang;
  private readonly chapterText: Phaser.GameObjects.Text;
  private readonly levelText: Phaser.GameObjects.Text;
  private readonly shardText: Phaser.GameObjects.Text;
  private readonly hint: Phaser.GameObjects.Text;
  private readonly toastText: Phaser.GameObjects.Text;
  private readonly energyBar: Phaser.GameObjects.Graphics;
  private readonly hpBar: Phaser.GameObjects.Graphics;
  private readonly energyLabel: Phaser.GameObjects.Text;

  private energyRatio = -1;
  private astral = false;
  private low = false;
  private hp = -1;
  private maxHp = -1;
  private toastTimer = 0;

  constructor(scene: Phaser.Scene, lang: Lang) {
    this.lang = lang;

    scene.add
      .rectangle(0, 0, VIEW_W, 92, 0x05040c, 0.5)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(DEPTH.hud - 1);

    this.chapterText = scene.add
      .text(BAR_X, 16, '', {
        fontFamily: 'monospace',
        fontSize: '15px',
        color: CREAM,
      })
      .setScrollFactor(0)
      .setDepth(DEPTH.hud)
      .setShadow(2, 2, '#000000', 2);

    this.levelText = scene.add
      .text(VIEW_W - BAR_X, 16, '', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: AMBER,
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(DEPTH.hud)
      .setShadow(2, 2, '#000000', 2);

    this.energyBar = scene.add.graphics().setScrollFactor(0).setDepth(DEPTH.hud);
    this.hpBar = scene.add.graphics().setScrollFactor(0).setDepth(DEPTH.hud);

    this.energyLabel = scene.add
      .text(BAR_X, BAR_Y + BAR_H + 4, '', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: CYAN,
      })
      .setScrollFactor(0)
      .setDepth(DEPTH.hud)
      .setAlpha(0.85);

    this.shardText = scene.add
      .text(BAR_X, VIEW_H - 30, '', {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: AMBER,
      })
      .setScrollFactor(0)
      .setDepth(DEPTH.hud)
      .setShadow(2, 2, '#000000', 2);

    this.hint = scene.add
      .text(VIEW_W - BAR_X, VIEW_H - 34, t(lang, 'hud.hint'), {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: CYAN,
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(DEPTH.hud)
      .setAlpha(0.9);

    this.toastText = scene.add
      .text(VIEW_W / 2, VIEW_H - 96, '', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: CREAM,
        align: 'center',
      })
      .setOrigin(0.5, 0.5)
      .setScrollFactor(0)
      .setDepth(DEPTH.hud)
      .setAlpha(0)
      .setShadow(2, 2, '#000000', 3);

    this.drawEnergy();
  }

  setChapter(text: string, level: string): void {
    this.chapterText.setText(text);
    this.levelText.setText(level);
  }

  setShards(count: number): void {
    this.shardText.setText(t(this.lang, 'hud.shards', { n: `${count}/${totalShards()}` }));
  }

  setHp(hp: number, max: number): void {
    if (hp === this.hp && max === this.maxHp) return;
    this.hp = hp;
    this.maxHp = max;
    this.drawHp();
  }

  setEnergy(ratio: number, astral: boolean, locked: boolean): void {
    const clamped = Phaser.Math.Clamp(ratio, 0, 1);
    if (
      Math.abs(clamped - this.energyRatio) < 0.004 &&
      astral === this.astral &&
      locked === this.low
    ) {
      return;
    }
    this.energyRatio = clamped;
    this.astral = astral;
    this.low = locked;
    this.drawEnergy();
  }

  private drawEnergy(): void {
    const g = this.energyBar;
    const ratio = Math.max(0, this.energyRatio);
    g.clear();
    g.fillStyle(0x080a16, 0.8);
    g.fillRect(BAR_X - 2, BAR_Y - 2, BAR_W + 4, BAR_H + 4);
    g.lineStyle(1, 0x4b5f8a, 0.9);
    g.strokeRect(BAR_X - 2, BAR_Y - 2, BAR_W + 4, BAR_H + 4);

    const fill = Math.round((BAR_W - 4) * ratio);
    const colour = this.low ? 0x7a4a63 : ratio < 0.25 ? 0xd98a52 : 0x4fd6e6;
    g.fillStyle(colour, this.astral ? 1 : 0.9);
    g.fillRect(BAR_X, BAR_Y, fill, BAR_H);
    if (this.astral) {
      g.fillStyle(0xd8fbff, 0.35);
      g.fillRect(BAR_X, BAR_Y, fill, 4);
    }
    g.lineStyle(1, 0x081020, 0.7);
    for (let i = 1; i < 4; i += 1) {
      g.lineBetween(BAR_X + (BAR_W / 4) * i, BAR_Y, BAR_X + (BAR_W / 4) * i, BAR_Y + BAR_H);
    }

    this.energyLabel
      .setText(
        this.low
          ? `${t(this.lang, 'hud.energy')} · ${t(this.lang, 'hud.locked')}`
          : this.astral
            ? `${t(this.lang, 'hud.energy')} · ${t(this.lang, 'hud.astral')}`
            : t(this.lang, 'hud.energy')
      )
      .setColor(this.low ? BAD : this.astral ? CYAN : '#7f93b8');
  }

  private drawHp(): void {
    const g = this.hpBar;
    const max = Math.max(1, this.maxHp);
    const x = BAR_X + BAR_W + 26;
    const y = BAR_Y;
    g.clear();
    for (let i = 0; i < max; i += 1) {
      const filled = i < this.hp;
      g.fillStyle(filled ? 0xd95a6a : 0x2a2333, filled ? 1 : 0.85);
      g.fillRect(x + i * 15, y, 11, 11);
      g.lineStyle(1, 0x0a0812, 1);
      g.strokeRect(x + i * 15, y, 11, 11);
      if (filled) {
        g.fillStyle(0xffb0b8, 0.7);
        g.fillRect(x + i * 15 + 2, y + 2, 3, 2);
      }
    }
  }

  setHint(visible: boolean, projected: boolean): void {
    this.hint.setAlpha(visible ? 0.9 : 0);
    this.hint.setColor(projected ? CYAN : CREAM);
  }

  toast(text: string, tone: 'good' | 'bad' | 'plain' = 'plain'): void {
    this.toastText
      .setText(text)
      .setColor(tone === 'bad' ? BAD : tone === 'good' ? CYAN : CREAM)
      .setAlpha(1);
    this.toastTimer = 2.4;
  }

  update(dt: number): void {
    if (this.toastTimer <= 0) return;
    this.toastTimer -= dt;
    if (this.toastTimer <= 0.6) this.toastText.setAlpha(Math.max(0, this.toastTimer / 0.6));
  }

  destroy(): void {
    this.chapterText.destroy();
    this.levelText.destroy();
    this.energyBar.destroy();
    this.hpBar.destroy();
    this.energyLabel.destroy();
    this.shardText.destroy();
    this.hint.destroy();
    this.toastText.destroy();
  }
}
