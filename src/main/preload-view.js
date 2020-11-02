const { ipcRenderer, remote } = require("electron");
const { setOSTheme } = require("./preload-theme.js");

const currentWindow = remote.getCurrentWindow();
const currentView = currentWindow.getBrowserViews()[0];

/* Theme reply and request */
window.addEventListener("DOMContentLoaded", () => {
  ipcRenderer.on("theme-reply", (_, toThemeStyle) => {
    setOSTheme(toThemeStyle);
  });

  ipcRenderer.send("theme-request", currentView.webContents.id);
});

require("../renderer/adapters/polyfill.js")
