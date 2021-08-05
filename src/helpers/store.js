const Store = require("electron-store");

const schema = {
  theme: {
    type: "string",
    enum: ["auto", "light", "dark"],
    default: "auto",
  },
  openLinksInBrowser: {
    type: "boolean",
    default: true,
  },
  showAdmin: {
    type: "boolean",
    default: false,
  },
  showCurrents: {
    type: "boolean",
    default: false,
  },
  showGroups: {
    type: "boolean",
    default: true,
  },
  showDrive: {
    type: "boolean",
    default: true,
  },
  showCalendar: {
    type: "boolean",
    default: true,
  },
  showMail: {
    type: "boolean",
    default: true,
  },
};

module.exports = new Store({ schema });
