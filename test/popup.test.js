// Run: node test/popup.test.js
const assert = require('node:assert/strict');
const { collectSessions, deviceHasTabs, restoreTargets, countDeviceTabs, badgeText } = require('../src/popup.js');

let failures = 0;
function check(name, fn) {
  try {
    fn();
    console.log('ok -', name);
  } catch (e) {
    failures++;
    console.error('FAIL -', name, '\n ', e.message);
  }
}

const noMeta = (sessionId) => ({ sessionId, title: null, url: null });

check('collects window sessionId and tab sessionIds', () => {
  const device = {
    deviceName: 'iPhone',
    sessions: [
      {
        window: {
          sessionId: 'w1',
          tabs: [{ sessionId: 't1' }, { sessionId: 't2' }, { sessionId: 't3' }],
        },
      },
    ],
  };
  assert.deepEqual(collectSessions(device), [
    {
      windowId: 'w1',
      tabIds: ['t1', 't2', 't3'],
      tabs: [noMeta('t1'), noMeta('t2'), noMeta('t3')],
    },
  ]);
});

check('tab title and url carried through when the API exposes them', () => {
  const device = {
    sessions: [
      {
        window: {
          sessionId: 'w1',
          tabs: [{ sessionId: 't1', title: 'Example', url: 'https://example.com/' }],
        },
      },
    ],
  };
  const [session] = collectSessions(device);
  assert.deepEqual(session.tabs, [
    { sessionId: 't1', title: 'Example', url: 'https://example.com/' },
  ]);
});

check('multiple windows become separate entries', () => {
  const device = {
    sessions: [
      { window: { sessionId: 'w1', tabs: [{ sessionId: 't1' }] } },
      { window: { sessionId: 'w2', tabs: [{ sessionId: 't2' }] } },
    ],
  };
  assert.deepEqual(collectSessions(device).map((s) => s.windowId), ['w1', 'w2']);
});

check('single-tab session becomes an entry without a window', () => {
  const device = { sessions: [{ tab: { sessionId: 't9', title: 'Solo', url: 'https://solo.dev/' } }] };
  assert.deepEqual(collectSessions(device), [
    {
      windowId: null,
      tabIds: ['t9'],
      tabs: [{ sessionId: 't9', title: 'Solo', url: 'https://solo.dev/' }],
    },
  ]);
});

check('tabs without a sessionId are skipped', () => {
  const device = {
    sessions: [{ window: { sessionId: 'w1', tabs: [{ sessionId: 't1' }, {}, { index: 2 }] } }],
  };
  assert.deepEqual(collectSessions(device), [
    { windowId: 'w1', tabIds: ['t1'], tabs: [noMeta('t1')] },
  ]);
});

check('window without sessionId still contributes its tabs', () => {
  const device = { sessions: [{ window: { tabs: [{ sessionId: 't1' }] } }] };
  assert.deepEqual(collectSessions(device), [
    { windowId: null, tabIds: ['t1'], tabs: [noMeta('t1')] },
  ]);
});

check('empty devices report no tabs', () => {
  assert.equal(deviceHasTabs({ deviceName: 'x', sessions: [] }), false);
  assert.equal(deviceHasTabs({ deviceName: 'x' }), false);
  assert.equal(deviceHasTabs({ sessions: [{ window: { sessionId: 'w', tabs: [] } }] }), false);
  assert.equal(deviceHasTabs({ sessions: [{ window: { sessionId: 'w', tabs: [{ sessionId: 't' }] } }] }), true);
});

check('counts tabs across devices and formats the toolbar badge', () => {
  const devices = [
    { sessions: [{ tab: { sessionId: 'a' } }, { tab: { sessionId: 'b' } }] },
    { sessions: [{ window: { tabs: [{ sessionId: 'c' }, {}] } }] },
  ];
  assert.equal(countDeviceTabs(devices), 3);
  assert.equal(badgeText(countDeviceTabs(devices)), '3');
  assert.equal(badgeText(0), '');
  assert.equal(badgeText(100), '99+');
});

check('open-all restores only the window session when one exists (no duplicate tabs)', () => {
  const sessions = [{ windowId: 'w1', tabIds: ['t1', 't2', 't3'] }];
  assert.deepEqual(restoreTargets(sessions), ['w1']);
});

check('windowless sessions fall back to per-tab restores', () => {
  const sessions = [
    { windowId: null, tabIds: ['t1', 't2'] },
    { windowId: 'w3', tabIds: ['t4'] },
  ];
  assert.deepEqual(restoreTargets(sessions), ['t1', 't2', 'w3']);
});

process.exit(failures ? 1 : 0);
