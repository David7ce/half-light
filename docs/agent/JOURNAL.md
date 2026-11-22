# Journal — Half-Light

Newest entries first. Current state is in [`HANDOFF.md`](HANDOFF.md).

## 2026-11-22

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
