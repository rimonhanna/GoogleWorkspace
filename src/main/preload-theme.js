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
  var fixDarkMode = function  () {
    document.querySelectorAll("iframe").forEach(frame => {
      frame.contentWindow.document.querySelectorAll('span[role="presentation"]').forEach(span => { 
        span.setAttribute('style', 'color:#acacac !important');
      });
      // if (frame.title == "Chat content") {
      //   frame.contentWindow.addEventListener("DOMContentLoaded", () => {
      //     frame.contentWindow.document.querySelectorAll(".Bl2pUd, .McQwEc, .nF6pT, .oGsu4").forEach(item => { 
      //       item.setAttribute('style', 'background-color:#181A1B !important');
      //     });
      //     frame.contentWindow.document.querySelectorAll(".Zc1Emd, .njhDLd ").forEach(item => { 
      //       item.setAttribute('style', 'color:#acacac !important');
      //     });
      //   });
        
        
      //   // frame.contentWindow.document.querySelectorAll(".oGsu4").forEach(item => { 
      //   //   item.setAttribute('style', 'background-color:#181A1B !important');
      //   // });
      //   // frame.contentWindow.document.querySelectorAll(".cZICLc").forEach(item => { 
      //   //   item.setAttribute('style', 'background-color:#202223 !important');
      //   // });
      // }
      
    });
  }
  if (nativeTheme.shouldUseDarkColors) {
    fixDarkMode();
    window.addEventListener("load", () => {
      fixDarkMode();
    });
    window.addEventListener("DOMSubtreeModified", () => {
      fixDarkMode();
    });
  } else {
    document.querySelectorAll("iframe").forEach(frame => {
      frame.contentWindow.document.querySelectorAll('span[role="presentation"]').forEach(span => { 
        span.removeAttribute('style');
      });
    });
  }

};

module.exports = { setOSTheme };
