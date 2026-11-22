# Handoff — Half-Light

Updated: 2026-11-22. Game Off 2026 closes **2026-12-01 21:37 UTC** (13:37 PST).

## State

- Playable prototype in `D:\Workspaces\David7ce-user\game-off-2026` (local git,
  no remote yet). Phaser 3.90 + TypeScript + Vite, no binary assets.
- **Title screen** (`TitleScene`) with the rule in three lines, then **three levels**
  (`src/level.ts`), then a win card per level and a final card that returns to the
  title. `R` restarts the current level.
- Level 1 *The Hall*: wall (dead only), furniture bridge over a 5-tile pit (living
  only), salt curtain (burns the dead), sealed box with the last echo (dead only),
  and a door that only the living open.
- Level 2 *The Kitchen*: two floors. Salt upstairs, so the dead cannot pass; a
  furniture stretch in the floor that only the dead fall through; a wall in the
  lower room only the dead pass; the door downstairs.
- Level 3 *The Cellar*: a pillar standing in a pit. The living cannot jump it and
  the dead cannot clear it on their own, so the jump has to change state mid-air.
  Then salt (alive), an echo, a wall (dead), the door (alive).
- `npm run build` is green (tsc + vite). Bundle is a single ~1.2 MB chunk
  (Phaser); fine for an itch zip.

## Verified on 2026-11-22 (browser, real key events)

Each level was started through the normal flow and read back between steps:

- **The Hall**: wall stops the living at `x=182`, shift → dead passes to `x=270`,
  shift back on the ledge, jump onto the bridge (echo 1 collected), walk through
  the salt (echo 2), shift → dead into the box and jump for echo 3, exit, shift →
  living, door opens (`won: true`).
- **The Kitchen**: spawn upstairs; walk through the salt (echo 1); shift → dead
  and fall through the furniture floor; walk through the wall (echo 2); shift →
  living; the door opens. The level transition came from pressing Enter on The
  Hall's card.
- **The Cellar**: jump from the ledge, shift to dead mid-air, land past the pillar
  (`x=515`); echo 1; shift back to living before the salt; echo 2; shift → dead
  past the wall; shift → living; door opens. Enter on the last card returned to
  the title (`active: ["title"]`).
- Negative checks from the first level: the dead die in the pit and on salt and
  respawn alive at the spawn; shift is refused while overlapping furniture; the
  door refuses the dead and refuses an unfinished run.
- **Echoes use a 28px pickup zone around a 9px orb.** Without it, a jump had to be
  pixel-perfect and the salt echo was easy to miss; that was a real defect found
  by the scripted run, not a test artefact.

## Next

1. **Audio**: a short ambient loop and three one-shots (shift, echo, death).
   Licence decision first — CC0 source or generated — written down in `AGENTS.md`.
   Nothing paid or uncleared.
2. **Juice**: shift particles, a trail for the dead, a door that animates open,
   a card that says which level is next. All primitives, no assets.
3. **A fourth level** built on the mid-air shift, and a "level select" so the jam
   voters can reach the later rooms without replaying (or keep it linear; decide).
4. **Publishing (owner only)**: create the public GitHub repository and push;
   create the itch.io project, upload the zip of `dist/` with `index.html` at the
   root, set the jam entry to Game Off 2026. Submit early — itch allows edits
   until the deadline.

## Known rough edges

- The win card accepts Enter, Space or a click; Space also queues a jump that is
  harmless because the scene changes.
- The touch pad appears after the first `touchstart` or on a coarse pointer; it
  has not been tried on a real phone.
- The hint bar is always on screen during a level and hidden on the title; it
  should probably fold into the title's controls line eventually.
- `parseLevel` validates width/height and glyphs, but nothing checks that a level
  is solvable. The three maps have hand-verified routes; a new map needs a play.
