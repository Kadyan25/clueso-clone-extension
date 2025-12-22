// popup.js

const startBtn = document.getElementById('startBtn');
const statusEl = document.getElementById('status');

function setStatus(text) {
  if (statusEl) statusEl.textContent = text;
}

startBtn.addEventListener('click', async () => {
  if (startBtn.disabled) return;

  startBtn.disabled = true;
  setStatus('Creating session…');

  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    const url = tab?.url || '';

    const steps = [
      {
        type: 'capture',
        message: 'Captured from extension start',
        url,
        timestamp: new Date().toISOString(),
      },
    ];

    chrome.runtime.sendMessage(
      { type: 'CREATE_SESSION_FROM_EXTENSION', payload: { url, steps } },
      (resp) => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
          setStatus('Error creating session');
        } else if (!resp || !resp.ok) {
          setStatus('Error creating session');
        } else {
          setStatus('Session created and opened in the web app.');
        }
        startBtn.disabled = false;
      },
    );
  } catch (err) {
    console.error('start error', err);
    setStatus('Error creating session');
    startBtn.disabled = false;
  }
});
