async function sendMessage(msg) {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tab?.id) throw new Error("No active tab is available.");

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content-scripts/webpage-mode.js"],
    });
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
  sendMessage({ action: "START_SCROLL" });
};

stopButton.onclick = () => {
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
