import { SAVE_KEY, SETTINGS_KEY } from '../config';
import type { SaveData, Settings } from '../types';

const DEFAULT_SETTINGS: Settings = { mute: false, language: 'es' };

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private mode and full quotas are not a reason to crash a game.
  }
}

export function loadSettings(): Settings {
  return { ...DEFAULT_SETTINGS, ...(read<Partial<Settings>>(SETTINGS_KEY) ?? {}) };
}

export function saveSettings(settings: Settings): void {
  write(SETTINGS_KEY, settings);
}

export function loadSave(): SaveData | null {
  const save = read<SaveData>(SAVE_KEY);
  if (!save || save.version !== 1) return null;
  return save;
}

export function writeSave(save: SaveData): void {
  write(SAVE_KEY, save);
}

export function eraseSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // ignore
  }
}
