# Project synchronization record

## Source of truth

- Repository: https://github.com/chocoanakbaik/TCS-ENGINE
- Canonical branch: `main`
- Canonical full source archive: `TCS-ENGINE_FREKUENSI_0317.zip` at the repository root
- Engine runtime: `src/`
- FREKUENSI 03:17 game: `games/frekuensi-0317/`
- Automated tests: `tests/engine/`

The repository's `main` branch is the source of truth. The ZIP is a convenient complete VS Code workspace snapshot for the owner to download and extract.

## Rules for future updates

1. Before changing anything, fetch the latest `main` commit and recursive Git tree from GitHub. Chat history is not a source of truth.
2. Download and inspect the latest workspace archive or the relevant current files from `main`.
3. Compare current files with the requested change. Preserve unrelated owner changes.
4. Make changes in the workspace and run available syntax checks and tests. Clearly label any check that could not be run.
5. When source changes are ready, rebuild `TCS-ENGINE_FREKUENSI_0317.zip` from the complete workspace and update the GitHub repository in the same release operation.
6. After synchronizing, re-read the latest `main` commit and verify the archive file exists there. Record the commit SHA and archive SHA-256 in the handoff.
7. Never claim GitHub synchronization unless the pushed archive matches the delivered local ZIP.
8. If the user supplies a newer ZIP or local changes not yet pushed, compare those files with GitHub before editing and reconcile rather than overwriting them.

## Owner workflow

Download the workspace ZIP from the repository root, extract it, and open the inner `TCS-ENGINE/` folder in VS Code. Install Node.js 18+ (Node.js 20 LTS recommended), then run `npm install` and `npm run dev:frekuensi`. Run automated checks with `npm test`.

## License status

The GitHub repository currently does not publish a public open-source license. Do not add or imply one without the owner's decision.
