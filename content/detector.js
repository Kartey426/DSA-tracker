// Runs on supported problem pages and stores current page info
// so popup.js can pre-fill the "Add problem" form.
(function () {
  const info = {
    url: window.location.href,
    title: document.title,
    timestamp: Date.now(),
  };
  chrome.storage.local.set({ dsa_current_page: info });
})();