/* global JSMpeg */
/* eslint-env browser */
const { ipcRenderer } = require('electron')
const Console = console
const logger = Console.log // require('./lib/logger')
/*
class Display {
  constructor (videos) {
    videos.forEach(element => {
      this.dom = document.createElement('video')
    })
  }
}
*/

function createCanvas (videos) {
  const grid = document.createElement('div')
  grid.id = 'main'

  // 'Monitor_' + cube + '' + k
  function extractFromMonitorName (monitor) { return { cube: parseInt(monitor[8]), n: parseInt(monitor[9]) } }

  function topLeftNumberDom (number) {
    const numDom = document.createElement('div')
    numDom.className = 'topLeftNumber'
    numDom.innerHTML = number
    return numDom
  }

  videos.forEach((video, i) => {
    const cell = document.createElement('div')
    cell.className = 'videoCell'
    video.dom = document.createElement('canvas')
    const { cube, n } = extractFromMonitorName(video.streamChannel)
    cell.appendChild(video.dom)
    cell.appendChild(topLeftNumberDom((cube * 4) + n + 1))
    grid.appendChild(cell)
  })
  return grid
}

function JSMpegVideo (video) {
  const JSMpegOptions = {
    decodeFirstFrame: true,
    disableWebAssembly: false,
    throttled: false,
    // chunkSize: 4 * 1024 * 1024,
    disableGl: false,
    audio: false,
    ipcRenderer: ipcRenderer
  }
  video.player = new JSMpeg.Player('ipc://' + video.streamChannel // not supported -> need to link it with JSMpeg
    , { canvas: video.dom, ...JSMpegOptions })
  video.player.play()
}

function dataImagetoCanvas (video) {
  const context = video.dom.getContext('2d')
  let imageObj
  ipcRenderer.on(video.streamChannel, (event, arg) => {
    imageObj = new Image()
    imageObj.src = 'data:image/jpeg;base64,' + arg
    imageObj.onload = function () {
      context.height = imageObj.height
      context.width = imageObj.width
      context.drawImage(imageObj, 0, 0, context.width, context.height)
    }
  })
}

function main () {
  document.body.appendChild(createCanvas(window.VIDEOS))
  logger('Received ' + JSON.stringify(window.VIDEOS))

  window.VIDEOS.forEach((video, i) => {
    if (i % 2 === 0)JSMpegVideo(video)
    else dataImagetoCanvas(video)
    ipcRenderer.on(video.streamChannel, (event, arg) => {
      logger(arg)
    })
  })
}

window.onload = () => {
  if (window.VIDEOS) main()
}
