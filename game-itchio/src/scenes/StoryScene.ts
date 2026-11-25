import Phaser from 'phaser';
import { CHAPTERS, ENDING } from '../content/chapters';
import { t, lines } from '../content/strings';
import { music } from '../audio/music';
import { eraseSave, loadSettings, writeSave } from '../core/save';
import type { Run } from '../core/run';
import { VIEW_H, VIEW_W } from '../config';
import type { Lang } from '../types';

interface StoryData {
  run: Run;
  kind: 'story' | 'outro' | 'ending';
  chapterIndex: number;
}

/**
 * The cards between chapters. The story is the same for every character; only
 * the body changes.
 */
export class StoryScene extends Phaser.Scene {
  private run!: Run;
  private kind: 'story' | 'outro' | 'ending' = 'story';
  private chapterIndex = 0;
  private lang: Lang = 'es';
  private lineObjects: Phaser.GameObjects.Text[] = [];
  private allRevealed = false;
  private ready = false;

  constructor() {
    super('story');
  }

  init(data: StoryData): void {
    this.run = data.run;
    this.kind = data.kind;
    this.chapterIndex = data.chapterIndex ?? 0;
    this.lang = loadSettings().language;
  }

  create(): void {
    this.lineObjects = [];
    this.allRevealed = false;
    this.ready = false;

    this.add.image(-240, 0, 'bg-sky').setOrigin(0, 0).setAlpha(0.55);
    const veil = this.add.graphics();
    veil.fillStyle(0x05040c, 0.78);
    veil.fillRect(0, 0, VIEW_W, VIEW_H);

    const chapter = CHAPTERS[Math.min(this.chapterIndex, CHAPTERS.length - 1)];
    const isEnding = this.kind === 'ending';

    // Chapter number and name only for the intro/outro cards.
    if (!isEnding) {
      this.add
        .text(VIEW_W / 2, 128, t(this.lang, 'story.chapter', { n: `${this.chapterIndex + 1}` }), {
          fontFamily: 'monospace',
          fontSize: '13px',
          color: '#8fe6ff',
        })
        .setOrigin(0.5)
        .setLetterSpacing(8);

      this.add
        .text(VIEW_W / 2, 168, chapter.name[this.lang].toUpperCase(), {
          fontFamily: 'monospace',
          fontSize: '40px',
          color: '#f2e8d5',
        })
        .setOrigin(0.5)
        .setLetterSpacing(6)
        .setShadow(4, 4, '#0a0812', 6);

      this.add
        .text(VIEW_W / 2, 214, chapter.subtitle[this.lang], {
          fontFamily: 'monospace',
          fontSize: '15px',
          color: '#98a6c4',
        })
        .setOrigin(0.5);
    }

    const body = isEnding
      ? { es: [...ENDING.es, '', t(this.lang, 'story.thanks')], en: [...ENDING.en, '', t(this.lang, 'story.thanks')] }
      : this.kind === 'story'
        ? chapter.story
        : chapter.outro;

    const text = lines(this.lang, body);
    const startY = isEnding ? 180 : 292;
    const gap = 42;

    text.forEach((line, index) => {
      if (!line) return;
      const object = this.add
        .text(VIEW_W / 2, startY + index * gap, line, {
          fontFamily: 'monospace',
          fontSize: '19px',
          color: '#d9d2c4',
          align: 'center',
          wordWrap: { width: 720 },
        })
        .setOrigin(0.5)
        .setAlpha(0)
        .setShadow(2, 2, '#05040c', 4);
      this.lineObjects.push(object);
      this.tweens.add({
        targets: object,
        alpha: 1,
        y: object.y - 4,
        duration: 520,
        delay: 220 + index * 420,
        ease: 'Sine.easeOut',
      });
    });

    if (isEnding) {
      this.add
        .text(VIEW_W / 2, 96, t(this.lang, 'story.ending'), {
          fontFamily: 'monospace',
          fontSize: '14px',
          color: '#f2c46b',
        })
        .setOrigin(0.5)
        .setLetterSpacing(6);
    }

    const prompt = this.add
      .text(VIEW_W / 2, VIEW_H - 72, t(this.lang, 'story.next'), {
        fontFamily: 'monospace',
        fontSize: '17px',
        color: '#8fe6ff',
      })
      .setOrigin(0.5)
      .setAlpha(0);
    this.tweens.add({
      targets: prompt,
      alpha: 1,
      duration: 400,
      delay: 220 + text.length * 420,
    });
    this.time.delayedCall(220 + text.length * 420, () => {
      this.allRevealed = true;
    });

    music.play(chapter.theme);
    music.setAstral(false);
    music.setVolume(0.8);

    this.input.on('pointerdown', () => this.advance());
    const kb = this.input.keyboard;
    kb?.on('keydown-SPACE', () => this.advance());
    kb?.on('keydown-ENTER', () => this.advance());
    kb?.on('keydown-ESC', () => this.skip());

    this.time.delayedCall(320, () => {
      this.ready = true;
    });
  }

  private skip(): void {
    if (!this.ready) return;
    this.allRevealed = true;
    for (const line of this.lineObjects) line.setAlpha(1);
    this.advance();
  }

  private advance(): void {
    if (!this.ready) return;
    if (!this.allRevealed) {
      this.allRevealed = true;
      for (const line of this.lineObjects) line.setAlpha(1);
      return;
    }
    this.continue();
  }

  private continue(): void {
    this.ready = false;
    const run = this.run;

    if (this.kind === 'ending') {
      eraseSave();
      this.scene.start('title');
      return;
    }

    if (this.kind === 'outro') {
      const result = run.advance();
      if (result === 'chapter') {
        this.scene.start('story', { run, kind: 'story', chapterIndex: run.chapterIndex });
      } else {
        this.scene.start('story', { run, kind: 'ending', chapterIndex: run.chapterIndex });
      }
      return;
    }

    // Chapter intro: the altar at the start of every chapter is free.
    writeSave(run.toSave());
    this.scene.start('game', { run });
  }
}
