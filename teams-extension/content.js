/**
 * MSTeamsKeeper — Content Script (MAIN world, document_start)
 * Locks web status to 'Available' while you work in other tabs.
 * Prevents appearing offline as soon as you navigate away from the tab running MS Teams.
 *
 * Built with care (and a bit of madness) by schema/f
 * https://github.com/Flx-xlF
 */

// ---------------------------------------------------------------------------
// Configuration & State
// ---------------------------------------------------------------------------
const DEBUG = false;
let isEnabled = true;
let activityIntervalMs = 60_000;
const INITIAL_DELAY_MS = 3_000;
let intervalId = null;

// Read cached state from localStorage if available
try {
    const cachedEnabled = localStorage.getItem('__teams_keeper_enabled__');
    if (cachedEnabled !== null) {
        isEnabled = cachedEnabled === 'true';
    }
    const cachedInterval = parseInt(localStorage.getItem('__teams_keeper_interval__'), 10);
    if (!isNaN(cachedInterval) && cachedInterval >= 10_000) {
        activityIntervalMs = cachedInterval;
    }
} catch (_) {
    // In case localStorage is blocked in sandboxed frames
}

const BLOCKED_EVENTS = new Set([
    'visibilitychange',
    'webkitvisibilitychange',
    'blur',
]);

const log = DEBUG
    ? (...args) => console.log('[MSTeamsKeeper]', ...args)
    : () => {};

// ---------------------------------------------------------------------------
// 1. Prototype Overrides (Conditioned on isEnabled)
// ---------------------------------------------------------------------------
const _origVisibilityDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'visibilityState');
const _origHiddenDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'hidden');
const _origHasFocus = Document.prototype.hasFocus;

Object.defineProperty(Document.prototype, 'visibilityState', {
    get: function () {
        if (isEnabled) return 'visible';
        return _origVisibilityDescriptor?.get ? _origVisibilityDescriptor.get.call(this) : 'visible';
    },
    configurable: true,
});

Object.defineProperty(Document.prototype, 'hidden', {
    get: function () {
        if (isEnabled) return false;
        return _origHiddenDescriptor?.get ? _origHiddenDescriptor.get.call(this) : false;
    },
    configurable: true,
});

Document.prototype.hasFocus = function () {
    if (isEnabled) return true;
    return typeof _origHasFocus === 'function' ? _origHasFocus.call(this) : true;
};

// ---------------------------------------------------------------------------
// 2. Event Listener Interception
//    Wrap global visibility/blur listeners so they can be dropped dynamically.
// ---------------------------------------------------------------------------
const _nativeAddEventListener = EventTarget.prototype.addEventListener;
const _nativeRemoveEventListener = EventTarget.prototype.removeEventListener;
const listenerMap = new WeakMap();

EventTarget.prototype.addEventListener = function (type, listener, options) {
    if (BLOCKED_EVENTS.has(type) && listener) {
        const isGlobalTarget =
            this === window ||
            this === document ||
            this === document.documentElement ||
            this === document.body;

        if (isGlobalTarget) {
            const wrappedListener = function (event) {
                if (isEnabled) {
                    log(`Suppressed "${type}" event on ${this?.constructor?.name || 'target'}`);
                    return;
                }
                if (typeof listener === 'function') {
                    return listener.apply(this, arguments);
                } else if (listener && typeof listener.handleEvent === 'function') {
                    return listener.handleEvent(event);
                }
            };

            listenerMap.set(listener, wrappedListener);
            return _nativeAddEventListener.call(this, type, wrappedListener, options);
        }
    }

    return _nativeAddEventListener.call(this, type, listener, options);
};

EventTarget.prototype.removeEventListener = function (type, listener, options) {
    if (BLOCKED_EVENTS.has(type) && listener) {
        const wrappedListener = listenerMap.get(listener);
        if (wrappedListener) {
            return _nativeRemoveEventListener.call(this, type, wrappedListener, options);
        }
    }
    return _nativeRemoveEventListener.call(this, type, listener, options);
};

// ---------------------------------------------------------------------------
// 3. Periodic Synthetic Activity Simulation
// ---------------------------------------------------------------------------
const MOUSE_EVENT_INIT = { view: window, bubbles: true, cancelable: true };
const KEY_EVENT_INIT   = { key: 'Shift', code: 'ShiftLeft', keyCode: 16, bubbles: true };

/** Dispatches a synthetic event to the single most specific valid target without duplicate bubbling */
function dispatch(event) {
    const target = document.body || document;
    target.dispatchEvent(event);
}

function simulateActivity() {
    if (!isEnabled) {
        log('Activity simulation skipped (paused).');
        return;
    }

    try {
        dispatch(new MouseEvent('mousemove', MOUSE_EVENT_INIT));
        dispatch(new KeyboardEvent('keydown', KEY_EVENT_INIT));
        dispatch(new KeyboardEvent('keyup',   KEY_EVENT_INIT));
        dispatch(new FocusEvent('focus',      { bubbles: true }));
        log(`Activity simulated at ${new Date().toLocaleTimeString()}`);
    } catch (err) {
        log('Activity simulation failed:', err);
    }
}

function scheduleInterval() {
    if (intervalId) {
        clearInterval(intervalId);
    }
    intervalId = setInterval(simulateActivity, activityIntervalMs);
}

setTimeout(simulateActivity, INITIAL_DELAY_MS);
scheduleInterval();

// ---------------------------------------------------------------------------
// 4. Communication Bridge with Extension Popup (via window.postMessage)
// ---------------------------------------------------------------------------
window.addEventListener('message', (event) => {
    if (event.data?.source === 'TEAMS_KEEPER_EXT' && event.data.type === 'STATE_UPDATE') {
        const newEnabled = event.data.enabled !== false;
        const newInterval = event.data.intervalMs || 60_000;

        const changed = (isEnabled !== newEnabled) || (activityIntervalMs !== newInterval);
        isEnabled = newEnabled;
        activityIntervalMs = newInterval;

        try {
            localStorage.setItem('__teams_keeper_enabled__', String(isEnabled));
            localStorage.setItem('__teams_keeper_interval__', String(activityIntervalMs));
        } catch (_) {}

        if (changed) {
            log(`Config updated: enabled=${isEnabled}, interval=${activityIntervalMs}ms`);
            scheduleInterval();
            if (isEnabled) {
                simulateActivity();
            }
        }
    }
});

// Request current state from bridge in case storage was ready earlier
window.postMessage({ source: 'TEAMS_KEEPER_PAGE', type: 'GET_STATE' }, '*');

log('Initialized — dynamic visibility overrides and listener interception active.');
