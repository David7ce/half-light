# Handoff — Half-Light

Updated: 2026-11-22. Game Off 2026 closes **2026-12-01 21:37 UTC** (13:37 PST).

## State

- Playable prototype in `D:\Workspaces\David7ce-user\game-off-2026` (local git,
  no remote yet). Phaser 3.90 + TypeScript + Vite, no binary assets.
- **Title screen** (`TitleScene`) with the rule in three lines, then **four levels**
  (`src/level.ts`), then a win card per level and a final card that returns to the
  title. `R` restarts the current level. In dev only, keys 1-4 on the title jump
  straight to a room (stripped from the build).
- Level 1 *The Hall*: wall (dead only), furniture bridge over a five-tile pit
  (living only), salt curtain (burns the dead), sealed box with the last echo (dead
  only), and a door that only the living open.
- Level 2 *The Kitchen*: two floors. Salt upstairs, so the dead cannot pass; a
  furniture stretch in the floor that only the dead fall through; a wall in the
  lower room only the dead pass; the door downstairs.
- Level 3 *The Cellar*: a pillar standing in a pit. The living cannot jump it and
  the dead cannot clear it on their own, so the jump has to change state mid-air.
  Then salt (alive), an echo, a wall (dead), the door (alive).
- Level 4 *The Scaffold*: dead matter. A pit the living cannot cross, bridged by
  scaffolds only the dead stand on (visible to the living as faint outlines). Then
  back to the living before the salt.
- **Movement is a rule too.** The living brake instantly; the dead coast and cannot
  stop, so Shift doubles as the brake. The dead are slightly faster (220 vs 210).
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
  (`x=558`); echo 1; shift back to living before the salt; echo 2; shift → dead
  past the wall; shift → living; door opens.
- **The Scaffold**: shift at the pit edge, jump onto the first scaffold (echo 1),
  step up to the second, drop to the far ground, shift to living in mid-air to
  brake before the salt, cross it (echo 2), door opens (`won: true` at `x=954`).
- Negative checks: the dead die in the pit and on salt and respawn alive at the
  spawn; the door refuses the dead and refuses an unfinished run; the living fall
  straight through a scaffold.
- **Echoes use a 28px pickup zone around a 9px orb.** Without it, a jump had to be
  pixel-perfect and the salt echo was easy to miss; that was a real defect found
  by the scripted run, not a test artefact.
- **Audio verified in the browser**: the context is `none` before the title's
  gesture and `running` after Enter, `M` flips `muted` both ways, and The Hall was
  replayed to `won: true` with sound on (three echoes, door opens).
- **Shift/echo/death/win bursts and the ghost trail render** (screenshot evidence
  in the workspace's `projects/logs/halflight-trail.png`, and the scaffold in both
  states in `halflight-scaffold-alive.png` / `-dead.png`).

### Two real defects found while verifying the drift

- **The player never stopped.** With no key held the body kept its velocity, so
  letting go at a ledge slid the player into the pit. The living now brake the
  frame the key is released; the dead keep coasting *on purpose*.
- **Shift was refused when merely touching furniture.** The check tested the whole
  body against wall/furniture colliders, so standing at the bridge edge refused to
  materialise ("inside stone"). It now tests the tile under the player's centre,
  and salt uses the same centre rule, so brushing a curtain no longer burns you.

## Next

1. **Publishing (owner only)**: create the public GitHub repository and push;
   create the itch.io project, upload `half-light-0.1.0.zip` from `npm run zip`,
   and paste the draft copy from [`docs/ITCH.md`](../ITCH.md). Submit early —
   itch allows edits until the deadline.
2. **Balance the drift** with a real player on a keyboard: ghost 220 and a
   three-quarter-second coast is a guess, and The Scaffold is the room that will
   tell. The number is `GHOST_DRAG` in `GameScene.ts`.
3. **Direction, rounds 2-5**: Shift needs a condition or a cost, then story,
   silhouette and art.
4. **Cheap polish meanwhile**: a soft vignette per state, a shift ring, the door
   frame lighting up when every echo is in, a card that names the next room.

## Direction after the first playable (owner, 2026-11-22)

Owner's verdict: it reads as "a basic Super Mario with a simple wall-dodging
skill". Fair, and the gap is not art first. Shift is a free toggle and the dead
world is the same room with the collision layer switched off, so there is nothing
to decide. Ranked by how much the feel changes per hour of work:

**1 is in as of this commit**: scaffolds give the dead their own geometry, and the
dead now coast while the living brake, so Shift is also the brake. 2-5 remain.

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
