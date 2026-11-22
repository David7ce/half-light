# Journal — Half-Light

Newest entries first. Current state is in [`HANDOFF.md`](HANDOFF.md).

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
