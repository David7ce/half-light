/**
 * The ASCII map is the level. One character is one tile.
 *
 * Rows are trimmed and padded on the right with empty tiles, so a map can be
 * authored left to right; the width is the longest row. `tests/levels.test.ts`
 * pins every shipped level to the same 56×20 grid, which is what catches a row
 * that grew by a character.
 */
import type { LevelDef } from '../types';

export type TileKind = 'ground' | 'wall' | 'platform' | 'astral' | 'hazard';

export interface ParsedTile {
  kind: TileKind;
  tx: number;
  ty: number;
}

export type SpawnKind = 'potion' | 'health' | 'shard' | 'walker' | 'wisp' | 'altar' | 'door' | 'ally';

export interface SpawnPoint {
  kind: SpawnKind;
  tx: number;
  ty: number;
  /** Stable id: level + coordinates, so a collected shard stays collected. */
  id: string;
}

export interface ParsedLevel {
  width: number;
  height: number;
  tiles: ParsedTile[];
  spawns: SpawnPoint[];
  player: { tx: number; ty: number };
  door: { tx: number; ty: number };
  altar: { tx: number; ty: number } | null;
}

/**
 * Two worlds, two sets of solids. Ground and ledges exist in both; walls are
 * only real in the material world and astral slabs only while projected.
 */
export const MATERIAL_SOLID: ReadonlySet<TileKind> = new Set<TileKind>([
  'ground',
  'wall',
  'platform',
]);

export const ASTRAL_SOLID: ReadonlySet<TileKind> = new Set<TileKind>([
  'ground',
  'platform',
  'astral',
]);

export function parseTemplate(template: string): string[] {
  const rows = template.replace(/\r/g, '').split('\n').map((row) => row.trim());
  while (rows.length > 0 && rows[0] === '') rows.shift();
  while (rows.length > 0 && rows[rows.length - 1] === '') rows.pop();
  if (rows.length === 0) throw new Error('map template is empty');
  const width = Math.max(...rows.map((row) => row.length));
  return rows.map((row) => row.padEnd(width, '.'));
}

const SPAWN_CHARS: Record<string, SpawnKind> = {
  p: 'potion',
  '+': 'health',
  '*': 'shard',
  e: 'walker',
  w: 'wisp',
  n: 'ally',
  S: 'altar',
  D: 'door',
};

export function parseLevel(level: LevelDef): ParsedLevel {
  const width = level.map[0]?.length ?? 0;
  if (width === 0) throw new Error(`level ${level.id} has no map`);

  const tiles: ParsedTile[] = [];
  const spawns: SpawnPoint[] = [];
  let player: { tx: number; ty: number } | null = null;
  let door: { tx: number; ty: number } | null = null;
  let altar: { tx: number; ty: number } | null = null;

  level.map.forEach((row, ty) => {
    if (row.length !== width) {
      throw new Error(
        `level ${level.id} row ${ty} is ${row.length} wide, expected ${width}: "${row}"`
      );
    }
    for (let tx = 0; tx < row.length; tx += 1) {
      const char = row[tx];
      if (char === '.' || char === ' ') continue;

      if (char === '#') tiles.push({ kind: 'ground', tx, ty });
      else if (char === 'W') tiles.push({ kind: 'wall', tx, ty });
      else if (char === '=') tiles.push({ kind: 'platform', tx, ty });
      else if (char === '~') tiles.push({ kind: 'astral', tx, ty });
      else if (char === '^') tiles.push({ kind: 'hazard', tx, ty });
      else if (char === 'P') player = { tx, ty };
      else if (char === 'D') {
        if (door) throw new Error(`level ${level.id} has more than one door`);
        door = { tx, ty };
      } else {
        const kind = SPAWN_CHARS[char];
        if (!kind) throw new Error(`level ${level.id}: unknown tile "${char}" at ${tx},${ty}`);
        spawns.push({ kind, tx, ty, id: `${level.id}:${tx},${ty}` });
        if (kind === 'altar') altar = { tx, ty };
      }
    }
  });

  if (!player) throw new Error(`level ${level.id} has no player spawn (P)`);
  if (!door) throw new Error(`level ${level.id} has no door (D)`);

  return { width, height: level.map.length, tiles, spawns, player, door, altar };
}
