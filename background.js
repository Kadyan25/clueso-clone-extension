// background.js (MV3 service worker)

const API_BASE_URL = "http://localhost:4000/api/v1";

async function sendExtensionEvent({ sessionId, url, steps }) {
  try {
    // Read JWT from chrome.storage.local (set by content script via postMessage)
    const result = await chrome.storage.local.get(['jwt']);
    const jwt = result.jwt;
    console.log('JWT from storage in background:', jwt);

    if (!jwt) {
      console.warn(
        "No JWT found in chrome.storage.local; not sending extension event.",
      );
      return;
    }

    const payload = { sessionId, url, steps };

    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${jwt}`,
    };
    console.log('About to fetch with headers:', headers, 'payload:', payload);

    const response = await fetch(`${API_BASE_URL}/extension-events`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(
        "Failed to send extension event:",
        response.status,
        await response.text(),
      );
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
