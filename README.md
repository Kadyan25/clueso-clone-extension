# Clueso Clone – Chrome Extension (Manifest V3)

## Overview

This repository contains the **Chrome extension** for the Clueso clone. It simulates the “recording” side of Clueso by letting the user start a recording on any page, which automatically creates a **new session** in the web app rather than attaching events to an existing, manually created session.[web:22]

The extension now:

- Reads the user’s **JWT** from `chrome.storage.local` (sent from the frontend).
- Shows a small popup with a **“Start Recording”** button when the toolbar icon is clicked.
- When “Start Recording” is clicked, it sends an authenticated `POST /api/v1/sessions/from-extension` request to the Node backend with:
  - the current tab `url`
  - a small `steps[]` array describing what was captured.
- The backend:
  - Creates a new `Session` for the logged‑in user.
  - Creates the first `ExtensionEvent` for that session.
- The extension then opens `http://localhost:3000/sessions/<id>` in a new tab so the user can view and process the newly created session.

These events and sessions are visible on the **Sessions** and **Session Detail** pages in the frontend.

---

## Tech Stack

- **Manifest version:** 3  
- **Background:** service worker (`background.js`)  
- **Popup:** `popup.html` + `popup.js` (simple “Start Recording” UI)  
- **Content script:** `content-script.js` (JWT bridge)  
- **Permissions:** `activeTab`, `storage`, host permission for the backend

---

## Files & Structure

- `manifest.json` – Chrome extension manifest (MV3), declares the popup, background service worker, permissions, and content script.
- `background.js` – Service worker that:
  - Reads the JWT from `chrome.storage.local`.
  - Receives messages from the popup.
  - Calls `POST /api/v1/sessions/from-extension` on the backend.
  - Opens the new session in the web app.
- `content-script.js` – Injected into the frontend; listens for a `window.postMessage({ jwt })` from the app and stores `jwt` in `chrome.storage.local`.
- `popup.html` – Minimal HTML shell for the popup UI.
- `popup.js` – Handles the “Start Recording” click and sends a message to the background script.
- `README.md` – This file.

---

## JWT Bridge

The extension still uses the same JWT bridge pattern:

- The **Next.js frontend** renders an `AuthExtensionBridge` component on authenticated pages.  
- That component calls `window.postMessage({ jwt: token }, window.location.origin)` whenever the user is logged in.  
- `content-script.js` listens for this message and writes `{ jwt }` into `chrome.storage.local`.

Because the Chrome extension and the web app both use the same JWT, backend endpoints can verify the user the same way whether the request comes from the frontend or the extension.

---

## Recording & Session Creation Flow

The older version of this extension:

- Parsed `sessionId` from URLs like `/sessions/1`.
- Sent events to `POST /api/v1/extension-events` for an already existing session.

The current version is closer to the real Clueso flow:

1. User logs into the web app and visits `/sessions` (so the JWT is sent to the extension).
2. User navigates to any page they want to “record” (can be the web app or any other site).
3. User clicks the **Clueso Clone Extension** icon → the popup opens.
4. User clicks **“Start Recording”** in the popup.
5. The popup asks the background script to create a session from the current tab.
6. The background script:
   - Reads `jwt` from `chrome.storage.local`.
   - Reads the active tab `url`.
   - Builds a simple `steps[]` array.
   - Calls `POST /api/v1/sessions/from-extension` on the backend.
7. The backend:
   - Creates a new `Session` row with a generated name (e.g. “Recording – &lt;timestamp&gt;”) and description (“Recorded from &lt;url&gt;”) for that user.
   - Creates the first `ExtensionEvent` row for this session using `{ url, steps }`.
8. The background script opens `http://localhost:3000/sessions/<newId>` in a new tab.
9. On that Session Detail page, the user can click **“Process with AI”** to trigger AI processing in the Node backend.

There is no need to manually create a session from the web app before using the extension.

---

## Running the Extension Locally

1. **Prepare the extension folder**

   Ensure this folder contains at least:

   - `manifest.json`
   - `background.js`
   - `content-script.js`
   - `popup.html`
   - `popup.js`

2. **Enable Developer Mode in Chrome**

   - Open `chrome://extensions` in Chrome.
   - Toggle **Developer mode** on.

3. **Load the unpacked extension**

   - Click **“Load unpacked”**.
   - Select the `clueso-clone-extension` folder.

4. **Use with the app**

   - Start the backend at `http://localhost:4000`.
   - Start the frontend at `http://localhost:3000`.
   - Log in on the frontend and navigate to `/sessions` (to send the JWT to the extension).
   - Open any page you want to capture.
   - Click the extension icon → popup → **Start Recording**.
   - A new tab for `http://localhost:3000/sessions/<id>` should open, showing the session created from that page.

---

## Limitations & Notes

- The extension does **not** capture real video or detailed DOM events; it sends a simple `steps[]` payload for demonstration, while the real Clueso product records and processes full screen recordings with richer context.[web:22][web:23]
- The extension currently creates a new session on every **Start Recording** click; support for appending additional events to the same session via `/extension-events` can be added later.
- Host permissions and URLs are configured for local development (`http://localhost:3000` and `http://localhost:4000`) and should be updated for any deployed environment.
