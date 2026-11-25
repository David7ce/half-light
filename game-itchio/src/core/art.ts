/**
 * Every visible pixel is generated here. No sprite sheets, no fonts, no files:
 * the repository is the whole game and there is nothing to license.
 *
 * Sprites are authored on a 16-unit grid and drawn at UNIT (2) pixels per unit,
 * which is what makes the picture read as pixel art on a 960×540 canvas.
 */
import Phaser from 'phaser';
import { UNIT } from '../config';
import { mulberry32 } from './rng';
import type { CharPalette } from '../types';

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------

export const INK = '#0b0a14';

export const STONE = {
  base: '#2a2440',
  dark: '#1c1830',
  mid: '#372f52',
  light: '#473c68',
  moss: '#5d7f6b',
  mossLight: '#82a888',
  edge: '#0f0c1b',
} as const;

export const ASTRAL_COLOURS = {
  wall: 0x6fd8ff,
  glow: 0x8fe6ff,
  spark: 0xd8fbff,
  veil: 0x1b2a6b,
  fog: 0x3f7fd0,
} as const;

export type Pose = 'idle' | 'walkA' | 'walkB' | 'jump' | 'fall';

// ---------------------------------------------------------------------------
// Pen: draws in art units, writes real pixels
// ---------------------------------------------------------------------------

export class Pen {
  readonly ctx: CanvasRenderingContext2D;
  readonly scale: number;

  constructor(ctx: CanvasRenderingContext2D, scale = UNIT) {
    this.ctx = ctx;
    this.scale = scale;
  }

  rect(x: number, y: number, w: number, h: number, colour: string): void {
    this.ctx.fillStyle = colour;
    this.ctx.fillRect(x * this.scale, y * this.scale, w * this.scale, h * this.scale);
  }

  px(x: number, y: number, colour: string): void {
    this.rect(x, y, 1, 1, colour);
  }

