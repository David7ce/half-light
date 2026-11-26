# Game Off 2026 — two entries

This repository holds two separate games for [Game Off 2026](https://itch.io/jam/game-off-2026),
theme **SHIFT**:

| Game | Folder | What it is |
| --- | --- | --- |
| **Half-Light** | repository root (`src/`, `index.html`) | one body, two states: the living cross gaps, the dead cross walls |
| **Game Itchio** | [`game-itchio/`](game-itchio/README.md) | one body, two worlds: hold Shift to project, slow time and walk through walls |

Each has its own `package.json` and its own itch.io page; they do not share a
build. Everything below is Half-Light.

# Half-Light

A small puzzle platformer for [Game Off 2026](https://itch.io/jam/game-off-2026),
theme **SHIFT**. You are one person with two states: the living and the dead. One
crosses walls, the other crosses gaps. The house is built so that neither state
gets through it alone.

## Play

- `←` `→` or `A` `D` — walk
- `Space`, `↑` or `W` — jump
- `Shift` — cross over (living ↔ dead)
- `R` — restart
- `M` — mute

On a phone the buttons appear on screen: left, right, jump and shift.

## The rule

| | Living | Dead |
| --- | --- | --- |
| Walls (`#`) | solid | pass through |
| Furniture (`=`) | solid, walk on it | pass through, fall |
| Scaffold (`g`) | pass through (you see the outline) | solid, walk on it |
| Floor (`F`) | solid | solid |
| Salt (`X`) | harmless | burns you |

You cannot materialise inside a wall or inside furniture. The door only opens for
the living, and only with all the echoes.

**Movement is part of the rule.** The living stop the instant you let go. The dead
do not brake: they coast, and the only way to stop is to cross back. Quick shifts
are the skill; Shift is a brake as much as it is a key.

## The house

Four rooms, and each one leaves a line of the house's memory on the card before
it. The echoes are not keys: they are what the house remembers of the people who
lived in it, and the door wants them back before it lets the living through.

## Run it

```sh
npm ci
npm run dev      # http://localhost:5173
npm run build    # dist/
npm run zip      # half-light-<version>.zip, index.html at the root, for itch.io
```

## Stack

Phaser 3 + TypeScript + Vite. No image, audio or font assets: every visible thing
is drawn at runtime and every sound is synthesised with Web Audio, so the
repository is the whole game. Phaser is MIT; see [LICENSE](LICENSE) for this
project's licence.

## Sound

The ambient bed is two slow chords (a warm fifth for the living, a cold tritone
for the dead) that cross-fade when you shift; the one-shots are built from
oscillators and a noise buffer. `M` mutes. Nothing is loaded from disk, so there
is no audio licence to track — only the code in `src/audio.ts`.

## Status

Playable prototype: **four levels** (*The Hall*, *The Kitchen*, *The Cellar*, *The
Scaffold*), a title screen, and a win card that moves to the next room. Each level
teaches the rules above before it asks for them. All four have been played end to
end in a browser, from the title screen back to the title. What is still missing is
in the AgenticHub central roadmap (`AgenticHub/workspace-panel/working/ROADMAP.md`).
