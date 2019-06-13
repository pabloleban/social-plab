const fs = require('fs-plus')
const path = require('path')
const child = require('child_process')
const appFolder = path.resolve(process.execPath, '..')
const rootFolder = path.resolve(appFolder, '..')
const updateDotExe = path.join(rootFolder, 'Update.exe')
const exeName = "Social Plab"

const spawn = (command, args, callback) => {
    let spawnedProcess = null
    let error = null
    let stdout = ''

    try {
        spawnedProcess = child.spawn(command, args)
    } catch (processError) {
        process.nextTick(() => {
        callback(processError, stdout)
        })
        return
    }

    spawnedProcess.stdout.on('data', data => {
        stdout += data
    })

    spawnedProcess.on('error', processError => {
        error = error || processError
    })

    spawnedProcess.on('close', (code, signal) => {
        if (code !== 0) {
        error = error || new Error('Command failed: ' + (signal || code))
        }

        callback(error, stdout)
    })
}
  
const spawnUpdate = (args, callback) => {
    spawn(updateDotExe, args, callback)
}

exports.createShortcuts = callback => {
    spawnUpdate(['--createShortcut', exeName], callback)
}

exports.removeShortcuts = callback => {
    spawnUpdate(['--removeShortcut', exeName], callback)
}


exports.updateShortcuts = callback => {
    const homeDirectory = fs.getHomeDirectory()
    if (homeDirectory) {
      const desktopShortcutPath = path.join(homeDirectory, 'Desktop', exeName+".lnk")
      fs.access(desktopShortcutPath, desktopShortcutExists => {
        createShortcuts(() => {
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