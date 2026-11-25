# Agent notes for this repository

Two Game Off 2026 entries live here:

- **Half-Light** at the root (the notes below).
- **Game Itchio** in [`game-itchio/`](game-itchio/AGENTS.md) — its own package,
  commands, conventions and README. Read that file before touching it.

Game Off 2026 entry (theme SHIFT). Phaser 3 + TypeScript + Vite, no binary
assets. Current state and the exact next step live in the AgenticHub central
roadmap (`AgenticHub/projects/working/`); the repo's `docs/agent/` files are
archive.

## Commands

- `npm run dev` — Vite on `http://localhost:5173`.
- `npm run build` — `tsc --noEmit` then `vite build`; this is the gate, keep it
  green.
- `npm run zip` — the build plus `half-light-<version>.zip` with `index.html` at
  the root, which is the file itch.io wants.
- There is no test runner yet. A change to the mechanic is verified by playing
  the full run in a browser, and the handoff records what was checked.

## Conventions

- The level is ASCII in [`src/level.ts`](src/level.ts). Edit the map there, never
  in `dist/`. Rows must stay 32 columns and 18 rows; `parseLevel` throws otherwise,
  which is on purpose.
- Every visible thing is drawn with Phaser primitives. Do not add sprite sheets,
  fonts or audio without checking the licence and writing it down here.
- Sound is synthesised in [`src/audio.ts`](src/audio.ts) with Web Audio: no files,
  nothing to license, and it starts on the first gesture because browsers demand
  one. If a file ever replaces a synth, record its licence here first.
- Input is queued on the keydown event, not polled per frame: a tap shorter than a
  frame must still count. Movement is a held state; jump and shift are edges.
- Two worlds share one body. Anything that changes collision must be listed in
  the table in the README, and the level has to teach it before it is needed.
- Commits: one line, imperative, lowercase after the type (`feat: ...`, `fix: ...`).

## Rules that keep the jam entry safe

- The repository will be public for the jam: no credentials, no personal paths,
  no copyrighted assets, no AI-generated art with unclear provenance.
- The itch.io page and the public GitHub repository are the owner's to create.
  Ask before pushing anywhere.
