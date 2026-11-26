# Agent notes for Game Itchio

Second Game Off 2026 entry in this repository, next to Half-Light. Phaser 3 +
TypeScript + Vite, no binary assets. Open work and its state live in the AgenticHub
central roadmap (`AgenticHub/workspace-panel/working/ROADMAP.md`); this repo has no
roadmap of its own.

## Commands

- `npm run dev` — Vite on `http://localhost:5173` from inside `game-itchio/`.
- `npm test` — `tsx --test`; pins the ASCII maps (20 rows, floor under spawn and
  door), the ally markers and the shard count.
- `npm run build` — `tsc --noEmit` then `vite build`; this is the gate, keep it green.
- `npm run zip` — the build plus `game-itchio-<version>.zip` with `index.html` at
  the root, which is what itch.io wants.

## Conventions

- **The game is data.** Chapters, levels, allies and story live in
  [`src/content/chapters.ts`](src/content/chapters.ts). A level is an ASCII map
  plus `objects`; do not hard-code a room into a scene.
- **Two worlds, two solid sets.** `MATERIAL_SOLID` and `ASTRAL_SOLID` in
  [`src/content/level.ts`](src/content/level.ts) are the rule. If a mechanic
  changes collision, it goes in that table and in the README's table, and the
  level teaches it before it is needed.
- **Art is generated.** Every pixel comes from [`src/core/art.ts`](src/core/art.ts),
  drawn on a 16-unit grid at 2×. Do not add sprite sheets, fonts or audio files
  without checking the licence and writing it down here and in the README.
- **Sound is synthesised.** [`src/audio/engine.ts`](src/audio/engine.ts) is the
  graph, [`src/audio/music.ts`](src/audio/music.ts) the sequencer. Nothing loads
  from disk.
- **Systems do not know the scene.** State machines live in `src/systems/` and
  talk through the typed bus in `src/core/events.ts`; `GameScene` only wires.
- **Tuning lives in `config.ts`.** A feel change is one number there, not a
  literal in an entity.
- Input is queued on keydown, not polled: a tap shorter than a frame must count.
  Movement is held; jump and astral are edges/held as documented in `input.ts`.
  Gamepads are polled once per frame in `core/gamepad.ts`, with the same edges.
- **The astral flies.** Holding jump while projected rises at `ASTRAL.flySpeed`
  with `ASTRAL.flyGravity`; the material body always falls. A level that needs a
  flight is a level that must not be reachable on foot.
- **Depth order is a rule**: material tiles stay behind the body, astral-only
  geometry is drawn over it (`DEPTH.astralOverlay`).
- Comments and identifiers in English; player-facing copy in Spanish and English
  in `src/content/strings.ts` and next to the chapters.
- Commits: one line, imperative, lowercase after the type (`feat: ...`, `fix: ...`).

## Rules that keep the jam entry safe

- The repository will be public: no credentials, no personal paths, no
  copyrighted assets, no AI-generated art with unclear provenance.
- The itch.io page and the public GitHub repository are the owner's to create.
  Ask before pushing anywhere.
