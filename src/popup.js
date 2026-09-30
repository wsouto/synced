// Synced Tabs — toolbar popup listing the open tabs of other synced devices.
// Data source: chrome.sessions.getDevices(). The `tabs` permission in the
// manifest grants access to sensitive tab fields such as url/title; if the
// API still omits them, entries remain restorable by session id via
// chrome.sessions.restore().

// --- pure helpers (unit-tested in test/popup.test.js) ---

function collectSessions(device) {
  const out = [];
  for (const session of device.sessions ?? []) {
    if (session.window) {
      const tabs = (session.window.tabs ?? []).filter((tab) => tab.sessionId);
      out.push({
        windowId: session.window.sessionId ?? null,
        tabIds: tabs.map((tab) => tab.sessionId),
        tabs: tabs.map(displayTab),
      });
    } else if (session.tab && session.tab.sessionId) {
      out.push({
        windowId: null,
        tabIds: [session.tab.sessionId],
        tabs: [displayTab(session.tab)],
      });
    }
  }
  return out;
}

// Brave's API today serializes foreign session tabs without url/title (its
// own "Your Devices" view still shows them). Other Chromium builds — or a
// fixed Brave — populate both. Carry what exists, null otherwise.
function displayTab(tab) {
  return {
    sessionId: tab.sessionId,
    title: tab.title || null,
    url: tab.url || null,
  };
}

function deviceHasTabs(device) {
  return collectSessions(device).some((session) => session.tabIds.length > 0);
}

function countDeviceTabs(devices) {
  return devices.reduce(
    (count, device) => count + collectSessions(device).reduce(
      (total, session) => total + session.tabIds.length,
      0,
    ),
    0,
  );
}

function badgeText(count) {
  return count > 99 ? '99+' : count ? String(count) : '';
}

// --- popup UI ---

const EMPTY_MESSAGE =
  'No synced device tabs right now. Tabs open on your other devices ' +
  '(via browser sync) will appear here — this list keeps refreshing ' +
  'automatically for a while.';

function renderDevices(devices, root) {
  root.replaceChildren();
  // Devices with no open tabs are hidden: nothing actionable on them.
  const withTabs = devices.filter(deviceHasTabs);
  if (withTabs.length === 0) {
    root.append(emptyParagraph(EMPTY_MESSAGE));
    return;
  }
  for (const device of withTabs) root.append(renderDevice(device));
}

function renderDevice(device) {
  const sessions = collectSessions(device);
  const section = document.createElement('section');
  section.className = 'device';

  const header = document.createElement('header');
  const name = document.createElement('span');
  name.className = 'device-name';
  name.textContent = device.deviceName;
  const openAll = document.createElement('button');
  openAll.className = 'open-all';
  openAll.type = 'button';
  openAll.textContent = 'Open all';
  openAll.addEventListener('click', () => restoreDeviceSessions(sessions));
  header.append(name, openAll);

  const list = document.createElement('ul');
  let index = 0;
  for (const session of sessions) {
    for (const tab of session.tabs) {
      index += 1;
      list.append(renderTabRow(tab, index));
    }
  }

  section.append(header, list);
  return section;
}

// Real page title/address when the browser exposes them; position label
// otherwise. Restoring still pulls the true page from the session model.
function renderTabRow(tab, index) {
  const li = document.createElement('li');
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'tab';
  const title = document.createElement('span');
  title.className = 'tab-title';
  title.textContent = tab.title ?? `Tab ${index}`;
  button.append(title);
  if (tab.url) {
    const url = document.createElement('span');
    url.className = 'tab-url';
    url.textContent = tab.url;
    button.append(url);
  }
  button.addEventListener('click', () => restoreTab(tab.sessionId, button));
  li.append(button);
  return li;
}

function restoreTab(tabId, row) {
  chrome.sessions.restore(tabId, () => {
    const error = chrome.runtime.lastError?.message;
    if (error) showRowError(row, error);
  });
}

// Which session ids "Open all" should restore: a window session covers all
// its tabs; only windowless (single-tab) sessions fall back to per-tab ids.
function restoreTargets(sessions) {
  const targets = [];
  for (const session of sessions) {
    if (session.windowId) targets.push(session.windowId);
    else targets.push(...session.tabIds);
  }
  return targets;
}

function restoreDeviceSessions(sessions) {
  // Fire all restores in one tick: opening the first window shifts focus and
  // closes the popup, which would kill any restore still queued in JS.
  Promise.all(restoreTargets(sessions).map(quietRestore));
}

function quietRestore(sessionId) {
  return new Promise((resolve) => {
    chrome.sessions.restore(sessionId, () => resolve(chrome.runtime.lastError));
  });
}

function showRowError(row, message) {
  const url = row.querySelector('.tab-url');
  if (url) url.textContent = `Could not restore: ${message}`;
}

function emptyParagraph(text) {
  const p = document.createElement('p');
  p.className = 'empty';
  p.textContent = text;
  return p;
}

async function main() {
  const root = document.getElementById('devices');
  try {
    let devices = await chrome.sessions.getDevices();
    await chrome.runtime.sendMessage({ type: 'updateBadge' });
    renderDevices(devices, root);
    // Refresh in the background for a while: sync data can lag browser
    // startup, and getDevices() returns whatever is synced at call time.
    const deadline = Date.now() + 30000;
    while (!devices.some(deviceHasTabs) && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      devices = await chrome.sessions.getDevices();
      await chrome.runtime.sendMessage({ type: 'updateBadge' });
      renderDevices(devices, root);
    }
  } catch (err) {
    root.replaceChildren();
    root.append(emptyParagraph(`Could not read synced sessions: ${err.message}`));
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', main);
}
if (typeof module !== 'undefined') {
  module.exports = { collectSessions, deviceHasTabs, restoreTargets, countDeviceTabs, badgeText };
}
