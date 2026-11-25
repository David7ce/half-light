import Phaser from 'phaser';
import { CHARACTERS } from '../content/characters';
import { buildCharacterTextures, makeProps, makeTiles } from '../core/art';
import { ensureBackdropTextures } from '../core/backdrop';

/**
 * Everything the game shows is generated here, once, before the title appears.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  create(): void {
    makeTiles(this);
    makeProps(this);
    ensureBackdropTextures(this);
    for (const character of CHARACTERS) {
      buildCharacterTextures(this, character.id, character.palette);
    }
    this.scene.start('title');
  }
}
