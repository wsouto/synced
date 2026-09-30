# Spec Delta

## Purpose

Gives one-click toolbar access to the open tabs of devices synced through the browser's sync feature, so users can browse and reopen remote tabs without digging through History.

## ADDED Requirements

### Requirement: Toolbar popup lists synced devices and their open tabs
The extension SHALL present a toolbar popup that, each time it opens, lists every synced device reported by the browser other than this device, each with entries for its open tabs. Tabs SHALL NOT be cached across popup opens: the list reflects the freshest data the browser provides at open time. Each entry shows the page title (with its address beneath) when the browser's extension API exposes them; where the platform omits remote titles and addresses (Brave today), entries fall back to a position label with no address line and remain restorable by session id.

#### Scenario: Devices present
- **WHEN** the popup opens and the browser reports one or more other synced devices with open tabs
- **THEN** each device appears with its name, and under it one restorable entry per open tab, showing the page title and address when the API provides them and a position label otherwise

#### Scenario: This device excluded
- **WHEN** the popup opens
- **THEN** the device the popup is running on does not appear in the list

#### Scenario: Refresh on reopen
- **WHEN** the popup is closed and reopened after a device closed or opened tabs
- **THEN** the newly listed entries reflect the browser's latest reported state, not the previous popup's contents

### Requirement: Opening a single remote tab
The popup SHALL restore a listed tab into the current window as a new tab when the user activates its entry, using the browser's session-restore facility (which retains the tab's real address even though the API does not expose it).

#### Scenario: Click a tab entry
- **WHEN** the user clicks a tab entry for another device
- **THEN** the browser restores that tab as a new tab in the current window and the popup closes

#### Scenario: Restore fails
- **WHEN** the browser reports an error restoring a session entry
- **THEN** the popup stays open and shows the error on the affected entry instead of failing silently

### Requirement: Opening all tabs of a device
The popup SHALL offer a per-device action that restores every reported session of that device. Each reported window session reopens as its own new window (devices commonly report one); sessions without a window restore as tabs. A restore that opens a window shifts focus and closes the popup, so all restores are issued together before that can happen.

#### Scenario: Open all for a device
- **WHEN** the user activates the "Open all tabs" action for a device
- **THEN** every open tab of that device reopens, its window session(s) as new window(s), and the popup closes

#### Scenario: Device reports multiple windows
- **WHEN** a device reports tabs across multiple windows and the user activates "Open all tabs" for it
- **THEN** each reported window reopens as its own window (flattening into a single window is not possible: the API does not expose the addresses to rebuild one)

### Requirement: Empty state when no synced sessions exist
The popup SHALL show an explanatory empty state, not an error, when the browser reports no other synced devices or no sessions.

#### Scenario: No devices
- **WHEN** the popup opens and the browser reports no other synced devices
- **THEN** the popup shows a short message explaining no synced device tabs are available and where they come from (browser sync), without crashing or showing a raw error
