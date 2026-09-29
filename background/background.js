chrome.runtime.onInstalled.addListener(() => {
  injectIntoAllTabs();
});

chrome.runtime.onStartup.addListener(() => {
  injectIntoAllTabs();
});

function injectIntoAllTabs() {
  chrome.tabs.query({}, (tabs) => {
    for (const tab of tabs) {
      if (!tab.url || tab.url.startsWith("chrome://")) continue;

      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content-scripts/webpage-mode.js"],
      });
    }
  });
}
