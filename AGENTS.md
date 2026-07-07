# AGENTS

## Purpose
This repository is a small static web application for registering and managing territorial requests using a plain HTML/CSS/JavaScript SPA.

## Key facts
- No package manager metadata is present (`package.json` is absent).
- The app runs from `index.html` as a static site with `app.js` providing logic.
- Data persists in `localStorage` under the key `geo_registros`.
- Import/export supports JSON, CSV/TSV and Excel (`.xlsx`/`.xls`) using the CDN `xlsx.full.min.js`.
- Tests use Node's built-in runner: `node --test tests/app.test.js`.

## How to run locally
- Open `index.html` in a browser, or serve the directory with a static server, for example:
  - `python3 -m http.server 8123`
- Open `http://127.0.0.1:8123/`
- Run tests from the repo root with:
  - `node --test tests/app.test.js`

## Architecture
- `index.html` contains the UI and loads `app.js`.
- `app.js` defines the app state, rendering, persistence, and import/export flows.
- The app exports a global object as `window.GEORegistroApp` so UI buttons and tests can invoke functions directly.
- The import flow normalizes input rows into the app model using `normalizarDatosImportados()`.

## Conventions
- Preserve Spanish field names and UI text: `nombre`, `zona`, `fecha_ingreso`, `fecha_respuesta`, `zf`, `tgm`, `superficie`, `plano`, `shp`, `imagen`.
- Keep logic simple and browser-native; avoid introducing heavy tooling or bundlers unless absolutely necessary.
- If adding libraries, prefer CDN script includes consistent with the existing `xlsx` dependency.
- Maintain compatibility with the current global export pattern so HTML `onclick` calls continue working.
- Use the existing helper functions when changing form or data processing behavior:
  - `validateRegistro()`
  - `buildRegistroFromForm()`
  - `normalizeRegistros()`
  - `normalizarDatosImportados()`

## Important files
- `index.html` — main application UI and bootstrap entry point
- `app.js` — core application logic, export/import, render, persistence, navigation
- `tests/app.test.js` — unit tests for data normalization, validation, and CRUD helpers
- `README.md` — local usage and GitHub Pages deployment notes
- `.github/workflows/deploy.yml` — automatic GitHub Pages deployment
- `.github/skills/importar-datos-excel/SKILL.md` — existing repository-specific guidance for import support

## Notes for AI agents
- Prefer minimal code changes that preserve the SPA's current behavior.
- When editing import/export or data model shapes, update both the UI and the test coverage.
- Keep the `window.GEORegistroApp.initialize()` bootstrap flow intact.
- Do not assume a build step exists; changes should work in the static file environment.
