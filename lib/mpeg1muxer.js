const { spawn } = require('child_process')
const events = require('events')
const logger = require('./logger')

class Mpeg1Muxer extends events.EventEmitter {
  constructor (options) {
    super()
    this.url = options.url
    this.ffmpegOptions = options.ffmpegOptions
    this.exitCode = undefined
    this.additionalFlags = []
    if (this.ffmpegOptions) {
      for (const key in this.ffmpegOptions) {
        this.additionalFlags.push(key)
        if (String(this.ffmpegOptions[key]) !== '') {
          this.additionalFlags.push(String(this.ffmpegOptions[key]))
        }
      }
    }
    this.spawnOptions = [
      '-rtsp_transport',
      'udp',
      '-i',
      this.url,
      '-f',
      'mpegts',
      '-codec:v',
      'mpeg1video',
      // additional ffmpeg options go here
      ...this.additionalFlags,
      '-'
    ]
    this.spawnOptions2 = [
      '-rtsp_transport',
      'udp',
      '-i',
      this.url,
      '-f',
      'h264',
      '-vcodec',
      'libx264',
      '-r',
      '10',
      '-s',
      '160x144',
      '-g',
      '0',
      '-b',
      '800000',
      // additional ffmpeg options go here
      ...this.additionalFlags,
      '-'
    ]
    logger.info('cmd: ' + options.ffmpegPath + ' ' + this.spawnOptions.join(' '))
    this.stream = spawn(options.ffmpegPath, this.spawnOptions2, {
      detached: false
    })
    this.inputStreamStarted = true
    this.stream.stdout.on('data', (data) => {
      return this.emit('mpeg1data', data)
    })
    this.stream.stderr.on('data', (data) => {
      return this.emit('ffmpegStdout', data)
    })
    this.stream.on('exit', (code, signal) => {
      if (code === 1) {
        logger.error('RTSP stream exited with error')
        this.exitCode = 1
        return this.emit('exitWithError')
      }
    })
  }
}
module.exports = Mpeg1Muxer
