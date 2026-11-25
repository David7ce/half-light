/** A tiny typed emitter: systems talk through events instead of holding references. */
export type Listener<T> = (payload: T) => void;

export class Emitter<Events extends object> {
  private readonly listeners = new Map<keyof Events, Set<Listener<never>>>();

  on<K extends keyof Events>(key: K, fn: Listener<Events[K]>): () => void {
    let set = this.listeners.get(key);
    if (!set) {
      set = new Set();
      this.listeners.set(key, set);
    }
    set.add(fn as Listener<never>);
    return () => this.off(key, fn);
  }

  once<K extends keyof Events>(key: K, fn: Listener<Events[K]>): void {
    const off = this.on(key, (payload) => {
      off();
      fn(payload);
    });
  }

  off<K extends keyof Events>(key: K, fn: Listener<Events[K]>): void {
    this.listeners.get(key)?.delete(fn as Listener<never>);
  }

  emit<K extends keyof Events>(key: K, payload: Events[K]): void {
    const set = this.listeners.get(key);
    if (!set) return;
    for (const fn of [...set]) (fn as Listener<Events[K]>)(payload);
  }

  clear(): void {
    this.listeners.clear();
  }
}

export interface GameEvents {
  'astral:enter': { free: boolean };
  'astral:exit': { reason: 'manual' | 'empty' | 'hurt' | 'level' };
  'astral:denied': { reason: 'empty' | 'burnout' };
  'energy:changed': { value: number; max: number };
  'hp:changed': { value: number; max: number };
  'potion:taken': { kind: 'energy' | 'health' };
  'shard:taken': { id: string; total: number };
  'enemy:stomped': { id: string };
  'player:hurt': { from: number };
  'player:died': undefined;
  'checkpoint:saved': { label: string };
  'level:complete': { chapterIndex: number; levelIndex: number };
  'dialogue:open': { speaker: string; lines: string[] };
  'dialogue:close': undefined;
  toast: { text: string; tone?: 'good' | 'bad' | 'plain' };
}

export type Bus = Emitter<GameEvents>;
