import Phaser from 'phaser';
import './style.css';
import { GameScene } from './scenes/GameScene';
import { wireTouchPad } from './touch';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 1024,
  height: 576,
  backgroundColor: '#15110d',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 1400 },
      debug: false,
    },
  },
  scene: [GameScene],
});

// Dev-only hook so a browser session (or a Playwright run) can read the scene
// without guessing from pixels. It is stripped from the production bundle.
if (import.meta.env.DEV) {
  (window as unknown as { __game: Phaser.Game }).__game = game;
}

const pad = document.getElementById('touch');
if (pad) {
  wireTouchPad(pad);
  // Coarse pointers are phones and tablets; anything else gets the pad on the
  // first real touch anyway, which covers touchscreen laptops and emulators.
  if (window.matchMedia('(pointer: coarse)').matches) pad.hidden = false;
  window.addEventListener(
    'touchstart',
    () => {
      pad.hidden = false;
    },
    { once: true, passive: true }
  );
}
