# Development workflow

## Requirements

- Windows 10/11, macOS, or Linux.
- Node.js 20 LTS (18+ supported) and npm.
- VS Code is recommended but not required.
- Chrome or Edge with WebGL 2 enabled for FREKUENSI 03:17.

## Open in Visual Studio Code

1. Extract the repository ZIP.
2. Open the extracted `TCS-ENGINE` folder in VS Code (`File → Open Folder`).
3. Open `Terminal → Run Task…` and select `FREKUENSI 03:17: Run game`, or run the commands below.

## Install and run

```sh
npm install
npm run dev:frekuensi
```

Open the local URL printed by Vite. The Vite configuration binds to `127.0.0.1:4173`.

## Verify and build

```sh
npm test
npm run build:frekuensi
```

The production output is written to `dist/frekuensi-0317/`.

## GitHub synchronization

The canonical repository is `https://github.com/chocoanakbaik/TCS-ENGINE`.
Before changing project files in a later session, inspect the latest `main` commit and actual repository tree. Compare the working folder with GitHub and preserve user changes. Update `PROJECT_SYNC.md` whenever the canonical commit changes.
