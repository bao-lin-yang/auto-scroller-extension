let videoModeEnabled = false;
let currentVideo = null;
let videoObserver = null;
let domObserver = null;
let monitoringInterval = null;
let isScrolling = false;
const observedVideos = new Set();

function getScrollContainer() {
  const elements = [...document.querySelectorAll("*")];

  const candidates = elements.filter((el) => {
    const style = getComputedStyle(el);
    return (
      (style.overflowY === "auto" || style.overflowY === "scroll") &&
      el.scrollHeight > el.clientHeight
    );
  });

  const snapContainer = candidates.find((el) => {
    const style = getComputedStyle(el);
    return (
      style.scrollSnapType.includes("y") ||
      style.scrollSnapType.includes("both")
    );
  });

  if (snapContainer) return snapContainer;
  return candidates.sort((a, b) => b.scrollHeight - a.scrollHeight)[0] || null;
}

function scrollToNextVideo() {
  if (isScrolling) return;

  isScrolling = true;
  const scroller = getScrollContainer();

  if (!scroller) {
    document.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "ArrowDown",
        code: "ArrowDown",
        keyCode: 40,
        which: 40,
        bubbles: true,
        cancelable: true,
      }),
    );

    setTimeout(() => {
      isScrolling = false;
    }, 1000);

    return;
  }

  scroller.scrollBy({
    top: scroller.clientHeight,
    behavior: "smooth",
  });

  setTimeout(() => {
    isScrolling = false;
  }, 1000);
}

function createVideoObserver() {
  videoObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const video = entry.target;
        if (!(video instanceof HTMLVideoElement)) return;
        currentVideo = video;
      });
    },
    { threshold: 0.75 },
  );
}

function observeVideo(video) {
  if (!(video instanceof HTMLVideoElement)) return;
  if (observedVideos.has(video)) return;

  observedVideos.add(video);
  videoObserver.observe(video);
}

function observeVideos(root = document) {
  if (!root.querySelectorAll) return;
  root.querySelectorAll("video").forEach(observeVideo);
}

function createDomObserver() {
  domObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) {
          continue;
        }

        if (node instanceof HTMLVideoElement) {
          observeVideo(node);
        }

        observeVideos(node);
      }
    }
  });

  domObserver.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
}

function startMonitoring() {
  monitoringInterval = setInterval(() => {
    if (!videoModeEnabled || !currentVideo) return;

    const video = currentVideo;

    if (
      video.readyState < HTMLMediaElement.HAVE_METADATA ||
      !Number.isFinite(video.duration) ||
      video.duration <= 0
    )
      return;

    if (video.currentTime >= video.duration - 0.5) {
      scrollToNextVideo();
    }
  }, 250);
}

function startVideoMode() {
  if (videoModeEnabled) return;
  videoModeEnabled = true;
  createVideoObserver();
  observeVideos();
  createDomObserver();
  startMonitoring();
}

function stopVideoMode() {
  if (!videoModeEnabled) return;
  videoModeEnabled = false;
  currentVideo = null;
  isScrolling = false;

  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
  }

  if (videoObserver) {
    videoObserver.disconnect();
    videoObserver = null;
  }

  if (domObserver) {
    domObserver.disconnect();
    domObserver = null;
  }

  observedVideos.clear();
}

chrome.storage.local.get("videoModeEnabled", (data) => {
  const enabled = data.videoModeEnabled === true;
  if (enabled) {
    startVideoMode();
  }
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local") return;
  const change = changes.videoModeEnabled;
  if (!change) return;
  const enabled = change.newValue === true;
  if (enabled) {
    startVideoMode();
  } else {
    stopVideoMode();
  }
});

chrome.runtime.onMessage.addListener(({ action }) => {
  if (action === "START_VIDEO_MODE") {
    startVideoMode();
  }

  if (action === "STOP_VIDEO_MODE") {
    stopVideoMode();
  }
});
