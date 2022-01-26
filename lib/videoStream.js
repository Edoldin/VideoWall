const events = require('events')
const Mpeg1Muxer = require('./mpeg1muxer')
const logger = require('./logger')

// const STREAM_MAGIC_BYTES = 'jsmp' // Must be 4 bytes
class VideoStream extends events.EventEmitter {
  constructor (options) {
    super()
    this.options = options
    this.sender = options.sender
    this.streamChannel = options.streamChannel
    this.streamUrl = options.streamUrl
    this.width = options.width
    this.height = options.height
    this.inputStreamStarted = false
    this.stream = undefined
    logger.info('Iniciando VideoStream ' + this.streamChannel)
    this.startMpeg1Stream()
    logger.info('stream ' + this.streamChannel + ' iniciado')
  }

  stop () {
    this.stream.kill()
    this.inputStreamStarted = false
  }

  startMpeg1Stream () {
    this.mpeg1Muxer = new Mpeg1Muxer({
      ffmpegOptions: this.options.ffmpegOptions,
      url: this.streamUrl,
      ffmpegPath: process.env.FFMPEG_PATH
    })
    this.stream = this.mpeg1Muxer.stream
    if (this.inputStreamStarted) {
      return
    }
    this.mpeg1Muxer.on('mpeg1data', this.options.verbose
      ? (data) => {
          logger.debug('Mandando datos a ' + this.streamChannel)
          this.sender.send(this.streamChannel, data)
        }
      : (data) => this.sender.send(this.streamChannel, data))

    let gettingInputData = false
    const inputData = []
    // let gettingOutputData = false
    // const outputData = []
    this.mpeg1Muxer.on('ffmpegStdout', (data) => {
      // search for video dimensions if they are not specified until find
      if (this.width != null && this.height != null) return
      data = data.toString()
      if (data.indexOf('Input #') !== -1) {
        gettingInputData = true
      }
      if (data.indexOf('Output #') !== -1) {
        gettingInputData = false
        // gettingOutputData = true
      }
      if (data.indexOf('frame') === 0) {
        // gettingOutputData = false
      }
      if (gettingInputData) {
        inputData.push(data.toString())
        let size = data.match(/\d+x\d+/)
        if (size != null) {
          size = size[0].split('x')
          if (this.width == null) {
            this.width = parseInt(size[0], 10)
          }
          if (this.height == null) {
            this.height = parseInt(size[1], 10)
          }
        }
      }
    })
    this.mpeg1Muxer.on('ffmpegStdout', function (data) {
      logger.debug(data.toString('utf8'))
    })
    this.mpeg1Muxer.on('exitWithError', () => {
      logger.error('mpeg1Muxer exited with error code')
      this.stop()
      return this.emit('exitWithError')
    })
  }

  /* onSocketConnect (socket, request) {
    // Send magic bytes and video size to the newly connected socket
    // struct { char magic[4]; unsigned short width, height;}
    const streamHeader = Buffer.alloc(8)
    streamHeader.write(STREAM_MAGIC_BYTES)
    streamHeader.writeUInt16BE(this.width, 4)
    streamHeader.writeUInt16BE(this.height, 6)
    socket.send(streamHeader, {
      binary: true
    })
    logger.info(`${this.name}: New WebSocket Connection (` + this.wsServer.clients.size + ' total)')

    socket.remoteAddress = request.connection.remoteAddress

    return socket.on('close', (code, message) => {
      return logger.info(`${this.name}: Disconnected WebSocket (` + this.wsServer.clients.size + ' total)')
    })
  } */
}

module.exports = VideoStream
