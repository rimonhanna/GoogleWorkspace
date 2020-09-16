/* All window creation functions */
const path = require("path");
const fs = require("fs");
const defaultMenu = require('electron-default-menu');
const { BrowserWindow, BrowserView, Menu, MenuItem, ipcMain, screen, app, shell } = require("electron");
const windowStateKeeper = require("electron-window-state");

const GOOGLE_MEET_URL = "https://meet.google.com/";
const GOOGLE_CHAT_URL = "https://chat.google.com/";
const GOOGLE_CURRENTS_URL = "https://currents.google.com/";
const GOOGLE_GROUPS_URL = "https://groups.google.com/my-groups";
const GOOGLE_CALENDAR_URL = "https://calendar.google.com/calendar";


function createMainWindow() {
  const mainWindowState = windowStateKeeper({
    defaultWidth: 1280,
    defaultHeight: 800,
    fullScreen: false,
    maximize: true,
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
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, "..", "renderer", "preload.js"),
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

  mainWindow.maximize();

  createGoogleGroupsView(mainWindow);
  createGoogleCurrentsView(mainWindow);
  createGoogleMeetView(mainWindow);
  createGoogleCalendarView(mainWindow);
  createGoogleChatView(mainWindow);

  ipcMain.on("window.meet", (event) => {
    mainWindow.setBrowserView(global.googleMeetView);
    global.googleMeetView.setBounds(adjustedBounds(mainWindow));
    global.googleMeetView.webContents.focus();
  });
  ipcMain.on("window.chat", (event) => {
    mainWindow.setBrowserView(global.googleChatView);
    global.googleChatView.setBounds(adjustedBounds(mainWindow));
    global.googleChatView.webContents.focus();
  });
  ipcMain.on("window.currents", (event) => {
    mainWindow.setBrowserView(global.googleCurrentsView);
    global.googleCurrentsView.setBounds(adjustedBounds(mainWindow));
    global.googleCurrentsView.webContents.focus();
  });
  ipcMain.on("window.groups", (event) => {
    mainWindow.setBrowserView(global.googleGroupsView);
    global.googleGroupsView.setBounds(adjustedBounds(mainWindow));
    global.googleGroupsView.webContents.focus();
  });
  ipcMain.on("window.calendar", (event) => {
    mainWindow.setBrowserView(global.googleCalendarView);
    global.googleCalendarView.setBounds(adjustedBounds(mainWindow));
    global.googleCalendarView.webContents.focus();
  });

  let handleNavigation = function (event, url, frameName, disposition, options) {
    event.preventDefault();

    var urlArray = url.split("dest=");
    if(urlArray.length > 1) {
        url = unescape(urlArray[1]);
    }

    if (url.includes("meet.google")) {
      global.googleMeetView.webContents.loadURL(url);
      mainWindow.webContents.executeJavaScript("document.getElementById('meet-tab').click();");
    } else if (url.includes("currents.google")) {
      global.googleCurrentsView.webContents.loadURL(url);
      mainWindow.webContents.executeJavaScript("document.getElementById('currents-tab').click();");
    } else if (url.includes("chat.google")) {
      global.googleChatView.webContents.loadURL(url);
      mainWindow.webContents.executeJavaScript("document.getElementById('chat-tab').click();");
    } else if (url.includes("groups.google")) {
      global.googleGroupsView.webContents.loadURL(url);
      mainWindow.webContents.executeJavaScript("document.getElementById('groups-tab').click();");
    } else if (url.includes("calendar.google")) {
      global.googleCalendarView.webContents.loadURL(url);
      mainWindow.webContents.executeJavaScript("document.getElementById('calendar-tab').click();");
    } else  if (url.includes("notion.so")) {
      shell.openExternal(url.replace("https://", "notion://"))
    } else  if (url.includes("zoom.us")) {
      shell.openExternal(url.replace("https://", "zoommtg://").replace("/j/", "/start?confno="))
    } else {
      shell.openExternal(url);
    }
  };

  global.googleMeetView.webContents.on("new-window", handleNavigation);
  global.googleChatView.webContents.on("new-window", handleNavigation);
  global.googleCurrentsView.webContents.on("new-window", handleNavigation);
  global.googleGroupsView.webContents.on("new-window", handleNavigation);
  global.googleCalendarView.webContents.on("new-window", handleNavigation);

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

  ipcMain.on("window.main.focus", () => {
    mainWindow.restore();
    mainWindow.focus();
  });

  mainWindow.on("closed", () => {
    app.quit();
  });

  return mainWindow;
}

function setMainMenu() {
  // Get template for default menu 
  const menuTemplate = defaultMenu(app, shell);
 
  // Add custom menu 
  menuTemplate[0].submenu.splice(1, 0, {
    label: 'Preferences',
    click: (item, focusedWindow) => {

    }
  });
 
  // Set top-level application menu, using modified template 
  Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));
}

function createGoogleMeetView(mainWindow) {
  const googleMeetView = (global.googleMeetView = new BrowserView({
    webPreferences: {
      preload: path.join(__dirname, "..", "renderer", "adapters", "polyfill.js"),
    },
  }));

  let url = GOOGLE_MEET_URL;
  if (app.commandLine.hasSwitch("room-id")) {
    url = GOOGLE_MEET_URL + app.commandLine.getSwitchValue("room-id");
  }

  mainWindow.addBrowserView(googleMeetView);

  googleMeetView.webContents.loadURL(url);
  googleMeetView.setBounds(adjustedBounds(mainWindow));
  googleMeetView.webContents.on("did-finish-load", () => {
    googleMeetView.webContents.insertCSS(fs.readFileSync(path.join(__dirname, "..", "renderer", "css", "screen.css")).toString());
  });
  // googleMeetView.webContents.openDevTools();

  mainWindow.on("resize", () => {
    googleMeetView.setBounds(adjustedBounds(mainWindow));
  });

  ipcMain.on("window.home", () => {
    googleMeetView.webContents.loadURL(GOOGLE_MEET_URL);
  });

  ipcMain.on("screenshare.stop", () => {
    googleMeetView.webContents.send("screenshare.stop");
  });
}

