require('dotenv').config()
// Modules to control application life and create native browser window
const { app, screen } = require('electron')
const logger = require('./lib/logger')
const VideoWall = require('./lib/videoWall')

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  logger.info('Iniciando VideoWall')
  const displays = screen.getAllDisplays()
  const windows = []
  displays.forEach((screen, cube) => {
    const videos = []
    for (let k = 0; k < 4; k++) {
      const monitorName = 'Monitor_' + cube + '' + k
      videos.push({
        streamChannel: monitorName,
        streamUrl: process.env[monitorName],
        width: null,
        height: null
      })
    }
    windows.push(new VideoWall(screen.bounds, cube, videos))
  })
  let closing = false
  windows.forEach((w, i) => w.on('closed', function () {
    logger.info('Cerrando ventana ' + i)
    if (!closing) app.quit()
    closing = true
  }))
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
/*
app.on('window-all-closed', function () {
  logger.info('Ninguna ventana abierta, cerrando app')
  if (process.platform !== 'darwin') app.quit()
})
*/
