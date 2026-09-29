(() => {
  const stateKey = "__edgeAutoScrollerContentScript";
  if (globalThis[stateKey]) return;
  globalThis[stateKey] = true;

  let scrolling = false;
  let scrollSpeed = 1.0;

  function startScroll() {
    if (scrolling) return;
    scrolling = true;
    scrollLoop();
  }

  function stopScroll() {
    scrolling = false;
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
      console.log("Reached bottom, stopping auto-scroll");
      return;
    }

    window.scrollBy(0, scrollSpeed);
    requestAnimationFrame(scrollLoop);
  }

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === "START_SCROLL") startScroll();
    if (msg.action === "STOP_SCROLL") stopScroll();
    if (msg.action === "SET_SPEED") scrollSpeed = msg.value;
  });
})();
