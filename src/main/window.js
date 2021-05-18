/* All window creation functions */
const path = require("path");
const fs = require("fs");
const store = require("../helpers/store");
const {
  CONSTANTS: { USER_PREF_KEYS },
} = require("../helpers/util");

const defaultMenu = require("electron-default-menu");
const { BrowserWindow, BrowserView, Menu, MenuItem, ipcMain, screen, app, shell } = require("electron");
const windowStateKeeper = require("electron-window-state");
var buildEditorContextMenu = require("electron-editor-context-menu");
const { WIN_USERAGENT, MAC_USERAGENT, LINUX_USERAGENT } = require("../constants");

const windowState = require("electron-window-state");
const electronLocalshortcut = require("electron-localshortcut");
const { checkForUpdates } = require("../helpers/updater");
const { template } = require("./menu");
const { TITLE_BAR_HEIGHT, openUrlInBrowser, shouldOpenLinkInBrowser } = require("../helpers/util");

const GOOGLE_ADMIN_URL = "https://admin.google.com/";
const GOOGLE_GROUPS_URL = "https://groups.google.com/my-groups";
const GOOGLE_CURRENTS_URL = "https://currents.google.com/";
const GOOGLE_MAIL_URL = "https://mail.google.com/";
const GOOGLE_CHAT_URL = "https://mail.google.com/chat/u/0/#chat/welcome";
const GOOGLE_MEET_URL = "https://meet.google.com/";
const GOOGLE_CALENDAR_URL = "https://calendar.google.com/calendar";
const GOOGLE_DRIVE_URL = "https://drive.google.com/";

var userAgent;
if (process.platform === "win32") {
  userAgent = WIN_USERAGENT;
} else if (process.platform === "darwin") {
  userAgent = MAC_USERAGENT;
} else {
  userAgent = LINUX_USERAGENT;
}

