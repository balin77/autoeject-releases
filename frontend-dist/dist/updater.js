// AutoEject Auto-Updater
// This script checks for updates on app startup and prompts the user to install them

(async function initUpdater() {
  // Only run in Tauri environment
  if (!window.__TAURI__) {
    console.log('[Updater] Not running in Tauri environment, skipping update check');
    return;
  }

  const { check } = await import('@tauri-apps/plugin-updater');
  const { relaunch } = await import('@tauri-apps/plugin-process');

  async function checkForUpdates() {
    try {
      console.log('[Updater] Checking for updates...');
      const update = await check();

      if (update) {
        console.log(`[Updater] Update available: ${update.version}`);

        // Show update dialog
        const shouldUpdate = await showUpdateDialog(update);

        if (shouldUpdate) {
          console.log('[Updater] User accepted update, downloading...');

          // Show progress indicator
          showUpdateProgress();

          // Download and install
          await update.downloadAndInstall((progress) => {
            if (progress.event === 'Started') {
              console.log(`[Updater] Download started, total size: ${progress.data.contentLength} bytes`);
            } else if (progress.event === 'Progress') {
              const percent = Math.round((progress.data.chunkLength / progress.data.contentLength) * 100);
              updateProgress(percent);
            } else if (progress.event === 'Finished') {
              console.log('[Updater] Download finished');
            }
          });

          console.log('[Updater] Update installed, relaunching...');
          await relaunch();
        } else {
          console.log('[Updater] User declined update');
        }
      } else {
        console.log('[Updater] No updates available');
      }
    } catch (error) {
      console.error('[Updater] Error checking for updates:', error);
    }
  }

  function showUpdateDialog(update) {
    return new Promise((resolve) => {
      // Create modal overlay
      const overlay = document.createElement('div');
      overlay.id = 'update-modal-overlay';
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
      `;

      const modal = document.createElement('div');
      modal.id = 'update-modal';
      modal.style.cssText = `
        background: #1e1e1e;
        border: 1px solid #444;
        border-radius: 8px;
        padding: 24px;
        max-width: 450px;
        color: #fff;
        font-family: system-ui, -apple-system, sans-serif;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
      `;

      modal.innerHTML = `
        <h2 style="margin: 0 0 16px 0; font-size: 20px;">🚀 Update verfügbar!</h2>
        <p style="margin: 0 0 12px 0; color: #ccc;">
          Eine neue Version von AutoEject ist verfügbar.
        </p>
        <p style="margin: 0 0 8px 0;">
          <strong>Aktuelle Version:</strong> ${window.__TAURI__?.version || 'unbekannt'}
        </p>
        <p style="margin: 0 0 16px 0;">
          <strong>Neue Version:</strong> ${update.version}
        </p>
        ${update.body ? `
          <div style="margin: 0 0 16px 0; padding: 12px; background: #2a2a2a; border-radius: 4px; max-height: 150px; overflow-y: auto;">
            <strong style="display: block; margin-bottom: 8px;">Änderungen:</strong>
            <div style="color: #ccc; font-size: 14px; white-space: pre-wrap;">${update.body}</div>
          </div>
        ` : ''}
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
          <button id="update-later" style="
            padding: 10px 20px;
            border: 1px solid #555;
            background: transparent;
            color: #ccc;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
          ">Später</button>
          <button id="update-now" style="
            padding: 10px 20px;
            border: none;
            background: #4CAF50;
            color: white;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
          ">Jetzt aktualisieren</button>
        </div>
      `;

      overlay.appendChild(modal);
      document.body.appendChild(overlay);

      document.getElementById('update-now').addEventListener('click', () => {
        overlay.remove();
        resolve(true);
      });

      document.getElementById('update-later').addEventListener('click', () => {
        overlay.remove();
        resolve(false);
      });
    });
  }

  function showUpdateProgress() {
    const overlay = document.createElement('div');
    overlay.id = 'update-progress-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10001;
    `;

    const modal = document.createElement('div');
    modal.style.cssText = `
      background: #1e1e1e;
      border: 1px solid #444;
      border-radius: 8px;
      padding: 32px;
      text-align: center;
      color: #fff;
      font-family: system-ui, -apple-system, sans-serif;
    `;

    modal.innerHTML = `
      <h3 style="margin: 0 0 20px 0;">Update wird heruntergeladen...</h3>
      <div style="
        width: 300px;
        height: 8px;
        background: #333;
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 12px;
      ">
        <div id="update-progress-bar" style="
          width: 0%;
          height: 100%;
          background: linear-gradient(90deg, #4CAF50, #8BC34A);
          transition: width 0.3s ease;
        "></div>
      </div>
      <p id="update-progress-text" style="margin: 0; color: #888;">0%</p>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }

  function updateProgress(percent) {
    const bar = document.getElementById('update-progress-bar');
    const text = document.getElementById('update-progress-text');
    if (bar) bar.style.width = `${percent}%`;
    if (text) text.textContent = `${percent}%`;
  }

  // Check for updates after a short delay (let the app load first)
  setTimeout(checkForUpdates, 2000);
})();
