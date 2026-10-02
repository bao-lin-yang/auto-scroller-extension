chrome.runtime.onInstalled.addListener(() => {
  injectIntoAllTabs();
});

chrome.runtime.onStartup.addListener(() => {
  injectIntoAllTabs();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "INJECT_INTO_ACTIVE_TAB") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab?.id && tab.url && !tab.url.startsWith("chrome://")) {
        injectIntoTab(tab.id);
      }
    });
  }
});

function injectIntoTab(tabId) {
  chrome.scripting.executeScript({
    target: { tabId },
    files: [
      "content-scripts/webpage-mode.js",
      "content-scripts/short-video-mode.js",
    ],
  });
}

function injectIntoAllTabs() {
  chrome.tabs.query({}, (tabs) => {
    for (const tab of tabs) {
      if (!tab.url || tab.url.startsWith("chrome://")) continue;
      injectIntoTab(tab.id);
    }
  });
}
