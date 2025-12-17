// background.js (MV3 service worker)

// Backend base URL – adjust if your API base changes
const API_BASE_URL = "http://localhost:4000/api/v1";

/**
 * Helper to send extension event data to backend.
 * For now this just uses a hard-coded sessionId = 1.
 * Later you can wire this to a real session from the frontend.
 */
async function sendExtensionEvent({ sessionId, url, steps }) {
  try {
    const payload = {
      sessionId,
      url,
      steps
    };

    const response = await fetch(`${API_BASE_URL}/extension-events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error("Failed to send extension event:", response.status, await response.text());
      return;
    }

    const data = await response.json();
    console.log("Extension event stored successfully:", data);
  } catch (err) {
    console.error("Error calling backend from extension:", err);
  }
}

/**
 * When the user clicks the extension icon:
 * - Use the active tab.
 * - Send its URL with some dummy steps to the backend.
 */
chrome.action.onClicked.addListener(async (tab) => {
  try {
    const url = tab.url || "";
    const sessionId = 1; // TODO: later wire this to a real session

    const steps = [
      {
        type: "info",
        message: "Dummy step from extension click",
        timestamp: new Date().toISOString()
      }
    ];

    console.log("Clueso Clone Extension clicked on tab:", { url, sessionId });

    await sendExtensionEvent({ sessionId, url, steps });
  } catch (err) {
    console.error("Error handling extension click:", err);
  }
});
