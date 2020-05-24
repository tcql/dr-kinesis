const zlib = require('zlib')
const through2 = require('through2')

class BaseStream {
  constructor(input) {
    this.input = input
  }


  createStream() {
    throw new Error("child class must implement createStream")
  }


  // createStream should set this.stream
  getStream() {
    return this.stream
  }


  unzipLine() {
    // can't be an arrow function because "this" is the through2
    // instance, not the BaseSource instance
    return through2.obj(function (line, encoding, next) {
      let data = line
      try {
        data = JSON.parse(line).data
        if (!data) data = line
      } catch {}

      try {
        data = zlib.gunzipSync(Buffer.from(data, 'base64'))
      } catch {}

      next(null, data)
    })
  }


  eventStringToJson(line, encoding, next) {
    return through2.obj(function (line, encoding, next) {
      let events = line
      try {
        events = JSON.parse(line)
      } catch {}

      if (Array.isArray(events)) {
        events.forEach(e => this.push(e))
      } else {
        this.push(events)
      }
      next()
    })
  }


  closeStream() {
    this.stream.end()
  }
}

module.exports = BaseStream
