const { app, BrowserWindow, dialog, shell, session, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs/promises");
const { constants } = require("fs");
const { fork } = require("child_process");
const log = require("electron-log/main");
const { autoUpdater } = require("electron-updater");

const DEV_URL = "http://127.0.0.1:3000";
const PROD_PORT = process.env.IDEA_WALL_DESKTOP_PORT || "3210";
const SERVER_READY_TIMEOUT_MS = 25000;

let mainWindow = null;
let wallWindow = null;
let decksWindow = null;
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

function isInternalAppUrl(url) {
  return Boolean(baseAppUrl && url.startsWith(baseAppUrl));
}

function classifyWindowRole(url) {
  if (!isInternalAppUrl(url)) {
    return "main";
  }
  const parsed = new URL(url);
  if (parsed.pathname.startsWith("/decks")) {
    return "decks";
  }
  if (parsed.pathname.startsWith("/wall")) {
    return "wall";
  }
  return "main";
}

function getDialogParentWindow() {
  return BrowserWindow.getFocusedWindow() ?? mainWindow ?? wallWindow ?? decksWindow ?? undefined;
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

function openOrFocusInternalWindow(targetUrl) {
  const role = classifyWindowRole(targetUrl);
  if (role === "decks") {
    if (decksWindow && !decksWindow.isDestroyed()) {
      decksWindow.loadURL(targetUrl);
      if (decksWindow.isMinimized()) {
        decksWindow.restore();
      }
      decksWindow.focus();
      return;
    }
    decksWindow = createAppWindow(targetUrl, "decks");
    return;
  }

  if (role === "wall") {
    if (wallWindow && !wallWindow.isDestroyed()) {
      wallWindow.loadURL(targetUrl);
      if (wallWindow.isMinimized()) {
        wallWindow.restore();
      }
      wallWindow.focus();
      return;
    }
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.loadURL(targetUrl);
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.focus();
      return;
    }
    wallWindow = createAppWindow(targetUrl, "wall");
    return;
  }

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.loadURL(targetUrl);
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.focus();
    return;
  }
  mainWindow = createAppWindow(targetUrl, "main");
}

function applyWindowSecurity(mainUrl, webContents) {
  webContents.setWindowOpenHandler(({ url }) => {
    if (isInternalAppUrl(url)) {
      openOrFocusInternalWindow(url);
      return { action: "deny" };
    }
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

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function splitNameAndExt(fileName) {
  const ext = path.extname(fileName);
  const base = fileName.slice(0, Math.max(0, fileName.length - ext.length)) || "converted-file";
  return { base, ext };
}

function buildKeepBothPath(folderPath, fileName, index) {
  const { base, ext } = splitNameAndExt(fileName);
  const suffix = index <= 1 ? " (1)" : ` (${index})`;
  return path.join(folderPath, `${base}${suffix}${ext}`);
}

function registerDesktopIpc() {
  ipcMain.handle("desktop:pick-save-path", async (_event, payload) => {
    const defaultPath = typeof payload?.defaultPath === "string" ? payload.defaultPath : undefined;
    const filters = Array.isArray(payload?.filters) ? payload.filters : undefined;
    const result = await dialog.showSaveDialog(getDialogParentWindow(), {
      defaultPath,
      filters,
      title: "Save converted file",
    });
    return { canceled: result.canceled, filePath: result.filePath ?? null };
  });

  ipcMain.handle("desktop:pick-folder", async () => {
    const result = await dialog.showOpenDialog(getDialogParentWindow(), {
      title: "Choose output folder",
      properties: ["openDirectory", "createDirectory"],
    });
    return {
      canceled: result.canceled,
      folderPath: result.canceled ? null : result.filePaths[0] ?? null,
    };
  });

  ipcMain.handle("desktop:save-file", async (_event, payload) => {
    const filePath = typeof payload?.filePath === "string" ? payload.filePath : "";
    const base64 = typeof payload?.base64 === "string" ? payload.base64 : "";
    if (!filePath || !base64) {
      return { ok: false, error: "Invalid save payload." };
    }
    const data = Buffer.from(base64, "base64");
    await fs.writeFile(filePath, data);
    return { ok: true, filePath };
  });

  ipcMain.handle("desktop:write-in-folder", async (_event, payload) => {
    const folderPath = typeof payload?.folderPath === "string" ? payload.folderPath : "";
    const fileName = typeof payload?.fileName === "string" ? payload.fileName : "";
    const base64 = typeof payload?.base64 === "string" ? payload.base64 : "";
    if (!folderPath || !fileName || !base64) {
      return { status: "error", error: "Invalid write payload." };
    }

    const data = Buffer.from(base64, "base64");
    let targetPath = path.join(folderPath, fileName);
    if (await pathExists(targetPath)) {
      const conflictChoice = await dialog.showMessageBox(getDialogParentWindow(), {
        type: "question",
        buttons: ["Replace", "Keep both", "Skip", "Cancel batch"],
        defaultId: 1,
        cancelId: 3,
        title: "File already exists",
        message: `${fileName} already exists in the selected folder.`,
        detail: "Choose how to proceed.",
      });
      if (conflictChoice.response === 2) {
        return { status: "skipped" };
      }
      if (conflictChoice.response === 3) {
        return { status: "canceled" };
      }
      if (conflictChoice.response === 1) {
        let index = 1;
        let candidate = buildKeepBothPath(folderPath, fileName, index);
        while (await pathExists(candidate)) {
          index += 1;
          candidate = buildKeepBothPath(folderPath, fileName, index);
        }
        targetPath = candidate;
      }
    }

    await fs.writeFile(targetPath, data);
    return { status: "written", filePath: targetPath };
  });

  ipcMain.handle("desktop:open-path", async (_event, payload) => {
    const targetPath = typeof payload?.path === "string" ? payload.path : "";
    if (!targetPath) {
      return { ok: false, error: "Invalid path." };
    }
    const result = await shell.openPath(targetPath);
    if (result) {
      return { ok: false, error: result };
    }
    return { ok: true };
  });
}

function createAppWindow(mainUrl, role = "main") {
  const nextWindow = new BrowserWindow({
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

  applyWindowSecurity(mainUrl, nextWindow.webContents);

  nextWindow.once("ready-to-show", () => {
    nextWindow.show();
  });

  nextWindow.on("closed", () => {
    if (role === "main") {
      mainWindow = null;
      return;
    }
    if (role === "wall") {
      wallWindow = null;
      return;
    }
    if (role === "decks") {
      decksWindow = null;
    }
  });

  nextWindow.loadURL(mainUrl);
  return nextWindow;
}

async function bootstrap() {
  baseAppUrl = app.isPackaged ? `http://127.0.0.1:${PROD_PORT}` : DEV_URL;

  if (app.isPackaged) {
    startPackagedWebServer();
    await waitForServerReady(baseAppUrl, SERVER_READY_TIMEOUT_MS);
  }

  mainWindow = createAppWindow(baseAppUrl, "main");
}

app.on("second-instance", () => {
  const target = BrowserWindow.getAllWindows()[0] ?? mainWindow ?? wallWindow ?? decksWindow;
  if (!target) {
    return;
  }
  if (target.isMinimized()) {
    target.restore();
  }
  target.focus();
});

app.whenReady().then(async () => {
  log.initialize();
  log.info("Starting Idea Wall Studio");
  registerDesktopIpc();

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
  if (BrowserWindow.getAllWindows().length === 0 && baseAppUrl) {
    mainWindow = createAppWindow(baseAppUrl, "main");
  }
});

app.on("before-quit", () => {
  stopPackagedWebServer();
});
