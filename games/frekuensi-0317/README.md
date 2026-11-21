# FREKUENSI 03:17

First-person psychological horror adventure by **The Choco Studios**, implemented as a TCS Engine integration game.

## Run locally

From the repository root:

```bash
npm install
npm run dev:frekuensi
```

Then open `http://127.0.0.1:4173` in Chrome or Edge. On Windows, `RUN-FREKUENSI.bat` in the repository root performs the same steps and opens the browser.

Requirements: Node.js 18+, npm, and a browser with WebGL 2. No hosted service is required to run the local development server. Dependencies must be installed once before offline play.

## Controls

| Input | Action |
|---|---|
| WASD | Move |
| Mouse | Look around (pointer lock) |
| Shift | Run |
| Ctrl | Crouch |
| F | Interact / enter or leave a hiding place |
| T | Toggle flashlight |
| J | Open journal |
| Q / E | Tune radio down / up |
| Mouse / slider | Fine tune the radio |
| 1–4 / numpad | Enter access code |
| Enter | Confirm puzzle input |
| Backspace | Delete a code digit |
| Esc | Pause / close a panel |

Click the game view once if the browser releases mouse capture. Use the settings menu to change graphics quality, mouse sensitivity, audio volume, and vertical mouse inversion.

## Campaign structure

Five chapters are budgeted at 25 minutes each, for a **125-minute first-playthrough design target**. Exploration documents, hidden fragments, stealth encounters, and puzzle-solving are intended to extend play. This value has not yet been validated by a timed human playtest and must not be treated as a measured runtime.

## Systems included

- First-person camera and pointer lock, with independent look and movement input.
- Low/medium/high WebGL quality profiles; low is the default for entry-level GPUs.
- Procedural weather, rain, thunder and lightning flashes.
- Procedural audio for rain, wind, station hum, footsteps, radio static, creature calls, and thunder.
- First-person interaction raycast, hiding places, flashlight battery, and local checkpoints.
- Five-chapter campaign state, radio tuning, relay activation, valve sequence, code panel, two story endings, and optional records.
- Local save and settings through browser storage.

## Current development verification

JavaScript syntax checks and Node-based tests cover the engine ECS, event bus, physics integration, and campaign content invariants. Browser WebGL rendering, Windows launcher behavior, integrated-GPU frame rate, full route completion, accessibility, and campaign duration still require hands-on verification on a Windows machine.

## Engine relationship

The game imports the TCS Engine runtime from the repository's `src/` directory and uses its `Engine`, ECS world, loop, renderer, and Three.js dependency. Game-specific systems live under `games/frekuensi-0317/`.
