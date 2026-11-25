import Phaser from 'phaser';
import { CHARACTERS } from '../content/characters';
import { t } from '../content/strings';
import { audio } from '../audio/engine';
import { music } from '../audio/music';
import { characterKey } from '../core/art';
import { loadSave, eraseSave, loadSettings, saveSettings } from '../core/save';
import { Run } from '../core/run';
import { gamepad } from '../core/gamepad';
import { VIEW_H, VIEW_W } from '../config';
import type { CharacterDef, Lang } from '../types';
import type { SaveData } from '../types';

interface TitleData {
  selected?: number;
}

const CARD_W = 258;
const CARD_H = 196;
const CARD_Y = 348;

export class TitleScene extends Phaser.Scene {
  private lang: Lang = 'es';
  private selected = 0;
  private cards: Phaser.GameObjects.Container[] = [];
  private save: SaveData | null = null;
  private starting = false;

  constructor() {
    super('title');
  }

  init(data: TitleData): void {
    const settings = loadSettings();
    this.lang = settings.language;
    this.selected = Math.min(data.selected ?? 0, CHARACTERS.length - 1);
    this.save = loadSave();
    this.cards = [];
    this.starting = false;
  }

  create(): void {
    audio.start();
    audio.applyMute(loadSettings().mute);
    music.play('menu');
    music.setAstral(false);
    music.setVolume(0.9);

    this.add.image(-240, 0, 'bg-sky').setOrigin(0, 0);
    this.add.image(-240, 0, 'bg-far').setOrigin(0, 0).setAlpha(0.8);
    this.add.image(-240, 0, 'bg-near').setOrigin(0, 0).setAlpha(0.6);

    const veil = this.add.graphics();
    veil.fillStyle(0x05040c, 0.38);
    veil.fillRect(0, 0, VIEW_W, VIEW_H);

    this.add
      .text(VIEW_W / 2, 82, 'GAME ITCHIO', {
        fontFamily: 'monospace',
        fontSize: '54px',
        color: '#f2e8d5',
      })
      .setOrigin(0.5)
      .setLetterSpacing(10)
      .setShadow(4, 4, '#0a0812', 6);

    this.add
      .text(VIEW_W / 2, 132, t(this.lang, 'title.subtitle').toUpperCase(), {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#8fe6ff',
      })
      .setOrigin(0.5)
      .setLetterSpacing(7);

    this.add
      .text(VIEW_W / 2, 162, t(this.lang, 'title.tagline'), {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#b9c4d8',
      })
      .setOrigin(0.5);

    this.add
      .text(VIEW_W / 2, 194, t(this.lang, 'title.tip'), {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#8fa2c4',
        align: 'center',
        wordWrap: { width: 720 },
      })
      .setOrigin(0.5);

    this.add
      .text(VIEW_W / 2, 232, t(this.lang, 'title.choose'), {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#7f93b8',
      })
      .setOrigin(0.5)
      .setLetterSpacing(4);

    CHARACTERS.forEach((character, index) => this.buildCard(character, index));

    const buttonsY = 480;
    const withSave = this.save !== null;
    const newX = withSave ? VIEW_W / 2 - 150 : VIEW_W / 2;
    const continueX = VIEW_W / 2 + 150;

    this.button(newX, buttonsY, t(this.lang, 'title.new'), () => this.begin(false));
    if (this.save) {
      this.button(continueX, buttonsY, t(this.lang, 'title.continue'), () => this.begin(true));
    }

    this.add
      .text(24, VIEW_H - 22, t(this.lang, 'title.controls'), {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#98a6c4',
      })
      .setOrigin(0, 1);

    this.add
      .text(VIEW_W - 24, 20, `${t(this.lang, 'title.lang')}: ${this.lang.toUpperCase()} · L`, {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#7f93b8',
      })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.toggleLang());

    this.add
      .text(VIEW_W - 24, 40, t(this.lang, 'title.jam'), {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#6f7f9e',
      })
      .setOrigin(1, 0);

