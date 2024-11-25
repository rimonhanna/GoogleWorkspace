const homeButton = document.getElementById("home");
const minimizeButton = document.getElementById("minimize");
const maximizeButton = document.getElementById("maximize");
const restoreButton = document.getElementById("restore");
const closeButton = document.getElementById("close");

const admin = document.getElementById("admin-tab");
const groups = document.getElementById("groups-tab");
// const mail = document.getElementById("mail-tab");
const chat = document.getElementById("chat-tab");
const meet = document.getElementById("meet-tab");
const calendar = document.getElementById("calendar-tab");
const drive = document.getElementById("drive-tab");

admin.addEventListener("click", () => {
  ipc.send("window.admin");
});
groups.addEventListener("click", () => {
  ipc.send("window.groups");
});
// mail.addEventListener("click", () => {
//   ipc.send("window.mail");
// });
chat.addEventListener("click", () => {
  ipc.send("window.chat");
});
meet.addEventListener("click", () => {
  ipc.send("window.meet");
});
calendar.addEventListener("click", () => {
  ipc.send("window.calendar");
});
drive.addEventListener("click", () => {
  ipc.send("window.drive");
});

restoreButton.style.display = "none";
homeButton.addEventListener("click", () => {
  ipc.send("window.home");
});
minimizeButton.addEventListener("click", () => {
  ipc.send("window.minimize");
});
maximizeButton.addEventListener("click", () => {
  ipc.send("window.maximize");
});
restoreButton.addEventListener("click", () => {
  ipc.send("window.restore");
});
closeButton.addEventListener("click", () => {
  ipc.send("window.close");
});

ipc.on("window.maximized", () => {
  maximizeButton.style.display = "none";
  restoreButton.style.display = "flex";
});
ipc.on("window.restored", () => {
  maximizeButton.style.display = "flex";
  restoreButton.style.display = "none";
});
