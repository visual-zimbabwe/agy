const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("desktopMeta", {
  platform: process.platform,
  isDesktop: true
});
