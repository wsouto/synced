# Tasks

## 1. Scaffolding and feasibility smoke test

- [x] 1.1 Create `src/manifest.json` (MV3, `"permissions": ["sessions"]`, `action.default_popup`) plus empty `src/popup.html`/`popup.css`/`popup.js`; verify the extension loads unpacked in Brave Origin (`brave://extensions` → Load unpacked → `src/`) with no load errors — verified: loads and reloads cleanly
- [x] 1.2 Feasibility gate: verify on the real Brave Origin sync chain that other devices are returned by `chrome.sessions.getDevices()` — verified via raw dump: devices and sessions return, but tab records carry NO `url`/`title` on Brave (the built-in view still shows them); pivot: restore by session id instead of opening by URL (see design.md decisions 3–4)

## 2. Popup device/tab list

- [x] 2.1 On popup open, query `chrome.sessions.getDevices()` and render each device name with one restorable entry per open tab, labeled by position (Brave's API omits remote titles/URLs); verify the running device is excluded and device names + tab counts match `brave://history/syncedTabs` — verified: device list rendered; entries match the raw dump (iPhone 3 tabs, desktop 1 stale) and the current device is absent
- [x] 2.3 Show the real page title (with address beneath) when the session API exposes them; fall back to the position label with no address line otherwise — display mapping verified by `node test/popup.test.js`; on Brave Origin the fallback is expected to remain until Brave serializes url/title (upstream-reportable gap)
- [x] 2.2 Implement the empty state (message explaining no synced device tabs are available and that data comes from browser sync) — verified live during the 1.2 diagnosis (popup rendered the empty state plus debug dump)

## 3. Opening tabs

- [x] 3.1 Clicking a tab entry restores it via `chrome.sessions.restore(sessionId)` into the current window as a new tab; on restore error the popup stays open and shows the error on the row — verified: "Tab N" click restored the real page
- [x] 3.2 Per-device "Open all tabs" action fires all restores in one tick (each reported window session reopens as its own window; single-tab sessions restore as tabs), so the popup closing mid-way cannot kill pending restores — verified: one new window with the device's tabs, no duplicates (after the window-vs-tab double-restore fix)
- [x] 3.3 Skip tab records without a `sessionId` when collecting entries; verify by checking the collector against stubbed sessions — verified by `node test/popup.test.js`

## 4. Integration check and repo housekeeping

- [x] 4.1 Full manual pass on Brave Origin covering every scenario in `specs/synced-tabs/spec.md` — verified across the session: device list renders with position-labeled entries (matches raw dump + built-in view), this device excluded, empty state observed live, single restore works, open-all restores the window session once; refresh-on-reopen holds by construction (no cache — every open re-queries `getDevices()`; observed across repeated popup opens)
- [x] 4.2 Add load-unpacked install instructions to README.md and an `Added` entry under `## [Unreleased]` in CHANGELOG.md — verified: the documented Load unpacked steps were followed successfully on Brave Origin
