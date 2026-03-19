const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopMeta", {
  platform: process.platform,
  isDesktop: true
});

contextBridge.exposeInMainWorld("desktopApi", {
  pickSavePath: (payload) => ipcRenderer.invoke("desktop:pick-save-path", payload),
  pickFolder: () => ipcRenderer.invoke("desktop:pick-folder"),
  saveFile: (payload) => ipcRenderer.invoke("desktop:save-file", payload),
  writeInFolder: (payload) => ipcRenderer.invoke("desktop:write-in-folder", payload),
  openPath: (payload) => ipcRenderer.invoke("desktop:open-path", payload)
});
