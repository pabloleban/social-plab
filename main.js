const electron = require('electron')
const fs = require('fs');
const os = require('os');
const path = require('path');
const fetch = require("node-fetch");
const {app, BrowserWindow, ipcMain} = electron;
let mainWindow = null;

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    frame: false,
  });
  //mainWindow.setMenu(null)
  mainWindow.maximize();

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  mainWindow.on('closed', function () {
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

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow()
  }
})