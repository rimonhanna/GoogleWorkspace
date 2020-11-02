# Google Workspace Desktop (Unofficial)

**Unofficial desktop application for Google Workspace (Google Meet, Chat, Currents, and Groups in one app) built with electron.**

![Screenshot of Google Workspace Desktop](.....jpg)

## Features

- Presenter can draw/annotate on screen when sharing the screen

  ![Demo of annotation feature](....gif)

- Global shortcuts to mute/unmute microphone and switch on/off camera

| Shortcut               | Use                           |
| ---------------------- | ----------------------------- |
| `Ctrl/⌘` + `Alt` + `A` | Toggle microphone mute/unmute |
| `Ctrl/⌘` + `Alt` + `V` | Toggle camera on/off          |

## Todo

- [ ] Ability to stop screenshare without opening the main window
- [ ] Ability to draw/annotate on presenter's screen for all participants
- [ ] Show floating video preview when minimized similar to zoom, slack
- [ ] Customizable shortcuts
- [ ] Mute/umute all participants
- [ ] Add to windows startup
- [ ] Add ability to share audio while screensharing in mac
- [ ] Download chat history

## Installation

You can [download the latest release](https://github.com/rimonhanna/GoogleWorkspace/releases) for your operating system or build it yourself (see below).

## Building

You'll need [Node.js](https://nodejs.org) installed on your computer in order to build this app.

```bash
$ git clone https://github.com/rimonhanna/GoogleWorkspace
$ cd GoogleWorkspace
$ npm install
$ npm start
```
