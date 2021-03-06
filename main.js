const electron = require('electron')
require('electron-reload')(__dirname);
const {autoUpdater} = require('electron-updater');
const fs = require('fs-plus');
const os = require('os');
const path = require('path');
const fetch = require("node-fetch");
const {app, BrowserWindow, ipcMain} = electron;

let mainWindow = null;

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({        
    webPreferences: {
      nodeIntegration: true
    },
    frame: false,
  });
  //mainWindow.setMenu(null)
  mainWindow.maximize();

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.webContents.once('dom-ready', () => {
    autoUpdater.autoDownload = false;
    autoUpdater.checkForUpdates()
  })
}

ipcMain.on('download', (event, data) => {  
  data.image = data.image.replace(/^data:image\/png;base64,/, "");

  if(!data.filename.endsWith(".png")){
    data.filename += ".png"
  }

  const savePath = path.join(os.homedir(), 'Desktop', data.filename);
  fs.writeFile(savePath, data.image, 'base64', err => {
    if (err) {
      event.sender.send('download-done', "error")
      throw err;
    } else {
      event.sender.send('download-done', savePath)
    }
  });
});

ipcMain.on("close", () => {
  mainWindow.close();
})

ipcMain.on("toggleMaximize", () => {
  if(mainWindow.isMaximized()){
    mainWindow.unmaximize()
  } else {
    mainWindow.maximize()
  }
})

ipcMain.on("minimize", () => {
  mainWindow.minimize();
})

ipcMain.on("update", () => {
  autoUpdater.downloadUpdate()
})

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

const sendStatusToWindow = (status, text = "") => {
  if(mainWindow){
    mainWindow.webContents.send(status, text)
  }
}

autoUpdater.on("checking-for-update", () => {
  sendStatusToWindow("checking-for-update")
})

autoUpdater.on("update-available", info => {
  sendStatusToWindow("update-available")
})

autoUpdater.on("update-not-available", info => {
  sendStatusToWindow("update-not-available")
})

autoUpdater.on("error", err => {
  sendStatusToWindow("error")
})

autoUpdater.on("download-progress", (progressObj) => {
  sendStatusToWindow("download-progress", `Downloaded ${progressObj.percent}% at ${progressObj.bytesPerSecond}`)
})

autoUpdater.on("update-downloaded", info => {
  sendStatusToWindow("update-downloaded")

  autoUpdater.quitAndInstall(true, true);
})