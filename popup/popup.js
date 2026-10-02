async function sendMessage(msg) {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tab?.id) throw new Error("No active tab is available.");

    await chrome.tabs.sendMessage(tab.id, msg);
  } catch (error) {
    console.error("Auto Scroller could not access this tab:", error);
  }
}

const speedSlider = document.getElementById("speed-input");
const speedValue = document.getElementById("speed-value");
const minusButton = document.getElementById("minus");
const plusButton = document.getElementById("plus");
const startButton = document.getElementById("start");
const stopButton = document.getElementById("stop");

//Loads saved speed when popup opens
chrome.storage.local.get("scrollSpeed", (data) => {
  const savedSpeed = data.scrollSpeed ?? 1.5;
  speedSlider.value = savedSpeed;
  speedValue.textContent = savedSpeed.toFixed(1);
  sendMessage({ action: "SET_SPEED", value: Number(savedSpeed) });
});

function updateSpeed(newSpeed) {
  speedSlider.value = newSpeed;
  speedValue.textContent = newSpeed.toFixed(1);
  chrome.storage.local.set({ scrollSpeed: newSpeed });
  sendMessage({ action: "SET_SPEED", value: Number(newSpeed) });
}

startButton.onclick = () => {
  chrome.storage.local.set({ scrollEnabled: true });
  sendMessage({ action: "START_SCROLL" });
};

stopButton.onclick = () => {
  chrome.storage.local.set({ scrollEnabled: false });
  sendMessage({ action: "STOP_SCROLL" });
};

speedSlider.oninput = (e) => {
  updateSpeed(Number(e.target.value));
};

minusButton.onclick = () => {
  let newSpeed = Number(speedSlider.value) - 0.5;
  if (newSpeed < Number(speedSlider.min)) return;
  updateSpeed(newSpeed);
};

plusButton.onclick = () => {
  let newSpeed = Number(speedSlider.value) + 0.5;
  if (newSpeed > Number(speedSlider.max)) return;
  updateSpeed(newSpeed);
};

const videoModeToggle = document.getElementById("video-mode-toggle");
const speedMin = document.getElementById("speed-min");
const speedMax = document.getElementById("speed-max");
const speedLabel = document.getElementById("speed-label");

function setVideoModeState(enabled) {
  videoModeToggle.checked = enabled;
  startButton.disabled = enabled;
  stopButton.disabled = enabled;
  speedSlider.disabled = enabled;
  minusButton.disabled = enabled;
  plusButton.disabled = enabled;
  speedMin.classList.toggle("speed-disabled", enabled);
  speedMax.classList.toggle("speed-disabled", enabled);
  speedLabel.classList.toggle("speed-disabled", enabled);
}

chrome.storage.local.get("videoModeEnabled", (data) => {
  const enabled = Boolean(data.videoModeEnabled);
  setVideoModeState(enabled);
});

chrome.runtime.sendMessage({ type: "INJECT_INTO_ACTIVE_TAB" });

videoModeToggle.addEventListener("change", (e) => {
  const enabled = e.target.checked;
  setVideoModeState(enabled);

  chrome.storage.local.set({
    videoModeEnabled: enabled,
  });

  if (enabled) {
    chrome.storage.local.set({
      scrollEnabled: false,
    });

    sendMessage({
      action: "STOP_SCROLL",
    });
  }
});
