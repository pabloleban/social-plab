const electron = require('electron')
const fs = require('fs');
const fetch = require("node-fetch");
const {app, BrowserWindow, ipcMain} = electron;
let mainWindow = null;

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({webPreferences: { webSecurity: false }});
  //mainWindow.setMenu(null)
  mainWindow.maximize();

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  mainWindow.on('closed', function () {
    mainWindow = null
  })
}

ipcMain.on('download', (event, data) => {  
  data = data.replace(/^data:image\/png;base64,/, "");
  fs.writeFile('instagram.png', data, 'base64', err => {
    if (err) throw err;
  });
});

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