function createMainWindow() {
  const mainWindowState = windowStateKeeper({
    defaultWidth: 1280,
    defaultHeight: 800,
    fullScreen: false,
    restore: true
  });

  const mainWindow = (global.mainWindow = new BrowserWindow({
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    webPreferences: {
      spellcheck: true,
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  }));

  setMainMenu();

  mainWindowState.manage(mainWindow);
  mainWindow.loadFile(path.join(__dirname, "..", "renderer", "index.html"));
  // mainWindow.webContents.openDevTools();
  mainWindow.webContents.on("did-finish-load", () => {
    if (mainWindow.isMaximized()) {
      mainWindow.webContents.send("window.maximized");
    }
  });

  let handleTabSelection = function (view) {
    if (!mainWindow.getBrowserViews().includes(view))
      mainWindow.addBrowserView(view);

    mainWindow.getBrowserViews().forEach(browserView => {
      if (view != browserView)
        mainWindow.removeBrowserView(browserView);
    });
    view.setBounds(adjustedBounds(mainWindow));
  }

  let handleNavigation = function (event, url, frameName, disposition, options) {
    event.preventDefault();

    var urlArray = url.split("dest=");
    if (urlArray.length > 1) {
      url = unescape(urlArray[1]);
    }

    if (url.includes("meet.google")) {
      global.googleMeetView.webContents.loadURL(url, { userAgent: userAgent });
      mainWindow.webContents.executeJavaScript("document.getElementById('meet-tab').click();");
    } else if (url.includes("currents.google")) {
      global.googleCurrentsView.webContents.loadURL(url, { userAgent: userAgent });
      mainWindow.webContents.executeJavaScript("document.getElementById('currents-tab').click();");
    } else if (url.includes("chat.google")) {
      global.googleChatView.webContents.loadURL(url, { userAgent: userAgent });
      mainWindow.webContents.executeJavaScript("document.getElementById('chat-tab').click();");
    } else if (url.includes("groups.google")) {
      global.googleGroupsView.webContents.loadURL(url, { userAgent: userAgent });
      mainWindow.webContents.executeJavaScript("document.getElementById('groups-tab').click();");
    } else if (url.includes("calendar.google")) {
      global.googleCalendarView.webContents.loadURL(url, { userAgent: userAgent });
      mainWindow.webContents.executeJavaScript("document.getElementById('calendar-tab').click();");
    } else if (url.includes("admin.google")) {
      global.googleAdminView.webContents.loadURL(url, { userAgent: userAgent });
      mainWindow.webContents.executeJavaScript("document.getElementById('admin-tab').click();");
    } else if (url.includes("drive.google")) {
      global.googleDriveView.webContents.loadURL(url, { userAgent: userAgent });
      mainWindow.webContents.executeJavaScript("document.getElementById('drive-tab').click();");
    } else if (url.includes("mail.google")) {
      global.googleMailView.webContents.loadURL(url, { userAgent: userAgent });
      mainWindow.webContents.executeJavaScript("document.getElementById('mail-tab').click();");
    } else if (url.includes("notion.so")) {
      shell.openExternal(url.replace("https://", "notion://"));
    } else if (url.includes("teams.microsoft")) {
      shell.openExternal(url.replace("https://", "teams://"));
    } else if (url.includes("zoom.us")) {
      shell.openExternal(url.replace("https://", "zoommtg://").replace("/j/", "/start?confno="));
    } else {
      shell.openExternal(url);
    }
  };

  function setAdminVisibility() {
    var toBoolean = store.get(USER_PREF_KEYS.SHOW_ADMIN);
    if (toBoolean == true) {
      mainWindow.webContents.executeJavaScript("$('#admin-li').removeClass('hidden')");
    } else {
      mainWindow.webContents.executeJavaScript("$('#admin-li').addClass('hidden')");
    }
  }

  function setGroupsVisibility() {
    var toBoolean = store.get(USER_PREF_KEYS.SHOW_GROUPS);
    if (toBoolean == true) {
      mainWindow.webContents.executeJavaScript("$('#groups-li').removeClass('hidden')");
    } else {
      mainWindow.webContents.executeJavaScript("$('#groups-li').addClass('hidden')");
    }
  }

  function setDriveVisibility() {
    var toBoolean = store.get(USER_PREF_KEYS.SHOW_DRIVE);
    if (toBoolean == true) {
      mainWindow.webContents.executeJavaScript("$('#drive-li').removeClass('hidden')");
    } else {
      mainWindow.webContents.executeJavaScript("$('#drive-li').addClass('hidden')");
    }
  }

  function setMailVisibility() {
    var toBoolean = store.get(USER_PREF_KEYS.SHOW_MAIL);
    if (toBoolean == true) {
      mainWindow.webContents.executeJavaScript("$('#mail-li').removeClass('hidden')");
    } else {
      mainWindow.webContents.executeJavaScript("$('#mail-li').addClass('hidden')");
    }
  }

  function setCalendarVisibility() {
    var toBoolean = store.get(USER_PREF_KEYS.SHOW_CALENDAR);
    if (toBoolean == true) {
      mainWindow.webContents.executeJavaScript("$('#calendar-li').removeClass('hidden')");
    } else {
      mainWindow.webContents.executeJavaScript("$('#calendar-li').addClass('hidden')");
    }
  }

  setAdminVisibility();
  setGroupsVisibility();
  setDriveVisibility();
  setMailVisibility();
  setCalendarVisibility();

  store.onDidChange(USER_PREF_KEYS.SHOW_ADMIN, () => {
    setAdminVisibility();
  });

  store.onDidChange(USER_PREF_KEYS.SHOW_GROUPS, () => {
    setGroupsVisibility();
  });

  store.onDidChange(USER_PREF_KEYS.SHOW_DRIVE, () => {
    setDriveVisibility();
  });

  store.onDidChange(USER_PREF_KEYS.SHOW_MAIL, () => {
    setMailVisibility();
  });

  store.onDidChange(USER_PREF_KEYS.SHOW_CALENDAR, () => {
    setCalendarVisibility();
  });

  let handleLoadCommit = function (event) {
    event.sender.focus();
  };


  const googleAdminView = (global.googleAdminView = new BrowserView({
    webPreferences: {
      preload: path.join(__dirname, "preload-view.js"),
    },
  }));
  createSubView(mainWindow, googleAdminView, GOOGLE_ADMIN_URL, "setting-id");
  ipcMain.on("window.admin", (event) => {
    handleTabSelection(global.googleAdminView);
  });
  googleAdminView.webContents.on("new-window", handleNavigation);
  googleAdminView.webContents.once("dom-ready", handleLoadCommit);


  const googleGroupsView = (global.googleGroupsView = new BrowserView({
    webPreferences: {
      preload: path.join(__dirname, "preload-view.js"),
    },
  }));
  createSubView(mainWindow, googleGroupsView, GOOGLE_GROUPS_URL, "group-id");
  ipcMain.on("window.groups", (event) => {
    handleTabSelection(global.googleGroupsView);
  });
  googleGroupsView.webContents.on("new-window", handleNavigation);
  googleGroupsView.webContents.once("dom-ready", handleLoadCommit);


  const googleCurrentsView = (global.googleCurrentsView = new BrowserView({
    webPreferences: {
      preload: path.join(__dirname, "preload-view.js"),
    },
  }));
  createSubView(mainWindow, googleCurrentsView, GOOGLE_CURRENTS_URL, "post-id");
  ipcMain.on("window.currents", (event) => {
    handleTabSelection(global.googleCurrentsView);
  });
  googleCurrentsView.webContents.on("new-window", handleNavigation);
  googleCurrentsView.webContents.once("dom-ready", handleLoadCommit);


  const googleMailView = (global.googleMailView = new BrowserView({
    webPreferences: {
      preload: path.join(__dirname, "preload-view.js"),
    },
  }));
  createSubView(mainWindow, googleMailView, GOOGLE_MAIL_URL, "mail-id");
  ipcMain.on("window.mail", (event) => {
    handleTabSelection(global.googleMailView);
  });
  googleMailView.webContents.on("new-window", handleNavigation);
  googleMailView.webContents.once("dom-ready", handleLoadCommit);


  const googleMeetView = (global.googleMeetView = new BrowserView({
    webPreferences: {
      preload: path.join(__dirname, "preload-view.js"),
    },
  }));
  createSubView(mainWindow, googleMeetView, GOOGLE_MEET_URL, "room-id");
  ipcMain.on("window.meet", (event) => {
    handleTabSelection(global.googleMeetView);
  });
  googleMeetView.webContents.on("new-window", handleNavigation);
  googleMeetView.webContents.once("dom-ready", handleLoadCommit);


  const googleCalendarView = (global.googleCalendarView = new BrowserView({
    webPreferences: {
      preload: path.join(__dirname, "preload-view.js"),
    },
  }));
  createSubView(mainWindow, googleCalendarView, GOOGLE_CALENDAR_URL, "event-id");
  ipcMain.on("window.calendar", (event) => {
    handleTabSelection(global.googleCalendarView);
  });
  googleCalendarView.webContents.on("new-window", handleNavigation);
  googleCalendarView.webContents.once("dom-ready", handleLoadCommit);


  const googleDriveView = (global.googleDriveView = new BrowserView({
    webPreferences: {
      preload: path.join(__dirname, "preload-view.js"),
    },
  }));
  createSubView(mainWindow, googleDriveView, GOOGLE_DRIVE_URL, "file-id");
  ipcMain.on("window.drive", (event) => {
    handleTabSelection(global.googleDriveView);
  });
  googleDriveView.webContents.on("new-window", handleNavigation);
  googleDriveView.webContents.once("dom-ready", handleLoadCommit);


  const googleChatView = (global.googleChatView = new BrowserView({
    webPreferences: {
      preload: path.join(__dirname, "preload-view.js"),
      webSecurity: false
    },
  }));
  createSubView(mainWindow, googleChatView, GOOGLE_CHAT_URL, "room-id");
  ipcMain.on("window.chat", (event) => {
    handleTabSelection(global.googleChatView);
  });
  googleChatView.webContents.on("new-window", handleNavigation);
  googleChatView.webContents.once("dom-ready", handleLoadCommit);


  mainWindow.on("maximize", () => {
    mainWindow.webContents.send("window.maximized");
  });

  mainWindow.on("unmaximize", () => {
    mainWindow.webContents.send("window.restored");
  });

  ipcMain.on("window.minimize", (event) => {
    mainWindow.minimize();
  });

  ipcMain.on("window.maximize", (event) => {
    mainWindow.maximize();
    event.sender.send("window.maximized");
  });

  ipcMain.on("window.restore", (event) => {
    mainWindow.restore();
    event.sender.send("window.restored");
  });

  ipcMain.on("window.close", () => {
    mainWindow.close();
  });

  let canvasWindow = createCanvasWindow();

  const screenToolsWindow = createScreenToolsWindow();

  // screenToolsWindow.moveAbove(canvasWindow.getMediaSourceId());

  ipcMain.on("window.screenshare.show", () => {
    mainWindow.minimize();
    screenToolsWindow.show();
  });

  ipcMain.on("window.screenshare.hide", () => {
    screenToolsWindow.hide();
    screenToolsWindow.reload();
    canvasWindow.hide();
  });

  ipcMain.on("window.canvas.show", () => {
    canvasWindow.show();
  });

  ipcMain.on("window.canvas.hide", () => {
    canvasWindow.hide();
    canvasWindow.reload();
  });

  // let mediaRecorder; // MediaRecorder instance to capture footage
  ipcMain.on("window.screenrecord.start", () => {
    screenToolsWindow.show();

    // Create the Media Recorder
    // const options = { mimeType: 'video/webm; codecs=vp9' };
    // mediaRecorder = new MediaRecorder(stream, options);
  });

  ipcMain.on("window.screenrecord.stop", () => {
    screenToolsWindow.hide();
    screenToolsWindow.reload();
    canvasWindow.hide();
  });

  ipcMain.on("window.screenrecord.show", () => {
    canvasWindow.show();
  });

  ipcMain.on("window.screenrecord.hide", () => {
    canvasWindow.hide();
    canvasWindow.reload();
  });

  ipcMain.on("window.main.focus", () => {
    mainWindow.restore();
    mainWindow.focus();
  });

  mainWindow.on("closed", () => {
    app.quit();
  });

  // mainWindow.addBrowserView(global.googleChatView);
  // global.googleChatView.setBounds(adjustedBounds(mainWindow));
  // global.googleChatView.webContents.openDevTools({ detach: true })

  return mainWindow;
}


function addContextMenuItems(mainWindow, params) {
  var contextMenu = buildEditorContextMenu();
  contextMenu.append(new MenuItem({
    label: `Search Google for "${params.selectionText.substr(0,15).trim() + (params.selectionText.length > 15? "...": "")}"`,
    visible: params.selectionText.trim().length > 0,
    click: () => {
      shell.openExternal(`https://google.com/search?q=${encodeURIComponent(params.selectionText)}`);
    },
  }));
  contextMenu.append(new MenuItem({ type: "separator" }));
  contextMenu.append(new MenuItem({
    label: "Inspect Element",
    click: () => {
      mainWindow.getBrowserViews()[0].webContents.inspectElement(0, 0);
    },
  }));
  return contextMenu;
}

function setMainMenu() {
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createSubView(mainWindow, view, url, deeplink) {
  if (app.commandLine.hasSwitch(deeplink)) {
    url = url + app.commandLine.getSwitchValue(deeplink);
  }

  mainWindow.addBrowserView(view);

  view.webContents.loadURL(url, { userAgent: userAgent });
  view.setBounds(adjustedBounds(mainWindow));
  view.webContents.on("did-finish-load", () => {
    view.webContents.insertCSS(fs.readFileSync(path.join(__dirname, "..", "renderer", "css", "screen.css")).toString());
  });
  // view.webContents.openDevTools();

  mainWindow.on("resize", () => {
    view.setBounds(adjustedBounds(mainWindow));
  });

  ipcMain.on("window.home", () => {
    view.webContents.loadURL(url, { userAgent: userAgent });
  });

  ipcMain.on("screenshare.stop", () => {
    view.webContents.send("screenshare.stop");
  });

  view.webContents.on("context-menu", (event, params) => {
    var contextMenu = addContextMenuItems(mainWindow, params);
    contextMenu.popup();
  });
}

function adjustedBounds(mainWindow) {
  return {
    x: 0,
    y: 40,
    width: mainWindow.getBounds().width,
    height: mainWindow.getBounds().height - 40,
  };
}

function createCanvasWindow() {
  const primaryWorkarea = screen.getPrimaryDisplay().bounds;
  const canvasWindow = new BrowserWindow({
    x: primaryWorkarea.x,
    y: primaryWorkarea.y,
    width: primaryWorkarea.width,
    height: primaryWorkarea.height,
    transparent: true,
    frame: false,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
    focusable: false,
    show: false,
    resizable: false,
    skipTaskbar: true,
  });
  canvasWindow.webContents.loadFile(path.join(__dirname, "..", "renderer", "canvas.html"));
  canvasWindow.setAlwaysOnTop(true, "pop-up-menu");
  return canvasWindow;
}

function createScreenToolsWindow() {
  const primaryWorkarea = screen.getPrimaryDisplay().bounds;
  const screenToolsWindow = new BrowserWindow({
    x: 100,
    y: primaryWorkarea.height - 200,
    height: 60,
    width: 300,
    frame: false,
    resizable: false,
    show: false,
    skipTaskbar: true,
    focusable: false,
    transparent: true,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  screenToolsWindow.setContentProtection(process.platform === "darwin");

  screenToolsWindow.webContents.loadFile(path.join(__dirname, "..", "renderer", "toolbar.html"));
  screenToolsWindow.setAlwaysOnTop(true, "screen-saver");
  return screenToolsWindow;
}

module.exports = { createMainWindow };
