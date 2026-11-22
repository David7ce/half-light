import Phaser from 'phaser';
import { startAudio } from '../audio';
import { LEVELS } from '../level';

/**
 * Title and how-to-play, in Phaser rather than in the DOM so a scene change is
 * one call and there is no second source of truth for what is on screen.
 */
export class TitleScene extends Phaser.Scene {
  constructor() {
    super('title');
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#0b0d12');

    // The controls bar belongs to a run, not to the title.
    const hint = document.getElementById('hint');
    if (hint) hint.hidden = true;

    const centre = width / 2;

    this.add
      .text(centre, height * 0.24, 'HALF-LIGHT', {
        fontFamily: 'ui-monospace, Cascadia Mono, Consolas, monospace',
        fontSize: '58px',
        color: '#e8b06a',
      })
      .setOrigin(0.5)
      .setLetterSpacing(10);

    this.add
      .text(centre, height * 0.33, 'Game Off 2026  ·  theme SHIFT', {
        fontFamily: 'ui-monospace, Cascadia Mono, Consolas, monospace',
        fontSize: '14px',
        color: '#6f7888',
      })
      .setOrigin(0.5);

    this.add
      .text(
        centre,
        height * 0.47,
        'One person, two states.\n\n' +
          'The living walk on furniture but not through walls.\n' +
          'The dead walk through walls, coast, and stand on scaffolds.\n' +
          'Salt burns the dead.',
        {
          fontFamily: 'ui-monospace, Cascadia Mono, Consolas, monospace',
          fontSize: '16px',
          color: '#c9c2b4',
          align: 'center',
          lineSpacing: 6,
        }
      )
      .setOrigin(0.5);

    const prompt = this.add
      .text(centre, height * 0.75, 'Press Enter or click to begin', {
        fontFamily: 'ui-monospace, Cascadia Mono, Consolas, monospace',
        fontSize: '16px',
        color: '#9fd8ff',
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: prompt,
      alpha: { from: 1, to: 0.35 },
      duration: 1100,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });

    this.add
      .text(centre, height * 0.88, '← → move   ·   Space jump   ·   Shift cross over   ·   R restart   ·   M mute', {
        fontFamily: 'ui-monospace, Cascadia Mono, Consolas, monospace',
        fontSize: '12px',
        color: '#5f6675',
      })
      .setOrigin(0.5);

    const start = () => {
      startAudio();
      this.scene.start('game', { level: 0 });
    };
    this.input.keyboard?.once('keydown-ENTER', start);
    this.input.keyboard?.once('keydown-SPACE', start);
    this.input.once('pointerdown', start);

    // Dev only: jump straight to a room while designing it. Stripped from the
    // production bundle, so the jam build cannot skip a level.
    if (import.meta.env.DEV) {
      this.add
        .text(centre, height * 0.94, `dev: ${LEVELS.map((_, i) => i + 1).join(' ')} jumps to that room`, {
          fontFamily: 'ui-monospace, Cascadia Mono, Consolas, monospace',
          fontSize: '11px',
          color: '#3c4350',
        })
        .setOrigin(0.5);
      LEVELS.forEach((_, index) => {
        this.input.keyboard?.on(`keydown-${['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX'][index]}`, () => {
          startAudio();
          this.scene.start('game', { level: index });
        });
      });
    }
  }
}
