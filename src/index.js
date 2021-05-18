/* Modules to control application life and create native browser window */
const { app, BrowserWindow, ipcMain, systemPreferences, session, nativeTheme } = require("electron");
const { hasScreenCapturePermission, hasPromptedForPermission } = require("mac-screen-capture-permissions");
const { WIN_USERAGENT, MAC_USERAGENT, LINUX_USERAGENT } = require("./constants");
const { setThemeOnAllWindows } = require("./helpers/theme");
const store = require("./helpers/store");
const config = require("./helpers/config");
const isDev = require("electron-is-dev");
const {
  CONSTANTS: { OS_PLATFORMS, THEME_OPTIONS, USER_PREF_KEYS },
} = require("./helpers/util");

require("./main/shortcut");
const { createMainWindow } = require("./main/window");

if (process.platform !== "win32" && process.platform !== "darwin") {
  app.commandLine.appendSwitch("enable-transparent-visuals");
  app.commandLine.appendSwitch("disable-gpu");
  app.disableHardwareAcceleration();
}

app.allowRendererProcessReuse = true;
app.whenReady().then(async () => {
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    if (process.platform === "win32") {
      app.userAgentFallback = WIN_USERAGENT;
      details.requestHeaders["User-Agent"] = WIN_USERAGENT;
    } else if (process.platform === "darwin") {
      app.userAgentFallback = MAC_USERAGENT;
      details.requestHeaders["User-Agent"] = MAC_USERAGENT;
    } else {
      app.userAgentFallback = LINUX_USERAGENT;
      details.requestHeaders["User-Agent"] = LINUX_USERAGENT;
    }
    callback({ requestHeaders: details.requestHeaders });
  });
  if (!isDev && process.platform === "darwin") {
    if (systemPreferences.getMediaAccessStatus("camera") !== "granted") {
      await systemPreferences.askForMediaAccess("camera");
    }
    if (systemPreferences.getMediaAccessStatus("microphone") !== "granted") {
      await systemPreferences.askForMediaAccess("microphone");
    }
    if (systemPreferences.getMediaAccessStatus("screen") !== "granted") {
      hasPromptedForPermission();
      hasScreenCapturePermission();
    }
  }
  createMainWindow();
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", function () {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  } else {
    global.mainWindow && global.mainWindow.focus();
  }
});

// Listen for theme requests from windows to set theme
ipcMain.on("theme-request", function (_, webContentsId) {
  setThemeOnAllWindows();
});

// Listen for changes in native os theme to set theme
nativeTheme.on("updated", () => {
  // Don't change theme if not set to auto.
  // if (store.get(USER_PREF_KEYS.THEME) !== THEME_OPTIONS.AUTO) {
  //   return;
  // }
  setThemeOnAllWindows();
});

// Listen for changes in store
// store.onDidChange(USER_PREF_KEYS.THEME, () => {
//   setThemeOnAllWindows();
// });