function createGoogleChatView(mainWindow) {
  const googleChatView = (global.googleChatView = new BrowserView({
    webPreferences: {
      preload: path.join(__dirname, "..", "renderer", "adapters", "polyfill.js"),
    },
  }));

  let url = GOOGLE_CHAT_URL;
  if (app.commandLine.hasSwitch("room-id")) {
    url = GOOGLE_CHAT_URL + app.commandLine.getSwitchValue("room-id");
  }

  mainWindow.addBrowserView(googleChatView);

  googleChatView.webContents.loadURL(url);
  googleChatView.setBounds(adjustedBounds(mainWindow));
  googleChatView.webContents.on("did-finish-load", () => {
    googleChatView.webContents.insertCSS(fs.readFileSync(path.join(__dirname, "..", "renderer", "css", "screen.css")).toString());
  });
  // googleChatView.webContents.openDevTools();

  mainWindow.on("resize", () => {
    googleChatView.setBounds(adjustedBounds(mainWindow));
  });

  ipcMain.on("window.home", () => {
    googleChatView.webContents.loadURL(GOOGLE_CHAT_URL);
  });
}

function createGoogleCalendarView(mainWindow) {
  const googleCalendarView = (global.googleCalendarView = new BrowserView({
    webPreferences: {
      preload: path.join(__dirname, "..", "renderer", "adapters", "polyfill.js"),
    },
  }));
  let url = GOOGLE_CALENDAR_URL;
  mainWindow.addBrowserView(googleCalendarView);
  googleCalendarView.webContents.loadURL(url);
  googleCalendarView.setBounds(adjustedBounds(mainWindow));
  googleCalendarView.webContents.on("did-finish-load", () => {
    googleCalendarView.webContents.insertCSS(fs.readFileSync(path.join(__dirname, "..", "renderer", "css", "screen.css")).toString());
  });

  mainWindow.on("resize", () => {
    googleCalendarView.setBounds(adjustedBounds(mainWindow));
  });

  ipcMain.on("window.home", () => {
    googleCalendarView.webContents.loadURL(GOOGLE_CURRENTS_URL);
  });
}

function createGoogleCurrentsView(mainWindow) {
  const googleCurrentsView = (global.googleCurrentsView = new BrowserView({
    webPreferences: {
      preload: path.join(__dirname, "..", "renderer", "adapters", "polyfill.js"),
    },
  }));

  let url = GOOGLE_CURRENTS_URL;
  if (app.commandLine.hasSwitch("post-id")) {
    url = GOOGLE_CURRENTS_URL + app.commandLine.getSwitchValue("post-id");
  }

  mainWindow.addBrowserView(googleCurrentsView);

  googleCurrentsView.webContents.loadURL(url);
  googleCurrentsView.setBounds(adjustedBounds(mainWindow));
  googleCurrentsView.webContents.on("did-finish-load", () => {
    googleCurrentsView.webContents.insertCSS(fs.readFileSync(path.join(__dirname, "..", "renderer", "css", "screen.css")).toString());
  });
  // googleCurrentsView.webContents.openDevTools();

  mainWindow.on("resize", () => {
    googleCurrentsView.setBounds(adjustedBounds(mainWindow));
  });

  ipcMain.on("window.home", () => {
    googleCurrentsView.webContents.loadURL(GOOGLE_CURRENTS_URL);
  });
}

function createGoogleGroupsView(mainWindow) {
  const googleGroupsView = (global.googleGroupsView = new BrowserView({
    webPreferences: {
      preload: path.join(__dirname, "..", "renderer", "adapters", "polyfill.js"),
    },
  }));

  let url = GOOGLE_GROUPS_URL;
  if (app.commandLine.hasSwitch("group-id")) {
    url = GOOGLE_GROUPS_URL + app.commandLine.getSwitchValue("group-id");
  }

  mainWindow.addBrowserView(googleGroupsView);

  googleGroupsView.webContents.loadURL(url);
  googleGroupsView.setBounds(adjustedBounds(mainWindow));
  googleGroupsView.webContents.on("did-finish-load", () => {
    googleGroupsView.webContents.insertCSS(fs.readFileSync(path.join(__dirname, "..", "renderer", "css", "screen.css")).toString());
  });
  // googleGroupsView.webContents.openDevTools();

  mainWindow.on("resize", () => {
    googleGroupsView.setBounds(adjustedBounds(mainWindow));
  });

  ipcMain.on("window.home", () => {
    googleGroupsView.webContents.loadURL(GOOGLE_GROUPS_URL);
  });
}

function adjustedBounds(mainWindow) {
  return {
    x: 0,
    y: 40,
    width: mainWindow.getBounds().width,
    height: mainWindow.getBounds().height - 40
  }
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
      preload: path.join(__dirname, "..", "renderer", "preload.js"),
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
      preload: path.join(__dirname, "..", "renderer", "preload.js"),
    },
  });

  screenToolsWindow.setContentProtection(process.platform === "darwin");

  screenToolsWindow.webContents.loadFile(path.join(__dirname, "..", "renderer", "toolbar.html"));
  screenToolsWindow.setAlwaysOnTop(true, "screen-saver");
  return screenToolsWindow;
}

module.exports = { createMainWindow };
