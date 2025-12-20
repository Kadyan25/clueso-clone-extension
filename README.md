text
# Clueso Clone – Chrome Extension (Manifest V3)

## Overview

This repository contains the **Chrome extension** for the Clueso clone. It simulates the “recording” side of Clueso by attaching simple **extension events** to a selected session in the web app.

The extension:

- Reads the user’s **JWT** from `chrome.storage.local` (sent from the frontend).
- Detects the current **session ID** from the tab URL (e.g. `/sessions/1`).
- Sends an authenticated `POST /api/v1/extension-events` request to the Node backend with:
  - `sessionId`
  - `url`
  - a small `steps[]` array describing what happened.

These events are then visible on the **Session Detail** page in the frontend.

---

## Tech Stack

- **Manifest version:** 3  
- **Background:** service worker (`background.js`)  
- **Content script:** `content-script.js`  
- **Permissions:** `activeTab`, `storage`, host permission for the backend

---

## Files & Structure

clueso-clone-extension/
manifest.json
background.js
content-script.js
(optional icons, README, etc.)

text

### `manifest.json` (simplified)

Key points:

- `manifest_version: 3`
- `action` defines the browser toolbar icon.
- `permissions` includes `activeTab` and `storage`.
- `host_permissions` allows calls to the backend.
- `background.service_worker` points to `background.js`.
- `content_scripts` inject `content-script.js` into the frontend pages.

Example shape:

{
"manifest_version": 3,
"name": "Clueso Clone Extension",
"version": "0.1.0",
"action": {
"default_title": "Send page to Clueso Clone"
},
"permissions": ["activeTab", "storage"],
"host_permissions": ["http://localhost:4000/"],
"background": {
"service_worker": "background.js",
"type": "module"
},
"content_scripts": [
{
"matches": ["http://localhost:3000/"],
"js": ["content-script.js"],
"run_at": "document_start"
}
]
}

text

---

## JWT Bridge (`content-script.js`)

The content script listens for messages from the web app and stores the JWT in `chrome.storage.local`.

Typical logic:

// content-script.js
window.addEventListener('message', (event) => {
if (event.origin !== window.location.origin) return;
const { jwt } = event.data || {};
if (!jwt) return;

chrome.storage.local.set({ jwt }, () => {
console.log('Clueso Clone Extension: JWT stored in chrome.storage.local');
});
});

text

The Next.js frontend includes a small client component that runs:

// in AuthExtensionBridge on the page
window.postMessage({ jwt: token }, window.location.origin);

text

This is how the extension “learns” the current user’s JWT.

---

## Background Logic (`background.js`)

The background service worker:

1. Reads the stored JWT from `chrome.storage.local`.
2. Extracts `sessionId` from the current tab URL (e.g. `/sessions/2`).
3. Sends an authenticated `POST` request to `/api/v1/extension-events`.

Typical logic:

const API_BASE_URL = 'http://localhost:4000/api/v1';

async function sendExtensionEvent({ sessionId, url, steps }) {
const { jwt } = await chrome.storage.local.get(['jwt']);
if (!jwt) {
console.warn('Clueso Clone Extension: No JWT found in storage.');
return;
}

const headers = {
'Content-Type': 'application/json',
Authorization: Bearer ${jwt},
};

const payload = { sessionId, url, steps };

try {
const res = await fetch(${API_BASE_URL}/extension-events, {
method: 'POST',
headers,
body: JSON.stringify(payload),
});

text
if (!res.ok) {
  console.error('Clueso Clone Extension: Backend returned error', res.status);
  return;
}

console.log('Clueso Clone Extension: Event sent successfully');
} catch (err) {
console.error('Clueso Clone Extension: Failed to send event', err);
}
}

chrome.action.onClicked.addListener(async (tab) => {
if (!tab || !tab.url) return;

const url = tab.url;
const match = url.match(//sessions/(\d+)/);
if (!match) {
console.warn(
'Clueso Clone Extension: No sessionId found in URL. Open /sessions/:id first.'
);
return;
}

const sessionId = Number(match);
​

const steps = [
{
type: 'info',
message: 'User clicked the Clueso Clone extension on this session page.',
timestamp: new Date().toISOString(),
},
];

await sendExtensionEvent({ sessionId, url, steps });
});

text

---

## End-to-end Flow

1. User logs in on the frontend and gets a JWT.  
2. Frontend calls `window.postMessage({ jwt }, window.location.origin)` via the bridge component.  
3. `content-script.js` receives the message and saves `jwt` into `chrome.storage.local`.  
4. User navigates to `/sessions/:id` (e.g. `/sessions/1`).  
5. User clicks the **Clueso Clone Extension** icon in the Chrome toolbar.  
6. `background.js`:
   - Reads the URL, extracts `sessionId`.
   - Reads `jwt` from `chrome.storage.local`.
   - Sends `POST /api/v1/extension-events` with `{ sessionId, url, steps }`.  
7. The Node backend verifies the JWT, checks that the session belongs to the user, and stores an `ExtensionEvent`.  
8. The Session Detail page (`/sessions/[id]`) shows the new event under “Extension Events”.

---

## Running the Extension Locally

1. **Build or prepare the extension folder**

Ensure `manifest.json`, `background.js`, and `content-script.js` are in the same folder (e.g. `clueso-clone-extension/`).

2. **Enable Developer Mode in Chrome**

- Open `chrome://extensions` in Chrome.
- Toggle **Developer mode** on (top-right corner).

3. **Load unpacked extension**

- Click **“Load unpacked”**.
- Select the `clueso-clone-extension` folder.

4. **Verify it appears**

- You should see “Clueso Clone Extension” in the extensions list.
- Pin the extension icon to the Chrome toolbar for easier access.

5. **Use with the app**

- Backend running at `http://localhost:4000`.
- Frontend running at `http://localhost:3000`.
- Log in on the frontend.
- Open a session detail page: `http://localhost:3000/sessions/1`.
- Click the extension icon → an event should appear under “Extension Events” for that session.

---

## Limitations & Notes

- The extension does **not** capture real clicks/DOM events yet; it sends a simple synthetic `steps` array.  
- It assumes the session URL pattern is `/sessions/:id`.  
- It works only against `http://localhost:3000` and `http://localhost:4000` unless host permissions are updated.  
