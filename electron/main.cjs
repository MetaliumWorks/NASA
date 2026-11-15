// Crew Health as a Windows program: the built web app (dist/) in its own window.
// The app needs no network; links to NASA and CSA pages open in the system browser.
const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('node:path');

const INDEX = path.join(__dirname, '..', 'dist', 'index.html');
const isWeb = (url) => /^https?:\/\//i.test(url);

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  let win = null;

  app.on('second-instance', () => {
    if (!win) return;
    if (win.isMinimized()) win.restore();
    win.focus();
  });

  app.whenReady().then(() => {
    app.setAppUserModelId('org.spaceapps.crewhealth');
    // No menu bar: the app has its own navigation. Keys a presenter needs are handled below.
    Menu.setApplicationMenu(null);

    win = new BrowserWindow({
      width: 1440,
      height: 900,
      minWidth: 1024,
      minHeight: 680,
      title: 'Crew Health',
      backgroundColor: '#0b141b',
      show: false,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        spellcheck: false,
      },
    });

    win.once('ready-to-show', () => {
      win.maximize();
      win.show();
    });

    // Source links open in the system browser, never inside the app window.
    win.webContents.setWindowOpenHandler(({ url }) => {
      if (isWeb(url)) shell.openExternal(url);
      return { action: 'deny' };
    });
    win.webContents.on('will-navigate', (event, url) => {
      if (url.startsWith('file:')) return;
      event.preventDefault();
      if (isWeb(url)) shell.openExternal(url);
    });

    // Keys for presenting: F11 full screen, Ctrl + / Ctrl - / Ctrl 0 zoom, Ctrl R reload.
    win.webContents.on('before-input-event', (event, input) => {
      if (input.type !== 'keyDown') return;
      const ctrl = input.control || input.meta;
      const contents = win.webContents;
      let handled = true;
      if (input.key === 'F11') win.setFullScreen(!win.isFullScreen());
      else if (input.key === 'Escape' && win.isFullScreen()) win.setFullScreen(false);
      else if (ctrl && (input.key === '+' || input.key === '=')) contents.setZoomLevel(Math.min(contents.getZoomLevel() + 0.5, 4));
      else if (ctrl && input.key === '-') contents.setZoomLevel(Math.max(contents.getZoomLevel() - 0.5, -3));
      else if (ctrl && input.key === '0') contents.setZoomLevel(0);
      else if (ctrl && input.key.toLowerCase() === 'r') contents.reload();
      else handled = false;
      if (handled) event.preventDefault();
    });

    win.on('closed', () => {
      win = null;
    });

    win.loadFile(INDEX);
  });

  app.on('window-all-closed', () => app.quit());
}
