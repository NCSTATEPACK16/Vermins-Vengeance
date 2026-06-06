# Rodent's Revenge — Modern Remake

> ⚠️ **Working title.** "Rodent's Revenge" is the name of the 1991 Microsoft
> Entertainment Pack puzzle game this project is inspired by. The repo will be
> **renamed before any public release** and shipped under an original name
> (see [Naming & IP](#naming--ip)).

A modern, web-first remake of the classic grid puzzle: you're a mouse on a 20×20
board, pushing block chains to trap pursuing cats and turn them into cheese for
points, surviving as the cats speed up each level. An iOS build is planned.

**Project status:** 🟢 Playable prototype, active development. The web app is a
complete, runnable game; work now focuses on hardening it (tests) and layering in
the modern mechanics described in [`docs/`](docs/).

---

## The Game in One Paragraph

Move orthogonally on a 20×20 grid. Push connected lines of blocks to wall the
cats in — once a cat is fully enclosed (or squeezed against a wall), it's trapped
and becomes cheese you can eat for **+100** each. Clear all cats and cheese to
advance; each level the cats tick faster. If a cat reaches your cell, it's game
over. Best level cleared is saved locally.

---

## Current Tech Stack

| Layer | Current implementation |
| :--- | :--- |
| Language | TypeScript |
| UI framework | React 19 |
| Build tool | Vite 8 |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) |
| Icons | lucide-react |
| Rendering | CSS grid (`GameBoard.tsx`) |
| Game loop | `setInterval` driving cat ticks |
| State | React `useState` + immutable snapshots |
| Persistence | `localStorage` (best level cleared) |
| Tests | Vitest (engine unit tests) |

The architecture keeps a **pure engine as the single source of truth**:
`src/game/` is framework-agnostic TypeScript, and the React layer is a thin view
over immutable `GameSnapshot` values.

> **Planned upgrades** (see [`docs/technical-spec.md`](docs/technical-spec.md)):
> swap the CSS grid for a 2D canvas, replace `setInterval` with a
> `requestAnimationFrame` + delta-time loop for 60fps, and bridge to iOS via
> Capacitor. These are *not* in place yet.

---

## Repository Structure

```
.
├── README.md
├── LICENSE
├── HANDOFF.md                 Agent/dev hand-off notes
├── HOW_TO_PLAY.txt            Player-facing instructions
├── index.html                 Vite shell
├── package.json
├── vite.config.ts
├── vitest.config.ts           Test runner config
├── docs/
│   ├── modernization-plan.md  Full architectural blueprint (the "why")
│   └── technical-spec.md      Condensed implementation spec (the "what")
├── public/                    Static assets (favicon.svg, icons.svg)
└── src/
    ├── main.tsx               React entry
    ├── App.tsx                HUD, cat timer, input, help, continue/restart
    ├── index.css              Tailwind import + base layout
    ├── components/
    │   └── GameBoard.tsx      20×20 grid + touch swipe handling
    └── game/                  Pure engine (source of truth)
        ├── rodentEngine.ts    moveMouse, stepCats, checkTrapped, level build
        ├── types.ts           Tile, Direction, GameSnapshot, GRID_SIZE
        ├── catSpeed.ts        Per-level cat tick interval
        └── highScoreLevels.ts localStorage best-level helper
```

---

## Getting Started

```bash
npm install
npm run dev       # Vite dev server (typically http://localhost:5173)
npm run build     # tsc -b && vite build  -> dist/
npm run preview   # serve the production build
npm run lint      # ESLint
npm test          # run the Vitest engine suite
npm run test:watch
```

No environment variables, backend, or API keys required.

---

## Roadmap (development "loops")

1. **Foundation** — test harness + engine unit tests, LICENSE, docs cleanup.
2. **Tile metadata + first mechanics** — degradable blocks, Super Mouse power-up.
3. **Elemental blocks & hazards** — ice/magnet blocks, sink holes, yarn balls.
4. **Rendering/perf** — 2D canvas + rAF delta-time loop, Safari optimizations.
5. **Audio/haptics/polish** — SFX, transitions, accessibility.
6. **iOS** — Capacitor bridge (or the sibling Swift engine port).
7. **Rename & release** — original name/art/audio, deploy, App Store.

See [`docs/modernization-plan.md`](docs/modernization-plan.md) for the full
reasoning and the proposed modern mechanics.

---

## Naming & IP

This project recreates a Microsoft-published game and currently uses its
trademarked name as a working title. Before going public: pick an **original
name** (rename the repo, the future Capacitor `appId`/`appName`, and in-game
text) and use **original art and audio**. Keeping the repo private until the
rename is the lowest-risk path.

---

## License

[MIT](LICENSE). Update the copyright line in `LICENSE` to your legal name before
release.
