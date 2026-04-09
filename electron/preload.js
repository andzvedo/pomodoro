const { contextBridge } = require("electron");

/**
 * Ponte reservada para futuras APIs (ex.: notificações nativas, IPC).
 * Mantém contextIsolation sem expor Node ao renderer.
 */
contextBridge.exposeInMainWorld("pomodoroDesktop", {
  platform: process.platform,
});
