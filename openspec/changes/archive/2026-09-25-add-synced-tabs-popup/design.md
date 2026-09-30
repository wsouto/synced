# Design

## Context

Greenfield repo — no code yet. Target is Brave Origin (Chromium, MV3) loaded unpacked; standard WebExtension APIs only. Research (see proposal) established: `chrome.sessions.getDevices()` exposes foreign-device sessions; there is no event for sync-session changes; remote tabs cannot be closed; Tab Search cannot host extension UI.

## Goals / Non-Goals

**Goals:**
- Smallest correct MV3 extension: toolbar popup that reads sync sessions and opens tabs.
- Zero build tooling — files load unpacked directly from the repo.

**Non-Goals:**
- No framework, bundler, or package manager for v1 (plain HTML/CSS/JS).
- No background service worker — the popup alone does all work.
- No caching/storage of device data between popup opens.

## Decisions

1. **Architecture: popup-only, no service worker.** The popup is an extension page with full API access; it queries `chrome.sessions.getDevices()` on every open. Re-querying on open satisfies the spec's no-stale-cache requirement for free, and since no event exists for sync changes, a background worker would add code without adding freshness.
   *Alternative:* background worker caching into `chrome.storage` — rejected: more moving parts, worse freshness.

2. **File layout: `src/` directory** (`manifest.json`, `popup.html`, `popup.css`, `popup.js`), loaded unpacked from `src/`. Keeps repo root clean for docs/openspec.
   *Alternative:* repo root — rejected: mixes docs and shippable files.

3. **Open single tab: `chrome.sessions.restore(tabSessionId)`** into the current window. Live testing on Brave Origin showed `getDevices()` returns foreign sessions whose tab records carry session ids but NO `url`/`title` (the built-in `brave://history/syncedTabs` view still shows them, so the browser's session model has the data — Brave just doesn't serialize it to the extension API). Restore-by-session-id is therefore the only path that opens real content; it also preserves the tab's true address without the API exposing it.
   *Alternative:* `chrome.tabs.create({url})` — impossible on Brave: no URL to pass.

4. **Open all: restore each reported window session via `chrome.sessions.restore(windowSessionId)`**, single-tab sessions restored as tabs. All restores are fired in one tick, because the first window restore shifts focus, closes the popup, and would kill any restore still queued in popup JS. Each reported window reopens as its own window (commonly one per device) — flattening into a single window is impossible without URLs, which the API omits.
   *Alternative:* `chrome.windows.create({url: [...]})` — impossible on Brave: no URLs.

5. **Manifest:** MV3, `"permissions": ["sessions"]`, `action.default_popup`. No extra permissions — no tabs permission needed to create tabs, no icons in v1 (Brave shows the default puzzle-piece icon; custom icon is a later polish item).

## Risks / Trade-offs

- [Brave Sync returns stale or empty data (known Brave flakiness)] → Empty state is specified and must be friendly, explaining data comes from browser sync.
- [`getDevices()` on Brave Origin is inferred-working, not officially documented] → First implementation task is a live smoke test on the real sync chain; if it returns nothing, fallback is the documented `brave://history/syncedTabs` deep link while the gap is investigated.
- [Very large session lists capped by the browser's max-results limit] → Accept the cap for v1; it matches what History's own UI shows.
