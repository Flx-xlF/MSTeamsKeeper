# MSTeamsKeeper ⚡

> **Built with care (and a bit of madness) by [schema/f](https://github.com/Flx-xlF)**

### *Are you using the web version of Microsoft Teams? This lightweight extension locks your web status to 'Available' while you work in other tabs.*

[![Manifest V3](https://img.shields.io/badge/Chrome%20Extension-Manifest%20V3-blue?logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Microsoft Teams](https://img.shields.io/badge/Microsoft%20Teams-Web%20App-5B5FC7?logo=microsoftteams&logoColor=white)](https://teams.microsoft.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![Author](https://img.shields.io/badge/Dev-schema%2Ff-indigo)](https://github.com/Flx-xlF)

**Are you using the web version of Microsoft Teams? This lightweight extension locks your web status to 'Available' while you work in other tabs.**

---

## 🎯 The Problem

> **The Problem:** The user appears offline as soon as they navigate away from the tab running MS Teams.

When using Microsoft Teams in the browser, the web client continuously monitors tab focus and visibility. The instant you navigate away from the tab running MS Teams—whether to consult documentation, review code on GitHub, write in Google Docs, or research:

* 📴 **Immediate Offline / Away Switch**: The browser triggers `visibilitychange` and `blur` events. Teams detects that the user navigated away from the tab and promptly marks their status as **Offline / Away**.
* 😰 **False Appearance of Inactivity**: Although you are actively working, your status signals to colleagues and managers that you stepped away from your desk.
* ❌ **Clumsy Workarounds**: Physical mouse jigglers or blunt OS-level scripts hijack your real mouse cursor, break your typing flow, and risk triggering corporate IT alerts.

**MSTeamsKeeper locks your web status to 'Available' while you work in other tabs**: It operates at the browser DOM level, keeping the Teams web client permanently active and focused without moving your real cursor or stealing window focus.

---

## ✨ Features

- 🟢 **Always Available When You Need It**: Keeps your Teams presence active even when minimized or running on a background monitor.
- 🎛️ **Instant On/Off Toggle**: Built-in popup interface to pause or resume keeping with a single click.
- ⏱️ **Configurable Pulse Frequency**: Choose how often activity is simulated (30s, 1m, 2m, or 5m).
- 🖱️ **Zero Cursor Hijacking**: Does not steal system focus or interrupt typing in other windows.
- 🌐 **Comprehensive Cloud Domain Support**:
  - `teams.microsoft.com`
  - `teams.cloud.microsoft` *(Microsoft 365 Unified Domain)*
  - `teams.live.com` *(Personal accounts)*
  - `teams.microsoft.us` *(US Government Community Cloud)*
  - `gov.teams.microsoft.us` *(US Department of Defense)*
- 🔒 **Zero Telemetry & 100% Private**: Runs entirely locally in your browser. No analytics, no tracking, no external API calls.
- 🐍 **Standalone Python Script Included**: Prefer not to use a browser extension? A macOS AppleScript/Python daemon (`teams_keeper.py`) is also included.

---

## 🛠️ How It Works (Technical Architecture)

MSTeamsKeeper operates natively within the browser using Manifest V3:

```
┌────────────────────────────────────────────────────────┐
│                 MSTeamsKeeper Popup                    │
│      (Toggle status & pulse interval preferences)      │
└──────────────────────────┬─────────────────────────────┘
                           │ chrome.storage.local
                           ▼
┌────────────────────────────────────────────────────────┐
│             bridge.js (ISOLATED World)                 │
│         (Listens to storage & relays events)           │
└──────────────────────────┬─────────────────────────────┘
                           │ window.postMessage
                           ▼
┌────────────────────────────────────────────────────────┐
│             content.js (MAIN World)                    │
│                                                        │
│  1. Prototype Overrides (Document.prototype)           │
│     - visibilityState -> "visible"                     │
│     - hidden          -> false                         │
│     - hasFocus()      -> true                          │
│                                                        │
│  2. Event Interception                                 │
│     - Drops global visibilitychange & blur listeners   │
│                                                        │
│  3. Synthetic Activity Engine                          │
│     - Emits mousemove, keydown (Shift), and focus     │
│       without cursor repositioning                     │
└────────────────────────────────────────────────────────┘
```

1. **MAIN World Prototype Hooking**: Runs at `document_start` before Microsoft Teams scripts evaluate. Overrides `document.visibilityState` to always return `"visible"`, `document.hidden` to return `false`, and `document.hasFocus()` to return `true`.
2. **Selective Listener Interception**: Teams attaches listeners to `window` and `document` for `visibilitychange` and `blur`. MSTeamsKeeper wraps `EventTarget.prototype.addEventListener` to dynamically suppress these events only on global targets while keeping SPA navigation and UI tooltips fully functional.
3. **Synthetic Activity Dispatcher**: At the configured interval, a synthetic sequence of non-destructive DOM events (`mousemove`, `keydown`/`keyup` on `Shift`, and `focus`) is dispatched directly to `document.body`.
4. **Graceful Pass-Through**: When toggled **Paused**, all prototype getters and listeners revert to their original browser behaviors, allowing you to go "Away" naturally whenever you desire.

---

## 🚀 Installation Guide

### Option A: Browser Extension (Chrome, Edge, Brave, Opera)

#### Step 1: Get the Code
* **Via Git**:
  ```bash
  git clone https://github.com/Flx-xlF/MSTeamsKeeper.git
  ```
* **Or as a ZIP**: Click the green **Code** button at the top of this repository > **Download ZIP**, then extract it.

#### Step 2: Load into Browser
1. Open your browser's extension management page:
   - **Google Chrome**: `chrome://extensions/`
   - **Microsoft Edge**: `edge://extensions/`
   - **Brave**: `brave://extensions/`
2. Enable **Developer mode** (toggle switch located in the top-right corner on Chrome/Brave, or bottom-left on Edge).
3. Click the **Load unpacked** button.
4. Select the **`teams-extension`** directory inside this repository.

#### Step 3: Pin & Verify
1. Click the **Extensions puzzle piece icon (🧩)** in your browser toolbar and **pin** 📌 MSTeamsKeeper.
2. Navigate to (or refresh) [teams.microsoft.com](https://teams.microsoft.com) or [teams.cloud.microsoft](https://teams.cloud.microsoft).
3. Click the MSTeamsKeeper icon—the status indicator should show a green **Active** dot!

---

### Option B: Standalone Python Script (macOS Only)

If you prefer running a background terminal daemon for Microsoft Edge without installing an unpacked browser extension:

1. Enable AppleScript JavaScript in Microsoft Edge:
   - In Edge's top menu bar: **View** > **Developer** > check **Allow JavaScript from Apple Events**.
2. Open Teams in Microsoft Edge.
3. Run the script:
   ```bash
   python3 teams_keeper.py
   ```

---

## 🔒 Security & Privacy Audit

| Question | Status |
| :--- | :--- |
| **Contains API Keys or Secrets?** | ❌ None. The codebase is 100% static and secret-free. |
| **Transmits Data to External Servers?** | ❌ None. Operates completely offline within the browser sandbox. |
| **Required Permissions** | Only `"storage"` (used purely to persist your toggle and interval preferences). |
| **Can it break Teams UI?** | ❌ No. `pagehide` and `mouseleave` are intentionally preserved so menus, tooltips, and calls work smoothly. |

---

## ⚖️ Disclaimer

This project is created for educational and personal productivity purposes to maintain continuous focus during remote work. Please ensure use complies with your organization's IT and remote-work policies.

---

## 👨‍💻 Author

**schema/f**  
GitHub: [@Flx-xlF](https://github.com/Flx-xlF)  
*Built with care (and a bit of madness).*
