
window.addEventListener('message', (event) => {
  // Only accept messages from the same window
  if (event.source !== window) return;

  console.log('Content script received message:', event.data);
  const { jwt } = event.data || {};
  if (!jwt) {
    console.log('No jwt field in message, ignoring');
    return;
};

  chrome.storage.local.set({ jwt }, () => {
    console.log('JWT saved to chrome.storage.local');
  });
});
