const fs = require('fs')
const path = require('path')
const split = require('binary-split')
const BaseSource = require('./BaseSource')

// TODO:
//  - can we support reading out of a folder instead of a single file?

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
