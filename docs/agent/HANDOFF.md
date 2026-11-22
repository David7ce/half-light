# Handoff — Half-Light

Updated: 2026-11-22. Game Off 2026 closes **2026-12-01 21:37 UTC** (13:37 PST).

## State

- Playable prototype in `D:\Workspaces\David7ce-user\game-off-2026` (local git,
  no remote yet). Phaser 3.90 + TypeScript + Vite, no binary assets.
- One level (32×18 tiles of 32 px, a single screen) with four beats in order:
  a wall only the dead pass, a furniture bridge only the living walk on, a salt
  curtain that burns the dead, a sealed box only the dead enter, and a door that
  only the living open with all three echoes.
- `npm run build` is green (tsc + vite). Bundle is a single ~1.2 MB chunk
  (Phaser); fine for an itch zip.

## Verified on 2026-11-22 (browser, real key events)

Full run from spawn to the win banner, reading the scene state between steps:

1. Living stops at the wall (`x=182`), shift → dead, walks through to `x=267`.
2. Shift back on the ledge; a jump lands on the furniture bridge; the bridge
   echo is collected during the jump.
3. Alive walks through the salt (`x=544-640`); the second echo is collected.
4. Alive stops at the box (`x=758`), shift → dead, enters, jumps for the third
   echo, exits at `x=945`, shift → living, the door opens: `won`, banner shown.

Negative checks: the dead die in the pit and on salt and respawn alive at the
spawn; shift is refused while overlapping furniture; the door refuses the dead
and refuses an unfinished run (3 echoes required).

## Next

1. **Title screen and a two-line how-to-play**, then the level. The browser
   currently starts mid-level with the hint bar; that is a prototype entrance,
   not a game entrance.
2. **Two more levels** using the same four rules in new combinations (furniture
   the living needs as a ceiling, salt as a corridor the dead must route around,
   an echo that needs a living jump from a dead position). `parseLevel` already
   validates rows; levels should become an array of maps with a next-level link.
3. **Audio**: a short ambient loop and three one-shots (shift, echo, death).
   Needs a licence decision first — CC0 source or generated, written down in
   `AGENTS.md`. Nothing paid or uncleared.
4. **Juice**: shift particles, a trail for the dead, a door that animates open,
   a level-complete card. All primitives, no assets.
5. **Publishing (owner only)**: create the public GitHub repository and push;
   create the itch.io project, upload the zip of `dist/` with `index.html` at the
   root, set the jam entry to Game Off 2026. Submit early — itch allows edits
   until the deadline, and a submitted entry beats a perfect unsubmitted one.

## Known rough edges

- `Shift` is registered through both `addKey` and the `keydown-SHIFT` event; the
  key object is no longer polled and can be dropped.
- The touch pad appears after the first `touchstart` or on a coarse pointer; it
  has not been tried on a real phone.
- The hint bar is always on screen; it should move behind a "?" or the title
  screen once one exists.
