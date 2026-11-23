# Journal — Half-Light

Newest entries first. Current state is in [`HANDOFF.md`](HANDOFF.md).

## 2026-11-23 — polish: story cards, vignette, ring, lit door (0.2.0)

- Story: `LevelDefinition.line`, one per room, shown on the card before it, plus a
  closing line on the last card. The card now also names the next room.
- The card needed a panel: over a live room the salt curtain crossed the story line.
- Vignette per state as a radial gradient in a runtime canvas texture (no file).
  The first attempt stacked stroked rectangles and drew a visible frame.
- Shift ring, and a door frame that stays dull until every echo is home, then
  breathes.
- Played it, not just built it: `window.__game` is exposed in dev, so the run was
  driven on real scene state. The Hall went end to end (`won: true`), and The
  Scaffold too, which is the only way to see the last card. `Enter` on the last
  card returns to the title; the dev keys start a room from the title. Zero console
  errors.
- Bundle has the new strings, and the dev key line is absent from the production
  build. `npm run zip` wrote `half-light-0.2.0.zip` (331 KB). The six itch
  screenshots were re-shot at 1024×576 with the new look.
- Version 0.2.0. Mechanic, maps and the collision table untouched.

## 2026-11-23 — delivery check on the production bundle

- Ran `npm run zip` fresh: `tsc` + `vite` green, bundle still
  `index-CDerhVOH.js`, so the zip the owner had (2026-11-22 18:11) already
  matched the code at `9f161a6`; only the page head changed today.
- Served `dist/` over HTTP (as itch does, not `file://`, where module scripts are
  blocked) and played it in a real browser: title renders, Enter starts *The
  Hall* at `1/4 · ECHOES 0/3 · LIVING`, Shift flips the palette and the state to
  DEAD, `R` returns to `1/4 · 0/3 · LIVING`, arrow keys move. One console error,
  the `favicon.ico` 404.
- **Fixed the 404** with an inline SVG favicon (a half-filled circle) in
  `index.html`, so the page ships no extra file and no request.
- **Fixed the itch copy:** `docs/ITCH.md` still said "three rooms" and its
  screenshot list stopped at The Cellar, while the game has four rooms. Now
  "four rooms", "asked for by the last", and a sixth screenshot for The Scaffold.
- Added the missing `M` mute to the README's control list.
- Re-zipped: `half-light-0.1.0.zip`, 331 KB, `index.html` at the root plus
  `assets/`. Zero console errors after the favicon fix. No `.playwright-mcp` or
  screenshots left behind.
- **Six itch screenshots staged** in `docs/itch-screens/` (gitignored), captured
  at 1024×576 from the canvas only, hint bar hidden: title (production build, so
  no dev key line), Hall living at the wall, Hall dead on the bridge, Kitchen,
  Cellar mid-leap with the shift burst, Scaffold with the dead on its own
  geometry. Two attempts: the first had the HTML hint panel over the canvas and
  the dev line on the title.

## 2026-11-22 — dead matter and a drift you cannot brake

- The owner's read was "basic Mario with a wall trick", so the first item of the
  direction list is in: **scaffolds** (`g`), tiles that are solid for the dead and
  pass-through for the living, drawn as a faint outline while alive. The dead now
  has its own ground, and a new room (*The Scaffold*) is built on it.
- **Movement is part of the rule now.** The owner's idea: a ghost should not brake.
  The living stop the instant you let go; the dead coast (drag 300) and are slightly
  faster (220 vs 210). Crossing back is the brake, so quick shifts are the skill.
- Fixed a real bug found while testing: the body kept its velocity when no key was
  held, so every ledge slid you into the pit.
- Fixed a second one: Shift was refused when the body merely touched a wall or
  furniture tile, which made the bridge edge feel broken. Materialising is now
  decided by the tile under the player's centre.
- Salt moved to the same centre rule, so grazing a curtain no longer kills you.
- Added a dev-only level jump (keys 1-4 on the title) to make testing a room one
  keypress; it is stripped from the production bundle.
