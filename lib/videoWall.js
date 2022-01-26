const { BrowserWindow } = require('electron')
const VideoStream = require('./videoStream')
const logger = require('./logger')

class VideoWall extends BrowserWindow {
  constructor (position, index, videos) {
    // Create the browser window.
    super({
      x: position.x,
      y: position.y,
      // webPreferences: {
      //  preload: path.join(__dirname, 'preload.js')
      // },
      webPreferences: {
        nodeIntegration: true,
        nodeIntegrationInWorker: true,
        contextIsolation: false,
        enableRemoteModule: true
      },
      show: false,
      frame: false,
      icon: './favicon.ico'
    })
    this.maximize()
    logger.info('Mostrando en el cubo ' + index + ' => ' + videos.map(v => v.streamChannel).join(' '))
    // set VIDEOS global variable on client
    this.webContents.executeJavaScript([
      'window.VIDEOS = ', JSON.stringify(videos), ';',
      'if(main) main();',
      'else console.log("!main")'
    ].join(''))
    // set videoStream
    videos.forEach(video => {
      if (video.streamUrl !== '') {
        this.videoStream = new VideoStream({
          verbose: true,
          sender: this.webContents,
          streamChannel: video.streamChannel,
          streamUrl: video.streamUrl,
          width: video.width,
          height: video.height
        })
      }
    })

    // and load the index.html of the app.
    this.loadFile('view/index.html')
    this.once('ready-to-show', () => {
      this.show()
    })
    // Open the DevTools.
    this.webContents.openDevTools()

    // If not deleted window-all-closed wont be triggered
    this.on('closed', function () {
      delete this
    })
  }
}

module.exports = VideoWall
