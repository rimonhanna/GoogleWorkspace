const DarkReader = require("darkreader");
const electron = require("electron")
const nativeTheme = electron.remote.nativeTheme

// const {
//   CONSTANTS: { THEME_OPTIONS },
// } = require("../helpers/util");

DarkReader.setFetchMethod(window.fetch);

// Save enable and disable dark theme functions in view.
const enableDark = () => {
  // Enable dark theme if userTheme is dark
  DarkReader.auto({
    brightness: 100,
    contrast: 90,
    sepia: 10,
  });
};

const enableLight = () => {
  // Otherwise default to light.
  DarkReader.disable();
};

// Set OS theme. This script will be run in the respective
// document contexts provided by preload.js.
const setOSTheme = async (toThemeStyle) => {
  DarkReader.auto();
  var setColors = function  () {
    document.querySelectorAll("iframe").forEach(frame => {
      frame.contentWindow.document.querySelectorAll('.t5F5nf').forEach(span => { 
        span.setAttribute('style', 'color:#acacac !important');
      });
    });
  }
  if (nativeTheme.shouldUseDarkColors) {
    setColors();
    window.addEventListener("load", () => {
      setColors();
    });
  } else {
    document.querySelectorAll("iframe").forEach(frame => {
      frame.contentWindow.document.querySelectorAll('.t5F5nf').forEach(span => { 
        span.removeAttribute('style');
      });
    });
  }

};

module.exports = { setOSTheme };
