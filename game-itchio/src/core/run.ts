/**
 * The run: where the player is, what they carry and what the last altar saw.
 * Scenes read and mutate this; it is the only progress that gets persisted.
 */
import { CHAPTERS, ENDING } from '../content/chapters';
import { characterById } from '../content/characters';
import type {
  ChapterDef,
  CharacterDef,
  Checkpoint,
  LevelDef,
  LocalizedLines,
  SaveData,
} from '../types';

export type AdvanceResult = 'level' | 'chapter' | 'end';

export class Run {
  character: CharacterDef;
  chapterIndex = 0;
  levelIndex = 0;
  hp: number;
  energy: number;
  shards = new Set<string>();
  seen = new Set<string>();
  checkpoint: Checkpoint | null = null;

  constructor(characterId: string, save?: SaveData | null) {
    this.character = characterById(characterId);
    this.hp = this.character.stats.maxHp;
    this.energy = this.character.stats.maxEnergy;
    if (save) this.restore(save);
  }

  private restore(save: SaveData): void {
    this.chapterIndex = Math.min(save.chapterIndex, CHAPTERS.length - 1);
    this.levelIndex = Math.min(save.levelIndex, this.chapter.levels.length - 1);
    this.hp = Math.max(1, Math.min(save.hp, this.character.stats.maxHp));
    this.energy = Math.max(0, Math.min(save.energy, this.character.stats.maxEnergy));
    this.shards = new Set(save.shards);
    this.seen = new Set(save.seenStory);
    this.checkpoint = save.checkpoint;
  }

  get chapter(): ChapterDef {
    return CHAPTERS[this.chapterIndex];
  }

  get level(): LevelDef {
    return this.chapter.levels[this.levelIndex];
  }

  get isLastLevelOfChapter(): boolean {
    return this.levelIndex >= this.chapter.levels.length - 1;
  }

  /** Moves to whatever comes after the current level. */
  advance(): AdvanceResult {
    if (this.levelIndex < this.chapter.levels.length - 1) {
      this.levelIndex += 1;
      return 'level';
    }
    if (this.chapterIndex < CHAPTERS.length - 1) {
      this.chapterIndex += 1;
      this.levelIndex = 0;
      this.checkpoint = null;
      return 'chapter';
    }
    return 'end';
  }

  /** Restart the current room without touching progress. */
  restartLevel(): void {
    this.hp = this.character.stats.maxHp;
    this.energy = this.character.stats.maxEnergy;
  }

  toSave(now = Date.now()): SaveData {
    return {
      version: 1,
      character: this.character.id,
      chapterIndex: this.chapterIndex,
      levelIndex: this.levelIndex,
      checkpoint: this.checkpoint,
      hp: this.hp,
      energy: this.energy,
      shards: [...this.shards],
      seenStory: [...this.seen],
      savedAt: now,
    };
  }
}

export interface StoryCard {
  chapterIndex: number;
  kind: 'story' | 'outro' | 'ending';
  title: LocalizedLines;
}

export function cardFor(chapterIndex: number, kind: 'story' | 'outro' | 'ending'): StoryCard {
  if (kind === 'ending') {
    return { chapterIndex, kind, title: { es: ['Final'], en: ['End'] } };
  }
  const chapter = CHAPTERS[Math.min(chapterIndex, CHAPTERS.length - 1)];
  return { chapterIndex, kind, title: chapter[kind] };
}

export { ENDING };
