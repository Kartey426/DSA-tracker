// Update badge count when storage changes
chrome.storage.onChanged.addListener((changes) => {
  if (changes.dsa_problems) {
    updateBadge(changes.dsa_problems.newValue || []);
  }
});

function updateBadge(problems) {
  const now = Date.now();
  const due = problems.filter(
    (p) => p.status === 'revision' && p.nextRevisionDue && now >= p.nextRevisionDue
  ).length;

  if (due > 0) {
    chrome.action.setBadgeText({ text: String(due) });
    chrome.action.setBadgeBackgroundColor({ color: '#EF9F27' });
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

// Re-check badge on startup
chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get(['dsa_problems'], (result) => {
    updateBadge(result.dsa_problems || []);
  });
});

// Daily alarm to refresh badge
chrome.alarms.create('daily-check', { periodInMinutes: 60 });
chrome.alarms.onAlarm.addListener(() => {
  chrome.storage.local.get(['dsa_problems'], (result) => {
    updateBadge(result.dsa_problems || []);
  });
});

