const { app, BrowserWindow, shell } = require("electron");
const path = require("path");

/**
 * URL carregada pela janela.
 * - Desenvolvimento: http://127.0.0.1:3000 (Next em `npm run dev`)
 * - Empacotado: definir ao construir, ex.: POMODORO_APP_URL=https://seu-app.vercel.app
 */
function getStartUrl() {
  const fromEnv = process.env.POMODORO_APP_URL;
  if (typeof fromEnv === "string" && fromEnv.trim().length > 0) {
    return fromEnv.trim();
  }
  return "http://127.0.0.1:3000";
}

/** @type {BrowserWindow | null} */
let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 520,
    height: 820,
    minWidth: 380,
    minHeight: 640,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  const startUrl = getStartUrl();
  mainWindow.loadURL(startUrl).catch((err) => {
    console.error("[electron] Falha ao carregar URL:", startUrl, err);
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
