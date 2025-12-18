// background.js (MV3 service worker)

const API_BASE_URL = "http://localhost:4000/api/v1";

async function sendExtensionEvent({ sessionId, url, steps }) {
  try {
    const payload = { sessionId, url, steps };

    const response = await fetch(`${API_BASE_URL}/extension-events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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

chrome.action.onClicked.addListener(async (tab) => {
  try {
    const url = tab.url || "";

    // Extract sessionId from URLs like http://localhost:3000/sessions/2
    const match = url.match(/\/sessions\/(\d+)/);
    const sessionId = match ? Number(match[1]) : null;

    if (!sessionId) {
      console.warn("No sessionId found in URL; not sending event.", url);
      return;
    }

    const steps = [
      {
        type: "info",
        message: "Dummy step from extension click",
        timestamp: new Date().toISOString(),
      },
    ];

    console.log("Clueso Clone Extension clicked on tab:", { url, sessionId });

    await sendExtensionEvent({ sessionId, url, steps });
  } catch (err) {
    console.error("Error handling extension click:", err);
  }
});
