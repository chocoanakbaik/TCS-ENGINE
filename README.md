# TCS Engine v0.2.0 + FREKUENSI 03:17

**TCS Engine** is The Choco Studios' modular, event-driven JavaScript game runtime for 2D Canvas and 3D Three.js projects. This repository includes the engine core and a first-person psychological-horror game, **FREKUENSI 03:17**, as an engine integration project.

## Source of truth

The source of truth is this GitHub repository, **[chocoanakbaik/TCS-ENGINE](https://github.com/chocoanakbaik/TCS-ENGINE)** on branch `main`. All engine and game source files are committed directly in the repository. A compressed workspace snapshot is available at [`workspace-snapshot/TCS-ENGINE_FREKUENSI_0317.tar.gz`](workspace-snapshot/TCS-ENGINE_FREKUENSI_0317.tar.gz). The project synchronization rules are documented in `PROJECT_SYNC.md`.

## Requirements
- Node.js 18 or newer (Node.js 20 LTS recommended)
- npm included with Node.js
- Visual Studio Code or another code editor
- A browser with WebGL 2 support for the 3D game

## Open in Visual Studio Code

1. On this repository page, click **Code → Download ZIP**, or clone the repository.
2. Extract the downloaded repository ZIP.
3. In VS Code, choose **File → Open Folder** and select the extracted `TCS-ENGINE` repository folder.
4. Open **Terminal → New Terminal**.

## Run FREKUENSI 03:17

From the repository root, run:

```bash
npm install
npm run dev:frekuensi
```

Open the local URL printed by Vite (normally `http://127.0.0.1:4173`). The game runs locally; no hosted service or account is required.

Build the production game:

```bash
npm run build:frekuensi
```

The output is written to `dist/frekuensi-0317/`.

More detailed developer instructions are in [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md).

## Run the engine demo

```bash
npm run dev
```

The original 2D/3D engine demonstration is served from `public/index.html`.

## Run checks

```bash
npm test
npm run build:frekuensi
```

## Project structure
- `src/` — reusable TCS Engine runtime: ECS, lifecycle, input, physics, audio, UI, asset loading, and renderers.
- `public/` — original engine demonstration.
- `games/frekuensi-0317/` — game application, campaign content, world builder, player controller, enemy AI, audio direction, and UI.
- `tests/` — automated runtime and gameplay tests.

## Engine notes

The 3D renderer supports `low`, `medium`, and `high` quality profiles. Low is the default, disables real-time shadows, uses a capped render pixel ratio, and requests a low-power WebGL context for entry-level GPUs. `Engine` accepts `rendererOptions` to configure these choices.

## Campaign target

The story has five chapters and a **125-minute target first-playthrough duration**, with optional records, hidden routes, puzzle-solving, and stealth exploration extending playtime. This is a design target, not a measured claim; a timed human playtest is still required to validate the final duration and difficulty.

## Licensing

TCS Engine and FREKUENSI 03:17 are developed by **The Choco Studios**. No third-party game art or audio packs are bundled. The GitHub repository currently does not declare a public open-source license; do not assume permission for redistribution or relicensing beyond the rights granted by the owner.
