const { app, BrowserWindow, dialog, shell, session } = require("electron");
const path = require("path");
const { fork } = require("child_process");
const log = require("electron-log/main");
const { autoUpdater } = require("electron-updater");

const DEV_URL = "http://127.0.0.1:3000";
const PROD_PORT = process.env.IDEA_WALL_DESKTOP_PORT || "3210";
const SERVER_READY_TIMEOUT_MS = 25000;

let mainWindow = null;
let webServerProcess = null;
let baseAppUrl = null;
let didAttemptUpdateCheck = false;

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}

function isSafeExternalUrl(url) {
  return /^(https?:\/\/|mailto:)/i.test(url);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServerReady(url, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url, { method: "HEAD" });
      if (response.ok || response.status >= 300) {
        return;
      }
    } catch (_error) {
      // Ignore connection errors while server boots.
    }
    await wait(350);
  }
  throw new Error(`Timed out waiting for Next server at ${url}`);
}

function getPackagedWebRoot() {
  return path.join(process.resourcesPath, "app", "web");
}

function startPackagedWebServer() {
  const webRoot = getPackagedWebRoot();
  const entryPoint = path.join(webRoot, "server.js");
  webServerProcess = fork(entryPoint, [], {
    cwd: webRoot,
    env: {
      ...process.env,
      NODE_ENV: "production",
      PORT: PROD_PORT,
      HOSTNAME: "127.0.0.1"
    },
    stdio: "ignore"
  });
}

function stopPackagedWebServer() {
  if (webServerProcess && !webServerProcess.killed) {
    webServerProcess.kill("SIGTERM");
  }
  webServerProcess = null;
}

function configureAutoUpdate() {
  if (!app.isPackaged || didAttemptUpdateCheck) {
    return;
  }
  if (!process.env.IDEA_WALL_AUTO_UPDATE_URL) {
    log.info("Auto-update disabled: IDEA_WALL_AUTO_UPDATE_URL is not configured.");
    return;
  }
  autoUpdater.setFeedURL({
    provider: "generic",
    url: process.env.IDEA_WALL_AUTO_UPDATE_URL
  });

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.logger = log;

  autoUpdater.on("error", (error) => {
    log.error("Auto-update error:", error);
  });

  autoUpdater.on("update-available", (info) => {
    log.info(`Update available: ${info.version}`);
  });

  autoUpdater.on("update-not-available", () => {
    log.info("No updates available.");
  });

  autoUpdater.on("update-downloaded", (info) => {
    dialog
      .showMessageBox({
        type: "info",
        buttons: ["Restart Now", "Later"],
        defaultId: 0,
        cancelId: 1,
        title: "Update ready",
        message: `Idea Wall Studio ${info.version} has been downloaded.`,
        detail: "Restart now to apply the update."
      })
      .then(({ response }) => {
        if (response === 0) {
          autoUpdater.quitAndInstall();
        }
      })
      .catch(() => {
        // Non-fatal if dialog cannot be shown.
      });
  });

  didAttemptUpdateCheck = true;
  autoUpdater.checkForUpdates().catch((error) => {
    log.error("Update check failed:", error);
  });
}

function applyWindowSecurity(mainUrl, webContents) {
  webContents.setWindowOpenHandler(({ url }) => {
    if (isSafeExternalUrl(url)) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  webContents.on("will-navigate", (event, url) => {
    if (url.startsWith(mainUrl)) {
      return;
    }
    event.preventDefault();
    if (isSafeExternalUrl(url)) {
      shell.openExternal(url);
    }
  });
}

function createMainWindow(mainUrl) {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1100,
    minHeight: 700,
    show: false,
    backgroundColor: "#F9FAFB",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      devTools: !app.isPackaged
    }
  });

  applyWindowSecurity(mainUrl, mainWindow.webContents);

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.loadURL(mainUrl);
}

async function bootstrap() {
  baseAppUrl = app.isPackaged ? `http://127.0.0.1:${PROD_PORT}` : DEV_URL;

  if (app.isPackaged) {
    startPackagedWebServer();
    await waitForServerReady(baseAppUrl, SERVER_READY_TIMEOUT_MS);
  }

  createMainWindow(baseAppUrl);
}

app.on("second-instance", () => {
  if (!mainWindow) {
    return;
  }
  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }
  mainWindow.focus();
});

app.whenReady().then(async () => {
  log.initialize();
  log.info("Starting Idea Wall Studio");

  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false);
  });

  try {
    await bootstrap();
    configureAutoUpdate();
  } catch (error) {
    console.error("Failed to start Idea Wall Studio:", error);
    app.quit();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (!mainWindow && baseAppUrl) {
    createMainWindow(baseAppUrl);
  }
});

app.on("before-quit", () => {
  stopPackagedWebServer();
});
