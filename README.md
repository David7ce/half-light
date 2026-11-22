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

On a phone the buttons appear on screen: left, right, jump and shift.

## The rule

| | Living | Dead |
| --- | --- | --- |
| Walls (`#`) | solid | pass through |
| Furniture (`=`) | solid, walk on it | pass through, fall |
| Floor (`F`) | solid | solid |
| Salt (`X`) | harmless | burns you |

You cannot materialise inside a wall or inside furniture. The door only opens for
the living, and only with all three echoes.

## Run it

```sh
npm ci
npm run dev      # http://localhost:5173
npm run build    # dist/, upload the zip of this folder to itch.io
```

## Stack

Phaser 3 + TypeScript + Vite. No image, audio or font assets: every visible thing
is drawn at runtime, so the repository is the whole game. Phaser is MIT; see
[LICENSE](LICENSE) for this project's licence.

## Status

Playable prototype: **three levels** (*The Hall*, *The Kitchen*, *The Cellar*),
a title screen, and a win card that moves to the next room. Each level teaches
the four rules above before it asks for them. All three have been played end to
end in a browser, from the title screen back to the title. What is still missing
is in [docs/agent/HANDOFF.md](docs/agent/HANDOFF.md).
