const { ipcRenderer, remote } = require("electron");
const path = require("path");
const { setOSTheme } = require("./preload-theme");

const currentWindow = remote.getCurrentWindow();

if (!window.chrome) {
  window.chrome = {};
}

/* Title reply and request */
window.addEventListener("DOMContentLoaded", () => {
  const titleBar = document.getElementById("titlebar");

  // Receive title from child preload view
  ipcRenderer.on("title-reply", function (_, title) {
    titleBar.innerHTML = title;
    document.title = title;
  });

  ipcRenderer.send("title-request");
});

/* Theme reply and request */
window.addEventListener("DOMContentLoaded", () => {
  ipcRenderer.on("theme-reply", function (_, toThemeStyle) {
    setOSTheme(toThemeStyle);
  });

  ipcRenderer.send("theme-request", currentWindow.webContents.id);
});

require(path.join(__dirname, "..", "renderer", "preload.js"))