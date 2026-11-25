import Phaser from 'phaser';
import './style.css';
import { PHYSICS, VIEW_H, VIEW_W } from './config';
import { audio } from './audio/engine';
import { loadSettings } from './core/save';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { StoryScene } from './scenes/StoryScene';
import { TitleScene } from './scenes/TitleScene';
import { wireTouchPad } from './ui/touch';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: VIEW_W,
  height: VIEW_H,
  pixelArt: true,
  roundPixels: true,
  backgroundColor: '#080a1c',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: PHYSICS.gravity },
      debug: false,
    },
  },
  scene: [BootScene, TitleScene, StoryScene, GameScene],
});

// Browsers only allow audio after a gesture, so the first one anywhere starts it.
const unlock = () => {
  audio.start();
  audio.applyMute(loadSettings().mute);
  window.removeEventListener('pointerdown', unlock);
  window.removeEventListener('keydown', unlock);
};
window.addEventListener('pointerdown', unlock);
window.addEventListener('keydown', unlock);

const pad = document.getElementById('touch');
if (pad) {
  wireTouchPad(pad);
  if (window.matchMedia('(pointer: coarse)').matches) pad.hidden = false;
  window.addEventListener(
    'touchstart',
    () => {
      pad.hidden = false;
    },
    { once: true, passive: true }
  );
}

// Dev hook: a browser session (or a Playwright run) can read the live scene
// without guessing from pixels. Stripped from the production bundle.
if (import.meta.env.DEV) {
  (window as unknown as { __game: Phaser.Game }).__game = game;
  (window as unknown as { __audio: typeof audio }).__audio = audio;
}
