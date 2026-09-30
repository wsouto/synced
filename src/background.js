async function updateBadge() {
  const devices = await chrome.sessions.getDevices();
  const count = devices.reduce(
    (total, device) => total + (device.sessions ?? []).reduce((deviceTotal, session) => {
      const tabs = session.window?.tabs ?? (session.tab ? [session.tab] : []);
      return deviceTotal + tabs.filter((tab) => tab.sessionId).length;
    }, 0),
    0,
  );
  await chrome.action.setBadgeText({ text: count > 99 ? '99+' : count ? String(count) : '' });
  await chrome.action.setBadgeBackgroundColor({ color: '#85aef0' });
}

chrome.runtime.onStartup.addListener(updateBadge);
chrome.runtime.onInstalled.addListener(updateBadge);
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'updateBadge') updateBadge();
});
