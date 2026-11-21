# Project synchronization record

## Source of truth

- Repository: https://github.com/chocoanakbaik/TCS-ENGINE
- Canonical branch: `main`
- Canonical project layout: project files are committed directly at the repository root
- Optional complete source archive: `workspace-snapshot/TCS-ENGINE_FREKUENSI_0317.tar.gz`
- Engine runtime: `src/`
- FREKUENSI 03:17 game: `games/frekuensi-0317/`
- Automated tests: `tests/engine/`

The repository's `main` branch is the source of truth. All workspace source files are already committed at their normal project paths. For a full download, use GitHub's **Code → Download ZIP** or clone the repository. The optional gzip archive is a convenient snapshot, not a required extraction step.

## Rules for future updates

1. Before changing anything, fetch the latest `main` commit and recursive Git tree from GitHub. Chat history is not a source of truth.
2. Download and inspect the latest tree's files and, when useful, the optional archive. Do not assume a local workspace is newer than GitHub.
3. Compare current files with the requested change. Preserve unrelated owner changes.
4. Make changes in the workspace and run available syntax checks and tests. Clearly label any check that could not be run.
5. When source changes are ready, synchronize changed project files directly to `main` and update the optional full source archive in the same release operation.
6. After synchronizing, re-read the latest `main` commit and verify expected project paths and the optional archive exist. Record the latest commit SHA in the handoff.
7. Never claim GitHub synchronization unless the pushed tree has been verified.
8. If the user supplies newer local files not yet pushed, compare them with GitHub before editing and reconcile rather than overwriting them.

## Owner workflow

On GitHub, click **Code → Download ZIP**, extract it, and open the extracted `TCS-ENGINE` repository folder in VS Code. Install Node.js 18+ (Node.js 20 LTS recommended), then run `npm install` and `npm run dev:frekuensi`. Run automated checks with `npm test`.

## License status

The GitHub repository currently does not publish a public open-source license. Do not add or imply one without the owner's decision.
