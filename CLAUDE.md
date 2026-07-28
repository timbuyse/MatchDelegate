# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.

## What this app is

**MatchDelegate** (repo folder `voetbalapp2`) — the multi-tenant fork of Tim's voetbalapp, with Firebase-backed teams and roles. Single-file PWA: all HTML/CSS/JS inline in `index.html`. No build step, no package.json, no test suite, no linter. Deployed to GitHub Pages at https://timbuyse.github.io/MatchDelegate/.

**Pushing to main deploys straight to production.** Real users (trainers and delegates) get the change immediately via GitHub Pages. Never push untested changes.

## Running locally

Serve this folder with a static file server on port 5501. Note: plain `python`/`node`/`npx` are not on PATH in this environment; the working interpreter is pinned at `AppData\Local\Python\pythoncore-3.14-64\python.exe`. Prefer the preconfigured launch task (`voetbalapp2`) when available.

Validate JS changes by manual review (balanced braces/backticks) and by exercising the change in the running app. There is no automated test runner.

## Firebase boundaries

- Never modify Firebase security rules, authentication setup, or role/permission logic unless Tim explicitly asks for exactly that.
- Never touch the Firebase config block in `index.html` (API keys, project IDs) unless explicitly requested.
- Multi-tenancy is core: any change to how teams or roles are read/written must preserve isolation between teams. State the impact on other tenants before implementing.
- Local data (IndexedDB/localStorage) and Firebase sync must stay consistent; when changing one side, check the other.

## Data model (critical — do not break)

All data lives client-side on the user's device (matches in IndexedDB, teams/settings in localStorage), optionally synced via Firebase.

**Never change the structure of stored objects without migration logic. Existing data on users' devices must never become unreadable.** This is the single most important rule in this repo.

A match object has:
- `quarters`: array of `{num, startTime, endTime, totalPaused, pausedAt}`
- `events`: flat array (`goal_us`/`goal_them`, `corner_us`/`corner_them`, `substitution`, `yellow_card`/`red_card`, `penalty_us`/`penalty_them`, `freekick_us`/`freekick_them`, `injury`, `own_goal`, `quarter_start`/`quarter_end`), each carrying `gameTimeMs` (continuous play time) and `quarterNum`
- `players`: array with `starting`/`onField`/`x`/`y` for pitch position

Anything that doesn't fit the format (e.g. an opponent's disallowed goal) goes in the match's free-text `notes` field, never forced into an event.

Key globals defined in `index.html`: `dbSave`, `recomputeScore`, `recomputeOnField`, `FORMATIONS`, `MATCH_TYPES`, `uid`, `getTeamsV2`, `saveTeamsV2`. Always call `recomputeScore(m)` and `recomputeOnField(m)` before `dbSave(m)` so derived state matches the events array.

## Seed/demo scripts

Test-data scripts live in Tim's companion folder outside this repo, never committed here. They are self-contained IIFEs pasted into the browser console, must be non-destructive, and must use the app's own global functions rather than writing raw storage structures.

## Working conventions

- **Never commit or push without explicit, per-request permission from Tim** — even mid-session after several prior approvals, ask again each time before running `git commit`/`git push`.
- Before editing production code, briefly state the problem and proposed fix first — even for small/mechanical cleanups.
- Commit messages in Dutch (Nederlands).
- On Windows PowerShell, a multi-line `-m` commit message with a `Co-Authored-By` trailer needs a single-quoted here-string (`@'...'@`, closing `'@` at column 0).

## Definition of done

- Change tested in the running app (local server)
- No console errors
- Stored-data compatibility verified (existing matches/teams still load)
- Firebase sync behavior verified when data logic changed
- If this change also applies to voetbalapp, flag it explicitly
- **Bump `APP_VERSION` in `core.js` on every deploy.** The `sw.js` cache name is derived automatically from `APP_VERSION` at registration time (`?v=` query param) — no separate manual `CACHE` constant to bump anymore. Without an `APP_VERSION` bump, users keep seeing the old cached version.

## Sessiegeheugen (laatst bijgewerkt: 2026-07-28)

Recente context zodat een volgende sessie kan verderwerken:

- **v0.5.43 live** (PR #3 gemerged naar `master`; de default branch is `master`, niet `main`):
  - Fix: de oranje header-lijn in de wedstrijd-PDF kwam soms door de tekst — meta-/inforegels
    worden nu vooraf gesplitst met `splitTextToSize` en de cursor schuift per werkelijke regel op.
  - Nieuw in de PDF: sectie **"Selectie"** (alfabetisch, kern + bank, zonder afwezigen) en tabel
    **"Opstelling per kwart/deel/helft"** (`lineupPerQuarterRows()` in `js/detail-pdf.js`):
    één rij per veldpositie met labels KP / V·M·S + L/C/R (afgeleid uit lijn + x-volgorde),
    daarna Bank-rijen; markeringen `(wissel uit)`, `(wissel in)`, `(rood)`, `(blessure uit)`
    voor gebeurtenissen tijdens de periode. Gebruikt `playersAtPeriodStart` zodat tabel en
    velddiagrammen consistent blijven. Kolomkoppen via `pAbbr(m)` (K1/H1/D1).
- **Afgehandeld:** de U11-testwedstrijd is opgeschoond via een console-script (chat, niet
  gecommit — hoort in de companion-map): de 10 spelers zonder speelminuten zijn uit
  `m.players` gehaald (filter op `status === 'done'`, bevestigingsdialoog, daarna
  `recomputeScore` + `recomputeOnField` + `dbSave`). Tim bevestigde dat dit gelukt is.
- **v0.5.44:** de velddiagrammen in de PDF worden nu als één blok gehouden (vooraf
  `ensure(kop + alle rijen + legende)`) — door de nieuwe Selectie-sectie splitste het
  2x2-blok bij 4 kwarten anders over twee pagina's.
- **Weetjes:** afgewerkte wedstrijden hebben `m.status === 'done'` (gepland: `'planned'`,
  bezig: `'live'`); afwezigen zitten als `p.absent` in `m.players` of in `m.absentPlayers`.
  In de remote-omgeving (Claude Code on the web) wordt gewerkt op branch
  `claude/match-delegate-app-updates-cxcevj` met PR's naar `master`.
