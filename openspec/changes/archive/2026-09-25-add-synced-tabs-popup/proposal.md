# Proposal

## Why

Brave Origin buries access to synced devices' open tabs inside History → "Your Devices", which is hard to reach. The user wants one-click access from the toolbar, plus a way to reopen every tab from a device at once. Research confirmed `chrome.sessions.getDevices()` exposes foreign-device sessions to MV3 extensions (Brave Sync v2 feeds the same backend), so this needs no hacks; the Tab Search button itself is native WebUI and cannot host extension content, so the toolbar popup is the entry point.

## What Changes

- New Brave Origin (Chromium MV3) browser extension, built from scratch in this repo.
- Toolbar action popup that lists sync devices and their open tabs (via `chrome.sessions.getDevices()`), refreshed on open.
- Clicking a tab restores/opens it.
- Per-device "Open all tabs" action that restores the device's session as one new window.
- Empty-state handling when no devices/sessions are available (Brave sync is known to be occasionally stale).

Non-goals for v1: search/filter box, sync timestamps, side panel, closing remote tabs (API cannot), Tab Search integration (impossible), store publishing.

## Capabilities

### New Capabilities
- `synced-tabs`: toolbar popup access to synced devices' open tabs — list devices/tabs, open a single tab, open all tabs of a device as one new window.

### Modified Capabilities
<!-- none: first capability in the repo -->

## Impact

- New code: extension manifest, popup UI, and a small module wrapping `chrome.sessions` (all new files; no existing code affected).
- Permissions: `"sessions"` only.
- Target: Brave Origin specifically (profile at `~/.config/BraveSoftware/Brave-Origin`), loaded unpacked; should also work in any Chromium browser since only standard APIs are used.
- Process: follows docs/git-workflow.md (task branch, conventional commits, CHANGELOG entry under `## [Unreleased]`).
