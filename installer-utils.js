const fs = require('fs-plus')
const path = require('path')
const child = require('child_process')
const appFolder = path.resolve(process.execPath, '..')
const rootFolder = path.resolve(appFolder, '..')
const updateDotExe = path.join(rootFolder, 'Update.exe')

const spawn = function (command, args, callback) {
    let spawnedProcess = null
    let error = null
    let stdout = ''

    try {
        spawnedProcess = child.spawn(command, args)
    } catch (processError) {
        process.nextTick(function () {
        callback(processError, stdout)
        })
        return
    }

    spawnedProcess.stdout.on('data', function (data) {
        stdout += data
    })

    spawnedProcess.on('error', function (processError) {
        error = error || processError
    })

    spawnedProcess.on('close', function (code, signal) {
        if (code !== 0) {
        error = error || new Error('Command failed: ' + (signal || code))
        }

        callback(error, stdout)
    })
}
  
const spawnUpdate = function (args, callback) {
    spawn(updateDotExe, args, callback)
}

exports.createShortcuts = function (callback) {
    spawnUpdate(['--createShortcut', exeName], callback)
}

exports.removeShortcuts = function (callback) {
    spawnUpdate(['--removeShortcut', exeName], callback)
}


exports.updateShortcuts = function (callback) {
    const homeDirectory = fs.getHomeDirectory()
    if (homeDirectory) {
      const desktopShortcutPath = path.join(homeDirectory, 'Desktop', "Social Plab.lnk")
      fs.access(desktopShortcutPath, function (desktopShortcutExists) {
        createShortcuts(function () {
          if (desktopShortcutExists) {
            callback()
          } else {
            fs.unlink(desktopShortcutPath, callback)
          }
        })
      })
    } else {
      createShortcuts(callback)
    }
}