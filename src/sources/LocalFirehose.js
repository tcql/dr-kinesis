const fs = require('fs')
const path = require('path')
const zlib = require('zlib')
const prompts = require('prompts')
const through2 = require('through2')
const split = require('binary-split')
const BaseSource = require('./BaseSource')

// TODO:
//  - clean up all these floaty functions. lots of them are probably generally useful, not just here
//  - can we support reading out of a folder instead of a single file?
//  - can we make filter creation interactive / more powerful?
//  - handle non-gzipped events (rare for us, but possible)

function unzipLine(line, encoding, next) {
  let data = JSON.parse(line).data
  let gz = zlib.gunzipSync(Buffer.from(data, 'base64'))
  next(null, gz)
}

function eventStringToJson(line, encoding, next) {
  let events = JSON.parse(line)
  events.forEach(e => this.push(e))
  next()
}



class LocalFirehose extends BaseSource {

  async gatherInput() {
    const questions = [
      {
        type: 'text',
        name: 'location',
        message: 'Where is the Firehose data located?',
        validate: value => fs.existsSync(path.resolve(value)) ? true : "Location must be a valid file path",
        format: value => path.resolve(value)
      },
    ]

    await this.ask(questions)
  }

  createStream() {
    const location = path.resolve(this.input.location)
    return fs.createReadStream(this.input.location, 'utf-8')
      .pipe(split())
      .pipe(this.unzipLine())
      .pipe(this.eventStringToJson())
      .pause()
  }
}


module.exports = LocalFirehose
