# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.

## What this app is

**MatchDelegate** — the multi-tenant football score-tracking PWA with Firebase-backed teams and roles. No build step, no package.json, no test suite, no linter. Deployed to GitHub Pages at https://timbuyse.github.io/MatchDelegate/.

It began as a fork of **voetbalapp**, Tim's earlier single-user app (folder briefly named `voetbalapp2`). That first version was retired on 31 July 2026 — it is gone locally and no longer maintained. Older notes here and in the changelog may still mention it; treat any such reference as historical.

**Pushing to `master` deploys straight to production** (that is the default branch, not `main`). Real users (trainers and delegates) get the change immediately via GitHub Pages. Never push untested changes.

## File layout

This was a true single-file app until v0.4.2, when the JavaScript was split out of `index.html`. Don't go looking for functions in the HTML.

- `index.html` (~42 KB) — markup only, plus all CSS in one inline `<style>` block (roughly lines 14–458), plus the `<script src>` tags.
- `js/` — nine classic (non-module) scripts, loaded in this fixed order: `core.js` → `views-account.js` → `stats-settings.js` → `teams-tournaments.js` → `wizard-prep.js` → `live-match.js` → `detail-pdf.js` → `import-cal.js` → `import-psd.js`. **One shared global scope, no bundler**, so every top-level `function`/`const` is a global and load order matters. Function hoisting works per file only: a dispatch table that *references* a function from another file (instead of calling it at the moment of use) breaks the app silently — this bit once during the original split.
  - `core.js` — config (`APP_VERSION`, `MATCH_TYPES`, `FORMATIONS`, `LINE_Y`, `PERIOD_TYPES`, icon set `IC`), the Firebase config block and the whole cloud layer (`cloudReady`/`isAdmin`/`fbdb`/`activeTeamId`, `teamRef`, the `cloudOnLocal*` push hooks), local storage (`dbAll`/`dbSave`/`dbDel`, `getTeamsV2`/`saveTeamsV2`/`teamById`) and the recompute helpers.
  - `views-account.js` — team-admin screen (invites, members, viewer mode, owner claim) and account settings, plus `uid()` and `calcMinutes()`.
  - `stats-settings.js` — season statistics and which sections an admin exposes to viewers (`STATS_DEFAULT_PUBLIC`, `toggleStatPublic`).
  - `teams-tournaments.js` — team/roster management and the tournament module.
  - `wizard-prep.js` — new-match wizard (info → selection → lineup) and prep view.
  - `live-match.js` — live match screen: timer, events, substitutions.
  - `detail-pdf.js` — finished-match detail view and PDF export.
  - `import-cal.js` — importing a season calendar from ICS/Excel/CSV.
  - `import-psd.js` — reading a ProSoccerData match-preparation PDF (own PDF parser; fills the wizard and then writes the plan, so nothing new enters the data model).
- `firebase/` — the Firebase compat SDK is vendored here, not loaded from gstatic.
- Also present: `fonts/`, `pdf/`, `handleiding/` (in-app manual; root-level `handleiding-screenshots.js` is a ~900 KB generated base64 blob).
- The `<script src>` tags in `index.html` carry no `?v=APP_VERSION`, but that is **not** a stale-cache hole: `sw.js` serves every `js/*.js` network-first with `cache:'no-store'` (see the `isAppJs` branch), precisely so the HTTP cache cannot hand back an old build. Adding a version query to the tags would mean hardcoding the number in nine places next to `APP_VERSION` — a regression of the single-version-source that B16 established. It only bites while **testing**, when the service worker has been unregistered: without it everything falls back to the plain HTTP cache. See the reload recipe under "Running locally".

## Running locally

Serve this folder with a static file server. Note: plain `python`/`node`/`npx` are not on PATH in this environment; the working interpreter is pinned at `AppData\Local\Python\pythoncore-3.14-64\python.exe`. Prefer the preconfigured launch task **`match-delegate`** (`.claude/launch.json` → `serve.ps1`, port 3000 with `autoPort`) when available.

A port other than the usual one is a **feature when testing**: Firebase auth is per origin, so a fresh port means no signed-in session, `teamRef()` returns null, and no write can possibly reach production data. That is the safe place to drive a full match end-to-end. On the usual port you are signed in as Tim — see the seed/demo rules below.

Validate JS changes by manual review (balanced braces/backticks) and by exercising the change in the running app. There is no automated test runner.

## Firebase boundaries

- Never modify Firebase security rules, authentication setup, or role/permission logic unless Tim explicitly asks for exactly that.
- Never touch the Firebase config block in `js/core.js` (API keys, project `matchdelegate-v2`) unless explicitly requested.
- Multi-tenancy is core: any change to how teams or roles are read/written must preserve isolation between teams. State the impact on other tenants before implementing.
- Local data (IndexedDB/localStorage) and Firebase sync must stay consistent; when changing one side, check the other.
- **The isolation boundary is the CLUB, not the team, for one thing only: rosters** (since v1.17.0). A team admin may read `teams/<sibling>/roster` for the other teams of their own club, so a guest player can be added with their real roster id. Nothing else crosses that line, and nothing crosses between clubs. It runs through the uid index `users/<uid>/clubTeam/<clubId>` = the team you claim to administer; the read rules re-verify that claim on every read, so a stale index grants nothing. Client side: `clubZusterPloegen()` / `clubZustersGekend()` / `warmClubZusters()` in `core.js`, written from `fetchTeamInfo`.
- **Rules are not deployed by pushing.** `database.rules.json` lives in the repo for review and history; Tim publishes it by hand in the Firebase console. Ship app code that degrades silently when the rules are not live yet — that ordering is the safety net.

