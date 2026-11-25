# Game Itchio

A pixel-art platformer about **astral projection**, made for
[Game Off 2026](https://itch.io/jam/game-off-2026) (theme **SHIFT**). It is the
second entry in this repository, next to [Half-Light](../README.md).

You are an oneironaut climbing a tower that stopped at midnight. Your body cannot
cross its walls; your shadow can. Hold **Shift** to leave the body: the world
slows to a crawl, the walls stop being walls, and a bar pays for every second.

## Play

- `←` `→` or `A` `D` — walk
- `Space`, `↑` or `W` — jump (hold for height, tap for a short hop)
- `Shift` — astral projection, **held** while you want it
- `Esc` — pause · `R` — restart the room · `M` — mute · `L` — language (on the title)
- On a phone the on-screen pad appears: left, right, jump, astral.

## The two worlds

| | Material | Astral |
| --- | --- | --- |
| Ground, ledges (`#`, `=`) | solid | solid |
| Walls (`W`) | solid | **pass through** |
| Astral slabs (`~`) | you see a faint outline | solid, walk on them |
| Spikes (`^`) | hurt | hurt |
| Shades (`e`) | hurt on touch | float past them, harmless |
| Wisps (`w`) | harmless | **hurt on touch** |
| Time | normal | ×2.5 slower, the avatar keeps 1.55× speed |

The astral bar drains while projected (24/s, characters vary) and refills after a
short delay. Empty it and projection locks for a moment. Potions refill it; health
potions add a life; shards are memory fragments that also give a little energy.

You cannot come back to the body inside a wall: the projection holds until there
is room. If the bar runs out in a wall, the game nudges you to the nearest free
tile.

## Chapters

1. **El umbral** — the wall, the first astral slab, the first spikes. *(1-1, 1-2)*
2. **Las ruedas** — spinning wheels over the void, shades, potions. *(2-1, 2-2)*
3. **La torre astral** — vertical climbs, wisps, and the allies who kept a lamp
   on. *(3-1, 3-2)*

Each chapter opens with a story card and closes with one; the flow between levels
is continuous (you walk through the door). Altars are save points: they write the
run to `localStorage`, and that is where you come back after dying.

Three bodies, one story: **Iris** (balanced, 3 hits), **Nao** (fast and light,
2 hits), **Vero** (slow and sturdy, 4 hits, cheaper projection). Their stats are
multipliers in [`src/content/characters.ts`](src/content/characters.ts).

## Run it

```sh
cd game-itchio
npm ci
npm run dev      # http://localhost:5173
npm test         # level shape, allies, shard count
npm run build    # tsc --noEmit && vite build -> dist/
npm run zip      # game-itchio-<version>.zip, index.html at the root, for itch.io
```

## Structure

```
src/
  config.ts              tuning in one place (physics, astral, player)
  types.ts               the data model: chapters, levels, characters, save
  content/
    chapters.ts          the game as data: 3 chapters, 6 ASCII levels, allies, story
    level.ts             ASCII parser + which tiles are solid in each world
    characters.ts        the three bodies (palette + stat multipliers)
    strings.ts           every UI string, ES and EN, side by side
  core/
    art.ts               every visible pixel, generated at boot
    backdrop.ts          parallax sky and the astral sky that fades in
    events.ts            typed emitter: systems talk without knowing each other
    input.ts             keyboard + on-screen pad, edges vs held
    save.ts              localStorage save and settings
    run.ts               progress: chapter, level, shards, checkpoint
  systems/
    vitals.ts            hp + astral energy, no Phaser
    astral.ts            the projection state machine and its budget
  entities/
    Player.ts            movement, coyote time, jump buffer, poses
    Enemy.ts             Walker (patrols) and Wisp (astral-only threat)
    Platforms.ts         moving platforms and spinner wheels, with carry
  audio/
    engine.ts            Web Audio graph: compressor, generated reverb, SFX
    music.ts             a 16th-note sequencer, one theme per chapter
  scenes/
    BootScene.ts         builds the textures
    TitleScene.ts        character select, language, continue
    StoryScene.ts        chapter cards and the ending
    GameScene.ts         the level: tiles, spawns, HUD, astral, doors
  ui/
    hud.ts               chapter, level, energy, life, shards, toasts
    dialogue.ts          typewriter box used by the allies
    touch.ts             DOM pad -> the same input as the keyboard
tests/levels.test.ts     guards the maps and the chapter shape
```

## Extending it

- **A chapter**: add an object to `CHAPTERS` in `src/content/chapters.ts` with
  `story`, `outro`, `theme` and `levels`. Nothing in the scenes changes; the
  story card, save point and music follow.
- **A level**: one more entry with an ASCII `map` and `objects`. Tiles are
  documented at the top of the file; `npm test` checks the spawn and the door
  have floor under them, and that every ally marked `n` has an ally object.
- **A tile or a pickup**: add the character to the parser in `level.ts`, draw it
  in `art.ts` (or reuse one), and handle it in `buildSpawns`.
- **A mechanic**: listen to the bus in `GameScene.wireEvents` and put the state
  machine in `src/systems/`. The astral bar is the reference: `Vitals` holds the
  numbers, `AstralSystem` the rules, the scene only reacts.
- **A character**: one entry in `characters.ts`; the sprite, the card and the
  stats all come from it.
- **A music theme**: one entry in `THEMES` in `music.ts` (bpm, four chords, a bell
  line).

## Audio

No files: the music is a step sequencer over four-chapter chord progressions
(pads, bass, arpeggio, bell, brush), and every sound is an oscillator or a noise
buffer. A generated plate reverb and a low-pass filter sit on the music bus; the
filter closes while projected, so the shift is audible. Browsers demand a gesture,
so nothing plays until the first click or key. `M` mutes.

## Assets and licences

There is nothing to license: no images, fonts or audio files. Phaser is MIT. The
margin comments in `src/core/art.ts` are the art direction; the palettes are the
style guide.

## Status

Playable prototype, end to end: title → character → six rooms → three story
cards → ending. Verified in a browser with Playwright: title, story, movement,
jumping, wall phasing, the astral bar burning out, death and respawn at the
altar, shard pickup, the moving platform carrying the player, the spinner pads,
the ally dialogue, the door transition, the pause menu and the ending back to the
title. What is deliberately left for the next pass: more rooms per chapter, more
enemy types, a boss-free set piece per chapter, and a proper sound pass by ear.
