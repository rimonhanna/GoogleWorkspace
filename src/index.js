/* Modules to control application life and create native browser window */
const { app, BrowserWindow, ipcMain, systemPreferences, session, nativeTheme } = require("electron");
const { hasScreenCapturePermission, hasPromptedForPermission } = require("mac-screen-capture-permissions");
const { WIN_USERAGENT, MAC_USERAGENT, LINUX_USERAGENT } = require("./constants");
const { setThemeOnAllWindows } = require("./helpers/theme");
const store = require("./helpers/store");
const config = require("./helpers/config");
const isDev = require("electron-is-dev");
const path = require("path");
require('@electron/remote/main').initialize()
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
  
  try {
    const ext = await session.defaultSession.loadExtension(path.join(__dirname, 'screensharing'), { allowFileAccess: true })
    console.error(ext)
  } catch(err) {
    console.error(err)
  }

  createMainWindow();

  let userAgent = global.mainWindow.webContents.userAgent;

  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders["User-Agent"] = userAgent;
    callback({ cancel: false, requestHeaders: details.requestHeaders });
  });
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
  if (store.get(USER_PREF_KEYS.THEME) !== THEME_OPTIONS.AUTO) {
    return;
  }
  setThemeOnAllWindows();
});

// Listen for changes in store
// store.onDidChange(USER_PREF_KEYS.THEME, () => {
//   setThemeOnAllWindows();
// });