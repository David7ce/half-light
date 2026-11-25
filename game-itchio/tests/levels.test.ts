import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CHAPTERS, levels, totalShards } from '../src/content/chapters.ts';
import { ASTRAL_SOLID, MATERIAL_SOLID, parseLevel } from '../src/content/level.ts';

test('every level parses and is 20 rows tall', () => {
  for (const level of levels()) {
    const parsed = parseLevel(level);
    assert.equal(parsed.height, 20, `${level.id} height`);
    assert.ok(parsed.width >= 40, `${level.id} width ${parsed.width}`);
    assert.ok(parsed.door, `${level.id} has a door`);
    assert.ok(parsed.player, `${level.id} has a spawn`);
  }
});

test('every level has ground under the spawn and under the door', () => {
  for (const level of levels()) {
    const parsed = parseLevel(level);
    const solids = new Set(
      parsed.tiles
        .filter((tile) => tile.kind === 'ground' || tile.kind === 'platform')
        .map((tile) => `${tile.tx},${tile.ty}`)
    );
    assert.ok(
      solids.has(`${parsed.player.tx},${parsed.player.ty + 1}`),
      `${level.id}: spawn at ${parsed.player.tx},${parsed.player.ty} has no floor`
    );
    assert.ok(
      solids.has(`${parsed.door.tx},${parsed.door.ty + 1}`),
      `${level.id}: door at ${parsed.door.tx},${parsed.door.ty} has no floor`
    );
  }
});

test('every ally marker has an object with the same tile and vice versa', () => {
  for (const chapter of CHAPTERS) {
    for (const level of chapter.levels) {
      const marks = new Set(
        parseLevel(level)
          .spawns.filter((spawn) => spawn.kind === 'ally')
          .map((spawn) => `${spawn.tx},${spawn.ty}`)
      );
      const specs = new Set(
        level.objects
          .filter((object) => object.type === 'ally')
          .map((object) => `${object.tx},${object.ty}`)
      );
      assert.deepEqual([...marks].sort(), [...specs].sort(), `${level.id} allies`);
    }
  }
});

test('both worlds keep a floor: ground is solid in each, walls only in one', () => {
  assert.ok(MATERIAL_SOLID.has('ground') && ASTRAL_SOLID.has('ground'));
  assert.ok(MATERIAL_SOLID.has('wall') && !ASTRAL_SOLID.has('wall'));
  assert.ok(!MATERIAL_SOLID.has('astral') && ASTRAL_SOLID.has('astral'));
});

test('three chapters, two levels each, and nine shards', () => {
  assert.equal(CHAPTERS.length, 3);
  for (const chapter of CHAPTERS) assert.equal(chapter.levels.length, 2);
  assert.equal(totalShards(), 9);
});

test('a ragged map is rejected by the parser', () => {
  const bad = { id: 'bad', name: { es: '', en: '' }, map: ['###', '####'], objects: [] };
  assert.throws(() => parseLevel(bad), /expected 3/);
});
