/**
 * Levels are ASCII so they can be edited without opening a map maker, and so a
 * diff of a map is readable in a pull request.
 *
 * F  floor: solid for the living *and* the dead (the level's frame and ground)
 * #  wall: solid for the living, passed through by the dead
 * =  furniture: solid for the living, passed through by the dead
 * g  scaffold: solid for the dead, passed through by the living (they see it faint)
 * X  salt: harmless to the living, kills the dead
 * o  echo: the door wants all of them
 * D  the door
 * S  where a death puts you back
 *
 * The rule the maps teach: living matter (walls, furniture) holds the living and
 * not the dead; dead matter (scaffolds) holds the dead and not the living; the
 * floor is the one thing both stand on, and salt burns the dead.
 */
export const TILE = 32;
export const COLS = 32;
export const ROWS = 18;

export interface LevelDefinition {
  name: string;
  rows: readonly string[];
}

export type TileKind = 'floor' | 'wall' | 'furniture' | 'ghost' | 'salt' | 'echo' | 'door' | 'spawn';

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
  g: 'ghost',
  X: 'salt',
  o: 'echo',
  D: 'door',
  S: 'spawn',
};

/**
 * One screen per level. Every echo except the sealed one in The Hall sits at
 * walking height on purpose: these are puzzle rewards, not platforming tests.
 */
export const LEVELS: readonly LevelDefinition[] = [
  {
    name: 'The Hall',
    rows: [
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
      'F.....##.........XXX....#.o.#..F',
      'F.....##....o....XXX....#...#..F',
      'F.S...##..=====..XXXo...#####.DF',
      'FFFFFFFFFF.....FFFFFFFFFFFFFFFFF',
      'FFFFFFFFFF.....FFFFFFFFFFFFFFFFF',
      'FFFFFFFFFF.....FFFFFFFFFFFFFFFFF',
    ],
  },
  {
    name: 'The Kitchen',
    rows: [
      'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
      'F..............................F',
      'F.......XXX....................F',
      'F.......XXX....................F',
      'F.......XXX....................F',
      'F.......XXX....................F',
      'F.......XXX....................F',
      'F.S...o.XXX....................F',
      'FFFFFFFFFFFFF======FFFFFFFFFFFFF',
      'F..................##..........F',
      'F..................##..........F',
      'F..................##..........F',
      'F..................##..........F',
      'F..................##..........F',
      'F..................##o.......D.F',
      'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
      'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
      'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
    ],
  },
  {
    name: 'The Cellar',
    rows: [
      'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
      'F..............................F',
      'F..............................F',
      'F..............................F',
      'F..............................F',
      'F..............................F',
      'F..............................F',
      'F..........#...................F',
      'F..........#...................F',
      'F..........#.........XX....##..F',
      'F..........#.........XX....##..F',
      'F..........#.........XX....##..F',
      'F..........#.........XX....##..F',
      'F..........#.........XX....##..F',
      'F.S........#.....o...XX.o..##.DF',
      'FFFFFFFFFF...FFFFFFFFFFFFFFFFFFF',
      'FFFFFFFFFF...FFFFFFFFFFFFFFFFFFF',
      'FFFFFFFFFF...FFFFFFFFFFFFFFFFFFF',
    ],
  },
  {
    name: 'The Scaffold',
    rows: [
      'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
      'F..............................F',
      'F..............................F',
      'F..............................F',
      'F..............................F',
      'F..............................F',
      'F..............................F',
      'F..............................F',
      'F..............................F',
      'F....................XX........F',
      'F....................XX........F',
      'F....................XX........F',
      'F.........o..ggg.....XX........F',
      'F........gggg........XX........F',
      'F.S..................XX.o.....DF',
      'FFFFFFFFF.......FFFFFFFFFFFFFFFF',
      'FFFFFFFFF.......FFFFFFFFFFFFFFFF',
      'FFFFFFFFF.......FFFFFFFFFFFFFFFF',
    ],
  },
];

/** Parse and validate; a map with a short row must fail loudly, not silently. */
export function parseLevel(rows: readonly string[] = LEVELS[0].rows): ParsedLevel {
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
