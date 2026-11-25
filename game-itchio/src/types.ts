export type Facing = 1 | -1;

export type CharacterId = 'iris' | 'nao' | 'vero';

export interface CharPalette {
  skin: string;
  hair: string;
  hairLight: string;
  hairDark: string;
  cloth: string;
  clothDark: string;
  trim: string;
  eye: string;
}

export interface CharacterStats {
  speed: number;
  jump: number;
  maxHp: number;
  maxEnergy: number;
  drain: number;
  regen: number;
}

export interface CharacterDef {
  id: CharacterId;
  name: string;
  title: Localized;
  blurb: Localized;
  palette: CharPalette;
  stats: CharacterStats;
}

export type ThemeId = 'threshold' | 'wheels' | 'tower' | 'finale';

/** Every player-facing sentence exists in both languages, side by side. */
export interface Localized {
  es: string;
  en: string;
}

export interface LocalizedLines {
  es: string[];
  en: string[];
}

export interface MoverSpec {
  type: 'mover';
  /** Tile coordinates of the platform's left end. */
  tx: number;
  ty: number;
  axis: 'x' | 'y';
  /** Travel in tiles. */
  distance: number;
  /** Seconds for a full round trip. */
  period: number;
  /** Tiles long. */
  length?: number;
  phase?: number;
}

export interface SpinnerSpec {
  type: 'spinner';
  tx: number;
  ty: number;
  radius: number;
  pads: number;
  /** Seconds per revolution; negative spins the other way. */
  period: number;
}

export interface AllySpec {
  type: 'ally';
  tx: number;
  ty: number;
  name: string;
  lines: LocalizedLines;
  /** Energy restored the first time the player talks to them. */
  gift?: number;
}

export type LevelObject = MoverSpec | SpinnerSpec | AllySpec;

export interface LevelDef {
  id: string;
  name: Localized;
  /** ASCII rows, all the same length. See `src/content/level.ts`. */
  map: string[];
  objects: LevelObject[];
}

export interface ChapterDef {
  id: string;
  name: Localized;
  subtitle: Localized;
  /** Shown before the chapter's first level. */
  story: LocalizedLines;
  /** Shown on the card after the chapter's last level. */
  outro: LocalizedLines;
  theme: ThemeId;
  levels: LevelDef[];
}

export interface Checkpoint {
  chapterIndex: number;
  levelIndex: number;
  x: number;
  y: number;
}

export interface SaveData {
  version: 1;
  character: CharacterId;
  chapterIndex: number;
  levelIndex: number;
  checkpoint: Checkpoint | null;
  hp: number;
  energy: number;
  shards: string[];
  seenStory: string[];
  savedAt: number;
}

export interface Settings {
  mute: boolean;
  language: Lang;
}

export type Lang = 'es' | 'en';