## Data model (critical — do not break)

All data lives client-side on the user's device (matches in IndexedDB, teams/settings in localStorage), optionally synced via Firebase.

**Never change the structure of stored objects without migration logic. Existing data on users' devices must never become unreadable.** This is the single most important rule in this repo.

A match object has:
- `status`: `'planned'` → `'live'` → `'done'`, alongside `quarterStatus` (`'not_started'`/`'running'`/`'between'`/`'done'`) and `currentQuarter`
- `quarters`: array of `{num, startTime, endTime, totalPaused, pausedAt}`
- `events`: flat array (`goal_us`/`goal_them`, `corner_us`/`corner_them`, `substitution`, `yellow_card`/`red_card`, `penalty_us`/`penalty_them`, `freekick_us`/`freekick_them`, `injury`, `own_goal`, `quarter_start`/`quarter_end`), each carrying `gameTimeMs` (continuous play time) and `quarterNum`
- `players`: array with `starting`/`onField`/`x`/`y` for pitch position
- `shootout` (optional, v0.58.1): a penalty **shoot-out** after a draw — `{eerste: 'us'|'them', schoten: [{ploeg, raak, playerId}]}`. Deliberately **not** events: `penalty_us`/`penalty_them` events count towards the score in `recomputeScore`, so a shoot-out would turn 1-1 into 6-5. The match score stays untouched; the shoot-out only decides who won. Read it through the helpers in `core.js` (`heeftShootout`, `shootoutStand`, `shootoutWinnaar`, `shootoutTxt`, `uitslagTxt`, `shootoutZin`) — never touch `m.shootout` directly. **`matchResultaat(m)` is the single source for W/G/V** and counts a won shoot-out as a win (Tim's choice, 23-08-2026); every place that derives won/drawn/lost must use it, not a raw `scoreUs > scoreThem`.

Anything that doesn't fit the format (e.g. an opponent's disallowed goal) goes in the match's free-text `notes` field, never forced into an event.

Key globals, with the file that defines them: `dbAll`, `dbSave`, `dbDel`, `getTeamsV2`, `saveTeamsV2`, `teamById`, `recomputeScore`, `recomputeOnField`, `FORMATIONS`, `MATCH_TYPES`, `teamRef` (all `js/core.js`); `uid`, `calcMinutes` (`js/views-account.js`). Always call `recomputeScore(m)` and `recomputeOnField(m)` before `dbSave(m)` so derived state matches the events array.

## Seed/demo scripts

Test-data scripts live in `C:\Users\tbuyse\Tim - COI\COI\Claude` — a companion folder outside this repo, never committed here. It is not attached to a session by default: add it as an extra working directory when you need `demo-tornooi-verslag.js`, `demo-screenshots.js`, `migratie-fase1-clubs.js` or the others. They are self-contained IIFEs pasted into the browser console. **With an admin signed in, `cloudReady` is true and any save reaches production data**, so which rules apply depends on who runs the script:

- **A script Tim pastes himself** may write, using the app's own globals rather than raw storage structures. But `saveTeamsV2(arr)` writes the *entire* team list — `cloudOnLocalTeamsSave` does one `teamRef('roster').set(arr)` on the active team — so read the current list with `getTeamsV2()`, append, and save the whole thing back. Never pass an array holding only the test team.
- **A script run to test something during development** must not save at all: no `dbSave`, `dbDel`, `saveTeamsV2`, `saveTournaments`, or anything touching `teamRef(...).set()`. Build state in memory and stub the reads instead. UI handlers save too (`lineupTap()` → `planPauseSub()` → `dbSave()`), so read a handler before calling it or neutralise the saves first (`const _s = dbSave; dbSave = async () => {};`). A local server on port 5501 still runs as Tim's signed-in account — this has destroyed a real roster once.

## Working conventions

- **Never commit or push without explicit, per-request permission from Tim** — even mid-session after several prior approvals, ask again each time before running `git commit`/`git push`.
- Before editing production code, briefly state the problem and proposed fix first — even for small/mechanical cleanups.
- Commit messages in Dutch (Nederlands).
- On Windows PowerShell, a multi-line `-m` commit message with a `Co-Authored-By` trailer needs a single-quoted here-string (`@'...'@`, closing `'@` at column 0).
- Two tracks work on this repo: locally Tim commits straight to `master`, while in the remote environment (Claude Code on the web) work goes on branch `claude/match-delegate-app-updates-cxcevj` with PRs into `master`. Tim also runs several sessions in parallel, so check what is already in the working tree — and what came in from the other track — before committing.

## Definition of done

- Change tested in the running app (local server)
- No console errors
- Stored-data compatibility verified (existing matches/teams still load)
- Firebase sync behavior verified when data logic changed
- **Bump `APP_VERSION` in `js/core.js` on every deploy.** The `sw.js` cache name is derived automatically from `APP_VERSION` at registration time (`?v=` query param) — no separate manual `CACHE` constant to bump anymore. Without an `APP_VERSION` bump, users keep seeing the old cached version.

## History

Per-version changes live in `CHANGELOG.md` (newest first), not here. Versions before 0.5.19 are in the git history and the `analyse-*.md` files in this repo.
