const fs = require('fs')
const path = require('path')
const split = require('binary-split')
const BaseStream = require('./BaseStream')

// TODO:
//  - can we support reading out of a folder instead of a single file?

class LocalFirehose extends BaseStream {
  createStream() {
    const location = path.resolve(this.input.location)
    this.stream = fs.createReadStream(this.input.location, 'utf-8')
      .pipe(split())
      .pipe(this.unzipLine())
      .pipe(this.eventStringToJson())
      .pause()

    return this.stream
  }
}

module.exports = LocalFirehose
