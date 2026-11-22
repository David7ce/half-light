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
2. **After that, follow the direction section**: the dead world's own geometry
   first, then a condition on Shift, then story, silhouette and art. That is what
   makes it stop reading as a Mario level with a phase trick.
3. **Cheap polish meanwhile**: a soft vignette per state, a shift ring, the door
   frame lighting up when every echo is in, a card that names the next room.
4. **Optional content**: a fourth room only if it adds a new reading of the rule.
   One was drafted and dropped: a salt walkway needs salt to be standable, and salt
   is a hazard zone, not a tile the living stand on. Making salt solid would break
   the curtains in the first three rooms.

## Direction after the first playable (owner, 2026-11-22)

Owner's verdict: it reads as "a basic Super Mario with a simple wall-dodging
skill". Fair, and the gap is not art first. Shift is a free toggle and the dead
world is the same room with the collision layer switched off, so there is nothing
to decide. Ranked by how much the feel changes per hour of work:

1. **Give the dead world its own furniture.** Same room, but the dead see the
   house as it was: scaffolds, rails and openings that exist only for them, and
   walls that are solid in the living world but absent there. Shift then changes
   *where you can go*, not just what you bump into.
2. **Give Shift a condition.** Salt already burns the dead; make it a routing
   constraint instead of a wall (a salt line you must be alive to cross, light
   pools the dead cannot enter), or a half-light meter that only refills in
   shadow. A free toggle has no decisions in it.
3. **Three lines of story per room.** The echoes are memories of the same house
   and the door wants them back. One line on the card before each room; costs
   almost nothing and changes how the rooms read.
4. **Silhouette before texture.** The living body and the dead vapour should
   differ in shape and motion (breathing, weighted steps vs. drift), not only in
   colour. A texture on a rectangle still reads as a rectangle.
5. **Then art.** Per-room palettes, procedural grain or scanlines, parallax,
   a title illustration. Cheap with primitives, worthless before 1 and 2.

Deliberately not before 2026-12-01: rewriting the mechanic. The jam needs a
submitted build more than a better prototype.

## Known rough edges

- The win card accepts Enter, Space or a click; Space also queues a jump that is
  harmless because the scene changes.
- The touch pad appears after the first `touchstart` or on a coarse pointer; it
  has not been tried on a real phone.
- The hint bar is always on screen during a level and hidden on the title; it
  should probably fold into the title's controls line eventually.
- `parseLevel` validates width/height and glyphs, but nothing checks that a level
  is solvable. The three maps have hand-verified routes; a new map needs a play.
