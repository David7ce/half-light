import Phaser from 'phaser';
import { DEPTH, VIEW_H, VIEW_W } from '../config';
import type { Lang } from '../types';
import { t } from '../content/strings';

/**
 * A dialogue box with a typewriter. The scene pauses while it is open; pressing
 * the action once finishes the line, again moves on.
 */
export class Dialogue {
  private readonly box: Phaser.GameObjects.Container;
  private readonly body: Phaser.GameObjects.Text;
  private readonly speaker: Phaser.GameObjects.Text;
  private readonly hint: Phaser.GameObjects.Text;
  private readonly lang: Lang;
  private lines: string[] = [];
  private index = 0;
  private revealed = 0;
  private open = false;
  private onClose: (() => void) | null = null;

  constructor(scene: Phaser.Scene, lang: Lang) {
    this.lang = lang;
    const width = 840;
    const height = 132;
    const x = (VIEW_W - width) / 2;
    const y = VIEW_H - height - 54;

    const panel = scene.add.graphics();
    panel.fillStyle(0x070610, 0.92);
    panel.fillRect(0, 0, width, height);
    panel.lineStyle(2, 0x5b6a94, 0.9);
    panel.strokeRect(1, 1, width - 2, height - 2);
    panel.lineStyle(1, 0x8fe6ff, 0.35);
    panel.strokeRect(6, 6, width - 12, height - 12);

    this.speaker = scene.add.text(22, 14, '', {
      fontFamily: 'monospace',
      fontSize: '15px',
      color: '#f2c46b',
    });
    this.body = scene.add.text(22, 42, '', {
      fontFamily: 'monospace',
      fontSize: '17px',
      color: '#f2e8d5',
      wordWrap: { width: width - 44 },
      lineSpacing: 6,
    });
    this.hint = scene.add
      .text(width - 20, height - 26, t(lang, 'dialogue.more'), {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#7f93b8',
      })
      .setOrigin(1, 0);

    this.box = scene.add
      .container(x, y, [panel, this.speaker, this.body, this.hint])
      .setScrollFactor(0)
      .setDepth(DEPTH.hud + 5)
      .setVisible(false);
  }

  get isOpen(): boolean {
    return this.open;
  }

  show(speaker: string, lines: string[], onClose?: () => void): void {
    this.lines = lines.filter((line) => line.length > 0);
    this.index = 0;
    this.revealed = 0;
    this.onClose = onClose ?? null;
    this.open = true;
    this.speaker.setText(speaker.toUpperCase());
    this.body.setText('');
    this.hint.setText(t(this.lang, 'dialogue.more')).setAlpha(0.7);
    this.box.setVisible(true);
  }

  /** Returns true when the advance input was consumed. */
  update(dt: number, advance: boolean): boolean {
    if (!this.open) return false;
    const line = this.lines[this.index] ?? '';
    let consumed = false;

    if (this.revealed < line.length) {
      this.revealed = Math.min(line.length, this.revealed + dt * 68);
      this.body.setText(line.slice(0, Math.floor(this.revealed)));
      if (advance) {
        this.revealed = line.length;
        this.body.setText(line);
        consumed = true;
      }
    } else if (advance) {
      consumed = true;
      this.index += 1;
      if (this.index >= this.lines.length) {
        this.close();
      } else {
        this.revealed = 0;
        this.body.setText('');
      }
    }

    const last = this.index >= this.lines.length - 1;
    this.hint
      .setText(t(this.lang, last ? 'dialogue.close' : 'dialogue.more'))
      .setAlpha(this.revealed >= line.length ? 0.85 : 0.3);
    return consumed;
  }

  close(): void {
    if (!this.open) return;
    this.open = false;
    this.box.setVisible(false);
    const done = this.onClose;
    this.onClose = null;
    done?.();
  }

  destroy(): void {
    this.box.destroy(true);
  }
}
