/**
 * MSTeamsKeeper — Bridge Content Script (ISOLATED world)
 * Locks web status to 'Available' while you work in other tabs.
 * Prevents appearing offline as soon as you navigate away from the tab running MS Teams.
 *
 * Built with care (and a bit of madness) by schema/f
 * https://github.com/Flx-xlF
 */
(function() {
    function sendConfigToPage(config) {
        window.postMessage({
            source: 'TEAMS_KEEPER_EXT',
            type: 'STATE_UPDATE',
            enabled: config.enabled !== false,
            intervalMs: config.intervalMs || 60000
        }, '*');
    }

    // Load initial configuration from storage
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        chrome.storage.local.get(['enabled', 'intervalMs'], (items) => {
            sendConfigToPage(items || {});
        });

        // Listen for configuration changes from popup
        chrome.storage.onChanged.addListener((changes, areaName) => {
            if (areaName === 'local') {
                chrome.storage.local.get(['enabled', 'intervalMs'], (items) => {
                    sendConfigToPage(items || {});
                });
            }
        });
    }

    // Respond to query from MAIN world if it starts before bridge is ready
    window.addEventListener('message', (event) => {
        if (event.data?.source === 'TEAMS_KEEPER_PAGE' && event.data.type === 'GET_STATE') {
            if (typeof chrome !== 'undefined' && chrome.storage?.local) {
                chrome.storage.local.get(['enabled', 'intervalMs'], (items) => {
                    sendConfigToPage(items || {});
                });
            }
        }
    });
})();
