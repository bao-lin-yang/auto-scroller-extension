(() => {
  if (window.__autoScrollerLoaded) return;
  window.__autoScrollerLoaded = true;

  let scrolling = false;
  let scrollSpeed = 1.0;

  function startScroll() {
    if (scrolling) return;
    scrolling = true;
    scrollLoop();
  }

  function stopScroll() {
    scrolling = false;
    chrome.storage.local.set({ scrollEnabled: false });
  }

  function scrollLoop() {
    if (!scrolling) return;

    const atBottom =
      Math.ceil(
        document.documentElement.scrollTop +
          document.documentElement.clientHeight +
          50,
      ) >= document.documentElement.scrollHeight;

    if (atBottom) {
      scrolling = false;
      chrome.storage.local.set({ scrollEnabled: false });
      return;
    }

    window.scrollBy(0, scrollSpeed);
    requestAnimationFrame(scrollLoop);
  }

  chrome.storage.local.get(["scrollEnabled", "scrollSpeed"], (data) => {
    if (typeof data.scrollSpeed === "number") {
      scrollSpeed = data.scrollSpeed;
    }
    if (data.scrollEnabled) {
      startScroll();
    }
  });

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === "START_SCROLL") {
      chrome.storage.local.set({ scrollEnabled: true });
      startScroll();
    }
    if (msg.action === "STOP_SCROLL") {
      chrome.storage.local.set({ scrollEnabled: false });
      stopScroll();
    }
    if (msg.action === "SET_SPEED") {
      scrollSpeed = msg.value;
      chrome.storage.local.set({ scrollSpeed: msg.value });
    }
  });
})();
