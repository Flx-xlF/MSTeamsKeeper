document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('toggleKeeper');
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const intervalSelect = document.getElementById('intervalSelect');

  function updateUI(isEnabled) {
    toggle.checked = isEnabled;
    if (isEnabled) {
      statusDot.classList.remove('paused');
      statusText.textContent = 'Active';
      statusText.style.color = 'var(--text-main)';
    } else {
      statusDot.classList.add('paused');
      statusText.textContent = 'Paused';
      statusText.style.color = 'var(--warning)';
    }
  }

  // Load saved state
  if (chrome?.storage?.local) {
    chrome.storage.local.get(['enabled', 'intervalMs'], (data) => {
      const isEnabled = data.enabled !== false; // default true
      updateUI(isEnabled);

      if (data.intervalMs) {
        intervalSelect.value = String(data.intervalMs);
      }
    });
  }

  // Handle toggle change
  toggle.addEventListener('change', () => {
    const isEnabled = toggle.checked;
    updateUI(isEnabled);
    if (chrome?.storage?.local) {
      chrome.storage.local.set({ enabled: isEnabled });
    }
  });

  // Handle interval change
  intervalSelect.addEventListener('change', () => {
    const intervalMs = parseInt(intervalSelect.value, 10);
    if (chrome?.storage?.local) {
      chrome.storage.local.set({ intervalMs });
    }
  });

  // Handle external link clicks safely
  document.querySelectorAll('a[href]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const url = link.getAttribute('href');
      if (typeof chrome !== 'undefined' && chrome.tabs?.create) {
        chrome.tabs.create({ url });
      } else {
        window.open(url, '_blank');
      }
    });
  });
});
