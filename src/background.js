const server = "https://..";
const feed = `${server}/update/${process.platform}/${app.getVersion()}`;

autoUpdater.setFeedURL(feed);

setInterval(() => {
  autoUpdater.checkForUpdates();
}, 60000);

autoUpdater.on("update-downloaded", (event, releaseNotes, releaseName) => {
  const dialogOpts = {
    type: "info",
    buttons: ["Restart", "Later"],
    title: "Application Update",
    message: process.platform === "darwin" ? releaseNotes : releaseName,
    detail: "A new version has been downloaded. Restart the application to apply the updates.",
  };

  dialog.showMessageBox(dialogOpts, (response) => {
    if (response === 0) autoUpdater.quitAndInstall();
  });
});

autoUpdater.on("error", (message) => {
  console.error("There was a problem updating the application");
  console.error(message);
});
