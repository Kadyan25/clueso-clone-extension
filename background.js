// background.js (MV3 service worker)

const API_BASE_URL = "http://localhost:4000/api/v1";

async function createSessionFromExtension({ url, steps }) {
  try {
    // Read JWT from chrome.storage.local (set by content script via postMessage)
    const result = await chrome.storage.local.get(['jwt']);
    const jwt = result.jwt;
    console.log('JWT from storage in background:', jwt);

    if (!jwt) {
      console.warn(
        "No JWT found in chrome.storage.local; log in to the web app first.",
      );
      return null;
    }

    const response = await fetch(`${API_BASE_URL}/sessions/from-extension`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${jwt}`,
      },
      body: JSON.stringify({ url, steps }),
    });

    if (!response.ok) {
      console.error(
        "Failed to create session from extension:",
        response.status,
        await response.text(),
      );
      return null;
    }

    const data = await response.json(); // { session, event }
    console.log("Session created successfully from extension:", data);
    return data;
  } catch (err) {
    console.error("Error calling backend from extension:", err);
    return null;
  }
}

// Popup → background message bridge
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'CREATE_SESSION_FROM_EXTENSION') {
    const { url, steps } = message.payload || {};
    createSessionFromExtension({ url, steps })
      .then((data) => {
        if (data && data.session) {
          const frontendUrl = `http://localhost:3000/sessions/${data.session.id}`;
          chrome.tabs.create({ url: frontendUrl });
        }
        sendResponse({ ok: true });
      })
      .catch((err) => {
        console.error('Error in CREATE_SESSION_FROM_EXTENSION:', err);
        sendResponse({ ok: false, error: String(err) });
      });
    return true; // keep channel open for async sendResponse
  }
});
