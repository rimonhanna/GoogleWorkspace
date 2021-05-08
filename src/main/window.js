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
const GOOGLE_CHAT_URL = "https://chat.google.com/";
const GOOGLE_MEET_URL = "https://meet.google.com/";
const GOOGLE_CALENDAR_URL = "https://calendar.google.com/calendar";
const GOOGLE_DRIVE_URL = "https://drive.google.com/";

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
      enableRemoteModule: true,
      preload: path.join(__dirname, "preload.js"),
    },
  }));

  global.userAgent = mainWindow.webContents.userAgent;
  global.userAgent = userAgent.replace(/GoogleWorkspace\/[0-9\.-]*/,'');
  global.userAgent = userAgent.replace(/Electron\/*/,'');
  mainWindow.webContents.userAgent = global.userAgent;

  setMainMenu();

  mainWindowState.manage(mainWindow);
  mainWindow.loadFile(path.join(__dirname, "..", "renderer", "index.html"));
  // mainWindow.webContents.openDevTools();
  mainWindow.webContents.on("did-finish-load", () => {
    if (mainWindow.isMaximized()) {
      mainWindow.webContents.send("window.maximized");
    }
  });


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


  global.googleAdminView = createSubView("admin", GOOGLE_ADMIN_URL, "setting-id");
  global.googleGroupsView = createSubView("groups", GOOGLE_GROUPS_URL, "group-id");
  global.googleCurrentsView = createSubView("currents", GOOGLE_CURRENTS_URL, "post-id");
  global.googleMailView = createSubView("mail", GOOGLE_MAIL_URL, "mail-id");
  global.googleMeetView = createSubView("meet", GOOGLE_MEET_URL, "room-id");
  global.googleCalendarView = createSubView("calendar", GOOGLE_CALENDAR_URL, "event-id");
  global.googleDriveView = createSubView("drive", GOOGLE_DRIVE_URL, "file-id");
  global.googleChatView = createSubView("chat", GOOGLE_CHAT_URL, "room-id");

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
  let screenToolsWindow = createScreenToolsWindow();

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
  // mainWindow.webContents.openDevTools()

  return mainWindow;
}

let handleTabSelection = function (view) {
  if (!global.mainWindow.getBrowserViews().includes(view)) {
    global.mainWindow.addBrowserView(view);
  }

  global.mainWindow.getBrowserViews().forEach(browserView => {
    if (view != browserView) {
      global.mainWindow.removeBrowserView(browserView);
    }
  });
  view.setBounds(adjustedBounds(global.mainWindow));
}

function handleNavigation({url}) {

  var urlArray = url.split("dest=");
  if (urlArray.length > 1) {
    url = unescape(urlArray[1]);
  }

  if (url.includes("meet.google")) {
    global.googleMeetView.webContents.loadURL(url, { userAgent: global.userAgent });
    global.mainWindow.webContents.executeJavaScript("document.getElementById('meet-tab').click();");
  } else if (url.includes("currents.google")) {
    global.googleCurrentsView.webContents.loadURL(url, { userAgent: global.userAgent });
    global.mainWindow.webContents.executeJavaScript("document.getElementById('currents-tab').click();");
  } else if (url.includes("chat.google")) {
    global.googleChatView.webContents.loadURL(url, { userAgent: global.userAgent });
    global.mainWindow.webContents.executeJavaScript("document.getElementById('chat-tab').click();");
  } else if (url.includes("groups.google")) {
    global.googleGroupsView.webContents.loadURL(url, { userAgent: global.userAgent });
    global.mainWindow.webContents.executeJavaScript("document.getElementById('groups-tab').click();");
  } else if (url.includes("calendar.google")) {
    global.googleCalendarView.webContents.loadURL(url, { userAgent: global.userAgent });
    global.mainWindow.webContents.executeJavaScript("document.getElementById('calendar-tab').click();");
  } else if (url.includes("admin.google")) {
    global.googleAdminView.webContents.loadURL(url, { userAgent: global.userAgent });
    global.mainWindow.webContents.executeJavaScript("document.getElementById('admin-tab').click();");
  } else if (url.includes("drive.google")) {
    global.googleDriveView.webContents.loadURL(url, { userAgent: global.userAgent });
    global.mainWindow.webContents.executeJavaScript("document.getElementById('drive-tab').click();");
  } else if (url.includes("mail.google")) {
    global.googleMailView.webContents.loadURL(url, { userAgent: global.userAgent });
    global.mainWindow.webContents.executeJavaScript("document.getElementById('mail-tab').click();");
  } else if (url.includes("notion.so")) {
    shell.openExternal(url.replace("https://", "notion://"));
  } else if (url.includes("teams.microsoft")) {
    shell.openExternal(url.replace("https://", "teams://"));
  } else if (url.includes("zoom.us")) {
    shell.openExternal(url.replace("https://", "zoommtg://").replace("/j/", "/start?confno="));
  } else {
    shell.openExternal(url);
  }
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

function createSubView(title, url, deeplink) {
  if (app.commandLine.hasSwitch(deeplink)) {
    url = url + app.commandLine.getSwitchValue(deeplink);
  }

  let handleLoadCommit = function (event) {
    event.sender.focus();
  };

  const view = new BrowserView({
    webPreferences: {
      enableRemoteModule: true,
      preload: path.join(__dirname, "preload-view.js"),
    },
  });

  global.mainWindow.addBrowserView(view);
  
  ipcMain.on("window." + title, (event) => {
    handleTabSelection(view);
  });
  
  view.webContents.setWindowOpenHandler(handleNavigation);
  view.webContents.once("dom-ready", handleLoadCommit);

  view.webContents.loadURL(url, { userAgent: global.userAgent });
  view.setBounds(adjustedBounds(global.mainWindow));
  view.webContents.on("did-finish-load", () => {
    view.webContents.insertCSS(fs.readFileSync(path.join(__dirname, "..", "renderer", "css", "screen.css")).toString());
  });
  // view.webContents.openDevTools();

  global.mainWindow.on("resize", () => {
    view.setBounds(adjustedBounds(global.mainWindow));
  });

  ipcMain.on("window.home", () => {
    view.webContents.loadURL(url, { userAgent: global.userAgent });
  });

  ipcMain.on("screenshare.stop", () => {
    view.webContents.send("screenshare.stop");
  });

  view.webContents.on("context-menu", (event, params) => {
    var contextMenu = addContextMenuItems(global.mainWindow, params);
    contextMenu.popup();
  });

  return view;
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
      enableRemoteModule: true,
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
      enableRemoteModule: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  screenToolsWindow.setContentProtection(process.platform === "darwin");

  screenToolsWindow.webContents.loadFile(path.join(__dirname, "..", "renderer", "toolbar.html"));
  screenToolsWindow.setAlwaysOnTop(true, "screen-saver");
  return screenToolsWindow;
}

module.exports = { createMainWindow };
