/**
 * The level is ASCII so it can be edited without opening a map maker, and so a
 * diff of the map is readable in a pull request.
 *
 * F  floor: solid for the living *and* the dead (the level's frame and ground)
 * #  wall: solid for the living, passed through by the dead
 * =  furniture: solid for the living, passed through by the dead
 * X  salt: harmless to the living, kills the dead
 * o  echo: one of the three things the door asks for
 * D  the door
 * S  where a death puts you back
 *
 * The rule the map teaches: the living walk on furniture but not through walls,
 * the dead walk through walls but not on furniture.
 */
export const TILE = 32;
export const COLS = 32;
export const ROWS = 18;

export const LEVEL: readonly string[] = [
  'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
  'F..............................F',
  'F..............................F',
  'F..............................F',
  'F..............................F',
  'F..............................F',
  'F..............................F',
  'F..............................F',
  'F..............................F',
  'F................XXX....#####..F',
  'F.....##.........XXX....#...#..F',
  'F.....##.........XXX....#...#..F',
  'F.....##....o....XXX....#.o.#..F',
  'F.....##.........XXXo...#...#..F',
  'F.S...##...====..XXX....#####.DF',
  'FFFFFFFFFFFF...FFFFFFFFFFFFFFFFF',
  'FFFFFFFFFFFF...FFFFFFFFFFFFFFFFF',
  'FFFFFFFFFFFF...FFFFFFFFFFFFFFFFF',
];

export type TileKind = 'floor' | 'wall' | 'furniture' | 'salt' | 'echo' | 'door' | 'spawn';

export interface Tile {
  kind: TileKind;
  x: number;
  y: number;
}

export interface ParsedLevel {
  tiles: Tile[];
  spawn: { x: number; y: number };
  door: { x: number; y: number };
  echoes: { x: number; y: number }[];
}

const KIND_BY_CHAR: Record<string, TileKind> = {
  F: 'floor',
  '#': 'wall',
  '=': 'furniture',
  X: 'salt',
  o: 'echo',
  D: 'door',
  S: 'spawn',
};

/** Parse and validate; a map with a short row must fail loudly, not silently. */
export function parseLevel(rows: readonly string[] = LEVEL): ParsedLevel {
  if (rows.length !== ROWS) throw new Error(`level has ${rows.length} rows, expected ${ROWS}`);

  const tiles: Tile[] = [];
  const echoes: { x: number; y: number }[] = [];
  let spawn: { x: number; y: number } | null = null;
  let door: { x: number; y: number } | null = null;

  rows.forEach((row, y) => {
    if (row.length !== COLS) throw new Error(`row ${y} has ${row.length} columns, expected ${COLS}`);
    [...row].forEach((char, x) => {
      if (char === '.') return; // empty air
      const kind = KIND_BY_CHAR[char];
      if (!kind) throw new Error(`unknown tile "${char}" at ${x},${y}`);
      if (kind === 'spawn') spawn = { x, y };
      else if (kind === 'door') door = { x, y };
      else if (kind === 'echo') echoes.push({ x, y });
      if (kind !== 'spawn' && kind !== 'echo' && kind !== 'door') tiles.push({ kind, x, y });
    });
  });

  if (!spawn) throw new Error('level has no spawn');
  if (!door) throw new Error('level has no door');
  return { tiles, spawn, door, echoes };
}

/** Centre of a tile in world pixels. */
export const centre = (tile: { x: number; y: number }) => ({
  x: tile.x * TILE + TILE / 2,
  y: tile.y * TILE + TILE / 2,
});