  /** Draws an ASCII sprite: `.` is transparent, every other char is a key. */
  rows(rows: readonly string[], palette: Record<string, string>, ox = 0, oy = 0): void {
    for (let y = 0; y < rows.length; y += 1) {
      const row = rows[y];
      for (let x = 0; x < row.length; x += 1) {
        const colour = palette[row[x]];
        if (colour) this.px(ox + x, oy + y, colour);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Texture helpers
// ---------------------------------------------------------------------------

export function makeTexture(
  scene: Phaser.Scene,
  key: string,
  wUnits: number,
  hUnits: number,
  draw: (pen: Pen) => void
): string {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const texture = scene.textures.createCanvas(key, wUnits * UNIT, hUnits * UNIT);
  if (!texture) throw new Error(`could not create texture ${key}`);
  const ctx = texture.getContext();
  ctx.imageSmoothingEnabled = false;
  draw(new Pen(ctx));
  texture.refresh();
  return key;
}

/** For backgrounds and gradients, where art units would only get in the way. */
export function makeRawTexture(
  scene: Phaser.Scene,
  key: string,
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D) => void
): string {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const texture = scene.textures.createCanvas(key, width, height);
  if (!texture) throw new Error(`could not create texture ${key}`);
  const ctx = texture.getContext();
  ctx.imageSmoothingEnabled = false;
  draw(ctx);
  texture.refresh();
  return key;
}

// ---------------------------------------------------------------------------
// Tiles
// ---------------------------------------------------------------------------

function speckle(pen: Pen, seed: number, count: number, colour: string, base = 0): void {
  const rng = mulberry32(seed);
  for (let i = 0; i < count; i += 1) {
    pen.px(base + Math.floor(rng() * 16), base + Math.floor(rng() * 16), colour);
  }
}

export function makeTiles(scene: Phaser.Scene): void {
  // Plain stone: brick courses with a lit top edge.
  for (let variant = 0; variant < 2; variant += 1) {
    makeTexture(scene, `tile-ground-${variant}`, 16, 16, (pen) => {
      pen.rect(0, 0, 16, 16, STONE.base);
      const rng = mulberry32(90 + variant * 17);
      for (let row = 0; row < 4; row += 1) {
        const y = row * 4;
        pen.rect(0, y, 16, 1, STONE.dark);
        const offset = row % 2 === 0 ? 0 : 4;
        for (let bx = offset; bx < 16; bx += 8) pen.rect(bx, y, 1, 4, STONE.dark);
        pen.rect(0, y + 1, 16, 1, STONE.mid);
      }
      speckle(pen, 33 + variant, 10, STONE.light);
      for (let i = 0; i < 6; i += 1) {
        pen.px(Math.floor(rng() * 16), Math.floor(rng() * 16), STONE.dark);
      }
    });
  }

  // Ground cap: moss on top of the stone, the thing that says "you can stand here".
  makeTexture(scene, 'tile-ground-top', 16, 16, (pen) => {
    pen.rect(0, 0, 16, 16, STONE.base);
    const rng = mulberry32(7);
    for (let row = 1; row < 4; row += 1) {
      pen.rect(0, row * 4, 16, 1, STONE.dark);
      for (let bx = (row % 2) * 4; bx < 16; bx += 8) pen.rect(bx, row * 4, 1, 4, STONE.dark);
    }
    pen.rect(0, 0, 16, 4, STONE.moss);
    pen.rect(0, 0, 16, 1, STONE.mossLight);
    for (let x = 0; x < 16; x += 1) {
      const drop = Math.floor(rng() * 3);
      pen.rect(x, 4, 1, drop, STONE.moss);
    }
    for (let i = 0; i < 5; i += 1) {
      pen.px(Math.floor(rng() * 16), 1 + Math.floor(rng() * 3), '#a9c9a4');
    }
  });

  // One-way-looking ledge, drawn as a slab with a metal lip.
  makeTexture(scene, 'tile-platform', 16, 6, (pen) => {
    pen.rect(0, 0, 16, 6, STONE.edge);
    pen.rect(0, 0, 16, 4, STONE.light);
    pen.rect(0, 0, 16, 1, '#6a5a92');
    pen.rect(0, 4, 16, 1, STONE.dark);
    pen.rect(2, 2, 3, 1, '#57497c');
    pen.rect(9, 2, 4, 1, '#57497c');
    pen.rect(14, 1, 1, 3, '#8a76c0');
  });

  // Astral slab: only solid while projected, so it is drawn as a ghost.
  makeTexture(scene, 'tile-astral', 16, 6, (pen) => {
    pen.rect(0, 0, 16, 6, '#0d2a44');
    pen.rect(0, 0, 16, 4, '#2f7fa8');
    pen.rect(0, 0, 16, 1, '#b6f4ff');
    pen.rect(1, 2, 5, 1, '#6fd8ff');
    pen.rect(9, 2, 4, 1, '#6fd8ff');
    pen.rect(0, 5, 16, 1, '#123f5e');
  });

  // A wall: the thing the astral body walks through. It reads as carved stone,
  // not as floor, so the player learns which surface is which.
  makeTexture(scene, 'tile-wall', 16, 16, (pen) => {
    pen.rect(0, 0, 16, 16, '#231c3a');
    pen.rect(0, 0, 16, 1, '#0e0a1a');
    pen.rect(0, 15, 16, 1, '#0e0a1a');
    for (let x = 0; x < 16; x += 4) {
      pen.rect(x, 0, 1, 16, '#171228');
      pen.rect(x + 1, 0, 1, 16, '#2e2650');
    }
    pen.rect(0, 7, 16, 1, '#191430');
    const rng = mulberry32(71);
    for (let i = 0; i < 8; i += 1) {
      pen.px(2 + Math.floor(rng() * 12), 2 + Math.floor(rng() * 12), '#3d3363');
    }
    // A rune, so the wall looks like it was made to hold something in.
    pen.rect(6, 4, 1, 5, '#4a3f75');
    pen.rect(7, 5, 2, 1, '#4a3f75');
    pen.rect(9, 4, 1, 5, '#4a3f75');
    pen.rect(7, 10, 2, 1, '#4a3f75');
  });

  makeTexture(scene, 'tile-hazard', 16, 8, (pen) => {
    for (let i = 0; i < 4; i += 1) {
      const x = i * 4;
      pen.rect(x, 0, 1, 4, '#6b2b3d');
      pen.rect(x + 1, 1, 1, 2, '#d85a6a');
      pen.rect(x + 2, 2, 1, 1, '#ff9aa4');
    }
    pen.rect(0, 4, 16, 4, '#241426');
    pen.rect(0, 4, 16, 1, '#4a2438');
  });

  makeTexture(scene, 'tile-pad', 16, 4, (pen) => {
    pen.rect(0, 0, 16, 4, '#120f1e');
    pen.rect(0, 0, 16, 3, '#5f6a8a');
    pen.rect(0, 0, 16, 1, '#9fb0d8');
    pen.rect(2, 2, 2, 1, '#2b3350');
    pen.rect(12, 2, 2, 1, '#2b3350');
  });
}

// ---------------------------------------------------------------------------
// Pickups and props
// ---------------------------------------------------------------------------

interface SpriteSpec {
  rows: readonly string[];
  palette: Record<string, string>;
}

const POTION_ROWS = [
  '..oooo..',
  '.#oooo#.',
  '.#....#.',
  '##....##',
  '#cccccc#',
  '#cCccCc#',
  '#cccccc#',
  '#cCccCc#',
  '.#cccc#.',
  '..####..',
] as const;

const SPRITES: Record<string, SpriteSpec> = {
  'pickup-energy': {
    rows: POTION_ROWS,
    palette: { '#': '#0d0a16', o: '#8a5a3c', c: '#39d6d0', C: '#c8fffb' },
  },
  'pickup-health': {
    rows: POTION_ROWS,
    palette: { '#': '#0d0a16', o: '#8a5a3c', c: '#e2496a', C: '#ffc2cf' },
  },
  shard: {
    rows: [
      '...##...',
      '..#LL#..',
      '.#LccL#.',
      '.#LccL#.',
      '..#cc#..',
      '..####..',
      '...#cc#.',
      '...#cc#.',
      '....##..',
      '........',
    ],
    palette: { '#': '#0d0a16', L: '#ffd88f', c: '#f2a94a' },
  },
  walker: {
    rows: [
      '....####....',
      '..##dddd##..',
      '.#dddddddd#.',
      '#dddddddddd#',
      '#ddEdddEddd#',
      '#dddddddddd#',
      '#dddddddddd#',
      '.#dddddddd#.',
      '..##dddd##..',
      '...#.#.#....',
      '..#..#..#...',
      '............',
    ],
    palette: { '#': '#0a0a12', d: '#3a2f52', E: '#ff8a5c' },
  },
  wisp: {
    rows: [
      '...LL...',
      '..LccL..',
      '.LccccL.',
      'LccCCccL',
      'LccCCccL',
      '.LccccL.',
      '..LccL..',
      '...LL...',
    ],
    palette: { L: '#2a6f9e', c: '#63d2ff', C: '#eafcff' },
  },
  ally: {
    rows: [
      '....####....',
      '...#LLLL#...',
      '...#L##L#...',
      '....####....',
      '...######...',
      '..#cccccc#..',
      '..#cCcccc#..',
      '..#cccccc#..',
      '..#cccccc#..',
      '..########..',
      '...#cccc#...',
      '...#cccc#...',
      '...#cccc#...',
      '..#cccccc#..',
      '..#cccccc#..',
      '..#cccccc#..',
      '..#cccccc#..',
      '..#cccccc#..',
      '..########..',
      '............',
    ],
    palette: { '#': '#0d0a16', L: '#e9cf9a', c: '#4b6f96', C: '#7fa3c8' },
  },
  altar: {
    rows: [
      '.......##.......',
      '......#cc#......',
      '......#cc#......',
      '.....######.....',
      '....##cccc##....',
      '....#cCcccc#....',
      '....########....',
      '...##########...',
      '..#LLLLLLLLLL#..',
      '..#LddddddddL#..',
      '..#LddddddddL#..',
      '..#LddddddddL#..',
      '..#LddddddddL#..',
      '..#LddddddddL#..',
      '..#LddddddddL#..',
      '..############..',
      '..#LLLLLLLLLL#..',
      '..############..',
    ],
    palette: { '#': '#0d0a16', L: '#6b5a8e', d: '#3a2f52', c: '#ffb44d', C: '#ffe7ad' },
  },
  door: {
    rows: [
      '.....######.....',
      '...##LLLLLL##...',
      '..#LL######LL#..',
      '.#LL#cccccc#LL#.',
      '.#L#cccccccc#L#.',
      '.#L#cCccccCc#L#.',
      '.#L#cccccccc#L#.',
      '.#L#ccCccccC#L#.',
      '.#L#cccccccc#L#.',
      '.#L#cccccccc#L#.',
      '.#L#cccccccc#L#.',
      '.#L#cccccccc#L#.',
      '.#L#cccccccc#L#.',
      '.#L#cccccccc#L#.',
      '.#L#cccccccc#L#.',
      '.#L#cccccccc#L#.',
      '.#LL########LL#.',
      '.#LLLLLLLLLLLL#.',
      '.##############.',
      '................',
    ],
    palette: { '#': '#0d0a16', L: '#7c6bb0', c: '#1b1440', C: '#c9b6ff' },
  },
  gear: {
    rows: [
      '.....####.....',
      '..#..####..#..',
      '.###.####.###.',
      '.############.',
      '.####....####.',
      '####..##..####',
      '####.####.####',
      '####.####.####',
      '####..##..####',
      '.####....####.',
      '.############.',
      '.###.####.###.',
      '..#..####..#..',
      '.....####.....',
    ],
    palette: { '#': '#6d6a92' },
  },
  spark: {
    rows: ['..##..', '.####.', '######', '######', '.####.', '..##..'],
    palette: { '#': '#e8fbff' },
  },
};

export function makeProps(scene: Phaser.Scene): void {
  for (const [key, spec] of Object.entries(SPRITES)) {
    const width = Math.max(...spec.rows.map((row) => row.length));
    makeTexture(scene, key, width, spec.rows.length, (pen) => {
      pen.rows(spec.rows, spec.palette);
    });
  }

  // The gear is drawn by hand because a string would be unreadable at this size.
  makeTexture(scene, 'gear', 16, 16, (pen) => {
    pen.rect(2, 0, 3, 3, '#6d6a92');
    pen.rect(11, 0, 3, 3, '#6d6a92');
    pen.rect(0, 2, 3, 3, '#6d6a92');
    pen.rect(13, 2, 3, 3, '#6d6a92');
    pen.rect(2, 13, 3, 3, '#6d6a92');
    pen.rect(11, 13, 3, 3, '#6d6a92');
    pen.rect(0, 11, 3, 3, '#6d6a92');
    pen.rect(13, 11, 3, 3, '#6d6a92');
    pen.rect(3, 3, 10, 10, '#4b4770');
    pen.rect(4, 4, 8, 8, '#3a3660');
    pen.rect(6, 6, 4, 4, '#1a1730');
    pen.rect(7, 7, 2, 2, '#8b86b8');
    pen.rect(4, 4, 8, 1, '#7d78a8');
  });

  // A soft radial glow, used for lights and for the astral aura.
  makeRawTexture(scene, 'glow', 64, 64, (ctx) => {
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.45, 'rgba(255,255,255,0.42)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
  });

  // Life: three of these, always.
  makeTexture(scene, 'heart', 7, 6, (pen) => {
    pen.rows(
      ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'],
      { '#': '#e04a60' }
    );
    pen.px(1, 1, '#ff9fae');
    pen.px(2, 1, '#ff9fae');
    pen.px(3, 2, '#ffd3da');
  });

  makeRawTexture(scene, 'fog', 256, 128, (ctx) => {
    const g = ctx.createRadialGradient(128, 64, 8, 128, 64, 118);
    g.addColorStop(0, 'rgba(150,190,255,0.55)');
    g.addColorStop(0.6, 'rgba(90,130,220,0.22)');
    g.addColorStop(1, 'rgba(40,60,140,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 128);
  });
}

// ---------------------------------------------------------------------------
// The hero: parametric, so a new character is a palette and six numbers
// ---------------------------------------------------------------------------

export const HERO_W = 16;
export const HERO_H = 24;

export function characterKey(id: string, pose: Pose): string {
  return `hero-${id}-${pose}`;
}

function drawHero(pen: Pen, p: CharPalette, pose: Pose): void {
  const walking = pose === 'walkA' || pose === 'walkB';
  const bob = pose === 'walkA' ? 1 : 0;
  const legFront = pose === 'walkA' ? 5 : pose === 'walkB' ? 4 : 5;
  const legBack = pose === 'walkA' ? 4 : pose === 'walkB' ? 5 : 5;

  // Cloak, drawn behind everything and flaring towards the floor.
  for (let y = 8 + bob; y < 21; y += 1) {
    const spread = Math.min(4, Math.floor((y - 8) / 3));
    pen.rect(8 - spread, y, 2 * spread, 1, p.clothDark);
  }
  pen.rect(3 + bob, 9, 2, 9, p.clothDark);

  // Legs.
  if (pose === 'jump') {
    pen.rect(5, 18, 2, 4, p.cloth);
    pen.rect(9, 19, 2, 3, p.cloth);
    pen.rect(5, 22, 3, 1, INK);
    pen.rect(9, 22, 3, 1, INK);
  } else if (pose === 'fall') {
    pen.rect(5, 18, 2, 4, p.cloth);
    pen.rect(9, 18, 2, 4, p.cloth);
    pen.rect(4, 22, 3, 1, INK);
    pen.rect(9, 22, 3, 1, INK);
  } else {
    pen.rect(5, 18, 2, legBack, p.cloth);
    pen.rect(9, 18, 2, legFront, p.cloth);
    pen.rect(4, 18 + legBack, 3, 1, INK);
    pen.rect(9, 18 + legFront, 3, 1, INK);
  }

  // Torso and belt.
  pen.rect(5, 8 + bob, 6, 9, p.cloth);
  pen.rect(5, 8 + bob, 6, 1, p.trim);
  pen.rect(5, 15 + bob, 6, 1, p.trim);
  pen.rect(6, 10 + bob, 1, 4, p.clothDark);
  pen.rect(9, 10 + bob, 1, 4, p.clothDark);

  // Arms.
  if (pose === 'jump') {
    pen.rect(3, 7, 2, 5, p.cloth);
    pen.rect(11, 7, 2, 5, p.cloth);
    pen.px(3, 7, p.skin);
    pen.px(12, 7, p.skin);
  } else if (walking) {
    const swing = pose === 'walkA' ? 1 : -1;
    pen.rect(3, 9 + swing, 2, 5, p.cloth);
    pen.rect(11, 9 - swing, 2, 5, p.cloth);
    pen.px(3, 13 + swing, p.skin);
    pen.px(12, 13 - swing, p.skin);
  } else {
    pen.rect(3, 9 + bob, 2, 5, p.cloth);
    pen.rect(11, 9 + bob, 2, 5, p.cloth);
    pen.px(3, 13 + bob, p.skin);
    pen.px(12, 13 + bob, p.skin);
  }

  // Head.
  pen.rect(5, 2 + bob, 6, 7, p.skin);
  pen.rect(6, 1 + bob, 4, 1, p.skin);
  pen.rect(6, 9 + bob, 4, 1, p.skin);
  pen.rect(4, 3 + bob, 1, 4, p.skin);
  pen.px(9, 5 + bob, p.eye);

  // Hair: the silhouette is what tells the three of them apart.
  pen.rect(5, 0 + bob, 6, 3, p.hair);
  pen.rect(4, 2 + bob, 2, 4, p.hair);
  pen.rect(10, 1 + bob, 2, 3, p.hair);
  pen.rect(5, 0 + bob, 3, 1, p.hairLight);
  pen.rect(11, 2 + bob, 1, 3, p.hairDark);

  // A couple of pixels of highlight, so the character is not a flat blob.
  pen.px(6, 12 + bob, p.hairLight);
  pen.px(9, 7 + bob, p.hairLight);
}

export function buildCharacterTextures(
  scene: Phaser.Scene,
  id: string,
  palette: CharPalette
): Record<Pose, string> {
  const poses: Pose[] = ['idle', 'walkA', 'walkB', 'jump', 'fall'];
  const out = {} as Record<Pose, string>;
  for (const pose of poses) {
    out[pose] = makeTexture(scene, characterKey(id, pose), HERO_W, HERO_H, (pen) =>
      drawHero(pen, palette, pose)
    );
  }
  return out;
}