    if (this.save) {
      const chapter = this.save.chapterIndex + 1;
      this.add
        .text(
          24,
          20,
          t(this.lang, 'title.saved', {
            chapter: `${chapter}`,
            name: CHARACTERS.find((c) => c.id === this.save?.character)?.name ?? '',
          }),
          {
            fontFamily: 'monospace',
            fontSize: '12px',
            color: '#8fe6ff',
          }
        )
        .setOrigin(0, 0);
      this.add
        .text(24, 38, `${t(this.lang, 'title.erase')} · X`, {
          fontFamily: 'monospace',
          fontSize: '11px',
          color: '#7f93b8',
        })
        .setOrigin(0, 0)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.erase());
    }

    this.refresh();

    const kb = this.input.keyboard;    kb?.on('keydown-LEFT', () => this.step(-1));
    kb?.on('keydown-A', () => this.step(-1));
    kb?.on('keydown-RIGHT', () => this.step(1));
    kb?.on('keydown-D', () => this.step(1));
    kb?.on('keydown-ENTER', () => this.begin(false));
    kb?.on('keydown-SPACE', () => this.begin(false));
    kb?.on('keydown-C', () => this.begin(true));
    kb?.on('keydown-L', () => this.toggleLang());
    kb?.on('keydown-M', () => this.toggleMute());
    kb?.on('keydown-X', () => this.erase());
  }

  private button(x: number, y: number, label: string, action: () => void): void {
    const text = this.add
      .text(x, y, label, {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#f2c46b',
        backgroundColor: '#151029',
        padding: { x: 20, y: 9 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    text.on('pointerover', () => text.setColor('#ffffff'));
    text.on('pointerout', () => text.setColor('#f2c46b'));
    text.on('pointerdown', action);
  }

  private buildCard(character: CharacterDef, index: number): void {
    const total = CHARACTERS.length;
    const x = VIEW_W / 2 + (index - (total - 1) / 2) * (CARD_W + 26);

    const panel = this.add.graphics();
    const portrait = this.add
      .image(0, -84, characterKey(character.id, 'idle'))
      .setScale(1.55)
      .setOrigin(0.5, 0);
    const name = this.add
      .text(0, 6, character.name.toUpperCase(), {
        fontFamily: 'monospace',
        fontSize: '17px',
        color: '#f2e8d5',
      })
      .setOrigin(0.5);
    const role = this.add
      .text(0, 26, character.title[this.lang], {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#8fe6ff',
      })
      .setOrigin(0.5);
    const blurb = this.add
      .text(0, 44, character.blurb[this.lang], {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#9aa8c6',
        align: 'center',
        wordWrap: { width: CARD_W - 36 },
        lineSpacing: 3,
      })
      .setOrigin(0.5, 0);

    const container = this.add.container(x, CARD_Y, [panel, portrait, name, role, blurb]);
    container.setSize(CARD_W, CARD_H);
    container.setInteractive(
      new Phaser.Geom.Rectangle(-CARD_W / 2, -CARD_H / 2 + 6, CARD_W, CARD_H),
      Phaser.Geom.Rectangle.Contains
    );
    container.on('pointerdown', () => {
      this.selected = index;
      this.refresh();
      this.begin(false);
    });
    container.on('pointerover', () => {
      this.selected = index;
      this.refresh();
    });
    this.cards.push(container);
  }

  private step(direction: number): void {
    this.selected = Phaser.Math.Wrap(this.selected + direction, 0, CHARACTERS.length);
    this.refresh();
  }

  private refresh(): void {
    this.cards.forEach((card, index) => {
      const panel = card.list[0] as Phaser.GameObjects.Graphics;
      const selected = index === this.selected;
      panel.clear();
      panel.fillStyle(selected ? 0x1b1636 : 0x0d0b1a, selected ? 0.92 : 0.72);
      panel.fillRect(-CARD_W / 2, -CARD_H / 2 + 6, CARD_W, CARD_H);
      panel.lineStyle(2, selected ? 0x8fe6ff : 0x3a3358, selected ? 1 : 0.8);
      panel.strokeRect(-CARD_W / 2, -CARD_H / 2 + 6, CARD_W, CARD_H);
      if (selected) {
        panel.lineStyle(1, 0xf2c46b, 0.5);
        panel.strokeRect(-CARD_W / 2 + 5, -CARD_H / 2 + 11, CARD_W - 10, CARD_H - 10);
      }
      card.setScale(selected ? 1 : 0.94);
    });
  }

  private begin(continueSave: boolean): void {
    if (this.starting) return;
    this.starting = true;
    audio.start();
    if (continueSave && this.save) {
      const run = new Run(this.save.character, this.save);
      this.scene.start('game', { run, respawn: true });
      return;
    }
    const character = CHARACTERS[this.selected];
    const run = new Run(character.id);
    this.scene.start('story', { run, kind: 'story', chapterIndex: 0 });
  }

  private toggleLang(): void {
    this.lang = this.lang === 'es' ? 'en' : 'es';
    saveSettings({ ...loadSettings(), language: this.lang });
    this.scene.restart({ selected: this.selected });
  }

  private toggleMute(): void {
    const muted = audio.toggleMute();
    saveSettings({ ...loadSettings(), mute: muted });
  }

  private erase(): void {
    eraseSave();
    this.save = null;
    this.scene.restart({ selected: this.selected });
  }

  update(): void {
    gamepad.update();
    const pressed = gamepad.pressed;
    if (pressed.left) this.step(-1);
    if (pressed.right) this.step(1);
    if (pressed.jump || pressed.astral) this.begin(false);
  }
}