- Re-verified all four rooms to `won: true` with real key events under the new
  movement, including the mid-air shift in The Cellar and the drift-to-salt in The
  Scaffold.

## 2026-11-22 — owner's read of the prototype

David: it feels like a basic Super Mario with a simple wall-dodging skill. Written
into the handoff as the direction to improve, ordered by leverage: the dead world
needs its own geometry, Shift needs a condition or a cost, three lines of story
per room, then silhouette and only then textures. No mechanic rewrite before the
jam deadline; publishing comes first.

## 2026-11-22 — sound, juice and a build for itch

- `src/audio.ts`: Web Audio only, no files, so there is no licence to track. The
  ambient bed is a warm fifth for the living and a cold tritone for the dead,
  cross-faded on shift; one-shots for shift, echo, death, a refused door and the
  win. The context is built on the title's Enter/click, which is the gesture the
  browser wants. `M` mutes.
- Particles: a burst on shift, echo, death and win, plus a fading trail behind the
  dead. The door pulses when the last echo is taken and swings open on the win.
- `npm run zip` builds `half-light-0.1.0.zip` (338 KB, `index.html` at the root)
  with PowerShell on Windows and `zip` elsewhere; no extra dependency. Verified by
  listing the archive entries.
- `docs/ITCH.md` holds the page copy: title, tagline, description, controls, theme,
  credits, tags and the screenshot list. The owner pastes it.
- Drafted a fourth room ("The Attic", a salt walkway over a pit) and dropped it:
  salt is a hazard zone with no body, so nothing can stand on it, and making salt
  solid would turn the three existing curtains into walls. A fourth room that just
  repeats a wall is not worth the deadline risk.
- Verified in the browser: context `none` → `running` after the gesture, `M`
  toggles both ways, The Hall still plays to `won: true` with sound on.

## 2026-11-22 — title screen and two more rooms

- Added `TitleScene` (title, the rule, controls, Enter/click) and moved the level
  flow into Phaser: a win card per room, Enter or a click for the next, and the
  last card back to the title. The DOM banner is gone; the hint bar hides itself
  on the title.
- Two new maps. *The Kitchen* turns the bridge upside down: the furniture is the
  floor you fall through as the dead, and the salt upstairs keeps the dead out of
  the drop. *The Cellar* puts the pillar inside a pit, so the jump has to change
  state in mid-air: neither state clears it alone.
- Echo count is per level now (`totalEchoes`), so a room can ask for two instead
  of three. The door text no longer says "three".
- Echo pickup changed to a 28px zone around the 9px orb after the scripted run
  missed the salt echo: the jump had to be pixel-perfect, which is a platforming
  test in a puzzle game. Echoes also moved to walking height, except the one in
  the sealed box.
- Level 1's pit widened to five tiles and the bridge widened with it: a living
  jump covered the old three-tile pit, so the furniture was decorative.
- Played all three levels end to end with real key events, plus the transitions.
  Details and the negative checks are in the handoff.

## 2026-11-22 — first playable

- Started the Game Off 2026 entry (theme SHIFT) as **Half-Light**: one body, two
  states. Chose idea (3) from the roadmap ("two worlds, one ghost") and cut it to
  one mechanic and one level, per the jam's own advice.
- Mechanic settled after two attempts. First draft had the dead floating, which
  made the furniture bridge pointless (the dead could cross any gap). The rule
  that survived: both states obey gravity and the floor; the living collide with
  walls and furniture, the dead with neither. That single rule gives both
  directions of the puzzle — walls for the dead, furniture for the living.
- Level geometry fixed after the first playthrough failed at the bridge: a
  64 px step from a 32 px ledge was a platforming test, not a puzzle. The bridge
  moved down a row (32 px step) and the pit moved one column right.
- Input fixed after a fast `Shift` tap was dropped: polling `JustDown` per frame
  loses a press shorter than a frame. Keyboard and touch now queue the edge on
  the event and the scene consumes it.
- Verified the full run and the four negative cases in a browser; details in the
  handoff. `npm run build` green.
