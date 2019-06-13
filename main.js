const electron = require('electron')
const fs = require('fs-plus');
const os = require('os');
const path = require('path');
const fetch = require("node-fetch");
const {app, BrowserWindow, ipcMain} = electron;

if(require('electron-squirrel-startup')) app.quit();

const handleStartupEvent = () => {
  const installer = require("./installer-utils");
  if (process.platform !== 'win32') {
    return false;
  }

  var squirrelCommand = process.argv[1];
  switch (squirrelCommand) {
    case '--squirrel-install':
      installer.createShortcuts(() => {
        app.quit()
      })

      return true;
    case '--squirrel-updated':
      installer.updateShortcuts(() => {
        app.quit()
      })

      return true;
    case '--squirrel-uninstall':
      installer.removeShortcuts(() => {
        app.quit()
      })

      return true;
    case '--squirrel-obsolete':
      app.quit()
      return true;
  }
};

if (handleStartupEvent()) {
  return;
}

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

ipcMain.on('upload', (event, imageData, creds, description) => {  
  imageData = imageData.replace(/^data:image\/png;base64,/, "");

  fetch("https://api.imgur.com/3/image", {
    method: "POST", 
    body: JSON.stringify({
      image: imageData,
      type: "base64",
      name: "test.png",
      title: "what a test"
    }), 
    headers: {
      'Authorization': "Client-ID b00002d9b65af3b",
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  }).then(result => result.json()).then(json => {
    const link = json.data.link;
    fetch(`graph.facebook.com/17841400008460056/media?image_url=${link}&caption=${description}`, {
      method: "POST", 
      headers: {
        'Authorization': "Client-ID b00002d9b65af3b",
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
   })
  })
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