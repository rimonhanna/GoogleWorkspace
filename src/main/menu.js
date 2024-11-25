const { ipcRenderer, nativeTheme } = require("electron");

const openAboutWindow = require("about-window").default;
const appInfo = require("../../package.json");
const config = require("../helpers/config");
const store = require("../helpers/store");
const {
  CONSTANTS: { OS_PLATFORMS, THEME_OPTIONS, USER_PREF_KEYS },
  openUrlInBrowser,
} = require("../helpers/util");

const about = () => {
  openAboutWindow({
    product_name: appInfo.productName,
    icon_path: `../../build/icon.png`,
    copyright: appInfo.copyright,
    package_json_dir: `${__dirname}/../../`,
    bug_report_url: appInfo.repository.report,
    license: appInfo.license,
    win_options: {
      titleBarStyle: "hidden",
      resizable: false,
      open_devtools: true,
    },
  });
};

const toggleAdminView = () => {
  var currentAdmin = store.get(USER_PREF_KEYS.SHOW_ADMIN);
  currentAdmin = currentAdmin? false: true;
  store.set(USER_PREF_KEYS.SHOW_ADMIN, currentAdmin);
}

const toggleGroupsView = () => {
  var currentBoolean = store.get(USER_PREF_KEYS.SHOW_GROUPS);
  currentBoolean = currentBoolean? false: true;
  store.set(USER_PREF_KEYS.SHOW_GROUPS, currentBoolean);
}

const toggleDriveView = () => {
  var currentBoolean = store.get(USER_PREF_KEYS.SHOW_DRIVE);
  currentBoolean = currentBoolean? false: true;
  store.set(USER_PREF_KEYS.SHOW_DRIVE, currentBoolean);
}

// const toggleMailView = () => {
//   var currentBoolean = store.get(USER_PREF_KEYS.SHOW_MAIL);
//   currentBoolean = currentBoolean? false: true;
//   store.set(USER_PREF_KEYS.SHOW_MAIL, currentBoolean);
// }

const toggleCalendarView = () => {
  var currentBoolean = store.get(USER_PREF_KEYS.SHOW_CALENDAR);
  currentBoolean = currentBoolean? false: true;
  store.set(USER_PREF_KEYS.SHOW_CALENDAR, currentBoolean);
}

const toggleDarkMode = () => {
  // Code can probably be a lot cleaner than this.
  const currentTheme = store.get(USER_PREF_KEYS.THEME);
  let toTheme;

  if (currentTheme === THEME_OPTIONS.AUTO) {
    // If auto, set theme to opposite of os theme and go manual
    toTheme = nativeTheme.shouldUseDarkColors
      ? THEME_OPTIONS.LIGHT
      : THEME_OPTIONS.DARK;
  } else if (currentTheme === THEME_OPTIONS.DARK) {
    toTheme = THEME_OPTIONS.LIGHT;
  } else {
    toTheme = THEME_OPTIONS.DARK;
  }

  // Set theme store to manual, and trigger style change
  store.set(USER_PREF_KEYS.THEME, toTheme);
};

const toggleOpenLinksInBrowser = () => {
  const { EXTERNAL_LINKS } = USER_PREF_KEYS;
  store.set(EXTERNAL_LINKS, !store.get(EXTERNAL_LINKS));
};

const openAppRepoUrlInBrowser = async () => {
  openUrlInBrowser({ url: appInfo.repository.url });
};

const template = [
  {
    label: "Application",
    submenu: [
      { label: `About ${appInfo.productName}`, click: about },
      { type: "separator" },
      { role: "services" },
      { type: "separator" },
      { role: "hide" },
      { role: "hideothers" },
      { role: "unhide" },
      { type: "separator" },
      { label: "Quit", accelerator: "CmdOrCtrl+Q", role: "quit" },
    ],
  },
  {
    label: "File",
    submenu: [
      { role: "minimize" },
      { role: "close" },
      {
        label: "Toggle Full Screen",
        accelerator:
          config.osPlatform === OS_PLATFORMS.MAC_OS
            ? "Cmd+Ctrl+F"
            : "Ctrl+Alt+F",
        role: "toggleFullScreen",
      },
    ],
  },
  {
    label: "Edit",
    role: "editMenu",
  },
  {
    label: "View",
    submenu: [
      { role: "zoomIn" },
      { role: "zoomOut" },
      { role: "resetZoom" },
      // {
      //   label: "Toggle Dark Mode",
      //   accelerator: "CmdOrCtrl+T",
      //   checked: store.get(USER_PREF_KEYS.THEME),
      //   click: toggleDarkMode,
      // },
      { type: "separator" },
      {
        label: "Admin",
        type: "checkbox",
        checked: store.get(USER_PREF_KEYS.SHOW_ADMIN),
        click: toggleAdminView,
      },
      {
        label: "Groups",
        type: "checkbox",
        checked: store.get(USER_PREF_KEYS.SHOW_GROUPS),
        click: toggleGroupsView,
      },
      // {
      //   label: "Mail",
      //   type: "checkbox",
      //   checked: store.get(USER_PREF_KEYS.SHOW_MAIL),
      //   click: toggleMailView,
      // },
      {
        label: "Calendar",
        type: "checkbox",
        checked: store.get(USER_PREF_KEYS.SHOW_CALENDAR),
        click: toggleCalendarView,
      },
      {
        label: "Drive",
        type: "checkbox",
        checked: store.get(USER_PREF_KEYS.SHOW_DRIVE),
        click: toggleDriveView,
      }
    ],
  },
  {
    label: "Window",
    submenu: [
      { role: "minimize" },
      { role: "zoom" },
      ...(config.osPlatform === OS_PLATFORMS.MAC_OS
        ? [{ role: "front" }]
        : [{ role: "close" }]),
      {
        label: "Open external links in browser",
        type: "checkbox",
        click: toggleOpenLinksInBrowser,
        checked: store.get(USER_PREF_KEYS.EXTERNAL_LINKS),
      },
    ],
  },
  {
    role: "help",
    submenu: [
      {
        label: "Learn More",
        click: openAppRepoUrlInBrowser,
      },
    ],
  },
];

if (config.isDev) {
  template.push({
    label: "Debug",
    submenu: [
      {
        label: "Print All Windows",
        accelerator: "CmdOrCtrl+P",
        // click: print_windows,
      },
    ],
  });
}

module.exports = { template };
