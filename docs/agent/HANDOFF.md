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
- **`npm run zip`** writes `half-light-0.1.0.zip` (338 KB) with `index.html` at the
  root; entries were listed to confirm it. Page copy for itch lives in
  [`docs/ITCH.md`](../ITCH.md).
- **Sound and juice.** `src/audio.ts` synthesises everything with Web Audio: an
  ambient chord per state (warm fifth alive, cold tritone dead) that cross-fades
  on shift, plus shift/echo/death/deny/win one-shots. `M` mutes. The scene also
  throws a small particle burst on shift, echo, death and win, leaves a ghost
  trail, and the door pulses when the last echo is taken and swings open on the
  win.

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
- **Audio verified in the browser**: the context is `none` before the title's
  gesture and `running` after Enter, `M` flips `muted` both ways, and The Hall was
  replayed to `won: true` with sound on (three echoes, door opens).
- **Shift/echo/death/win bursts and the ghost trail render** (screenshot evidence
  in the workspace's `projects/logs/halflight-trail.png`).

## Next

1. **Publishing (owner only)**: create the public GitHub repository and push;
   create the itch.io project, upload `half-light-0.1.0.zip` from `npm run zip`,
   and paste the draft copy from [`docs/ITCH.md`](../ITCH.md). Submit early —
   itch allows edits until the deadline.
2. **Juice, round two**: a soft vignette per state, a shift shockwave ring, the
   door frame lighting up when every echo is in, a card that names the next room.
3. **Optional content**: a fourth room. One was drafted and dropped: a salt
   walkway needs salt to be standable, and salt is a hazard zone, not a tile the
   living stand on. Making salt solid would break the curtains in the first three
   rooms. A fourth room that repeats a wall is not worth the deadline risk.

## Known rough edges

- The win card accepts Enter, Space or a click; Space also queues a jump that is
  harmless because the scene changes.
- The touch pad appears after the first `touchstart` or on a coarse pointer; it
  has not been tried on a real phone.
- The hint bar is always on screen during a level and hidden on the title; it
  should probably fold into the title's controls line eventually.
- `parseLevel` validates width/height and glyphs, but nothing checks that a level
  is solvable. The three maps have hand-verified routes; a new map needs a play.
