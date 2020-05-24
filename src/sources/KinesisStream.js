const AWS = require('aws-sdk')
const through2 = require('through2')
const readable = require('kinesis-readable')
const BaseStream = require('./BaseStream')

function splitRecords(chunk, enc, next) {
  chunk.forEach(rec => {
    this.push(rec.Data)
  })
  next()
}

class KinesisStream extends BaseStream {
  createStream() {
    const client = new AWS.Kinesis({
      region: this.input.region,
      params: { StreamName: this.input.stream }
    })
    console.log(this.input)
    const params = { limit: this.input.batchSize }

    if (this.input.iterator_type === "AT_TIMESTAMP") {
      params.timestamp = this.input.timestamp.toISOString()
    } else {
      params.iterator = this.input.iterator_type
    }

    this._readable = readable(client, params)
    this.stream = this._readable
      .pipe(through2.obj(splitRecords))
      .pipe(this.unzipLine())
      .pipe(this.eventStringToJson())
      .pause()

    return this.stream
  }

  closeStream() {
    this._readable.close()
    super.closeStream()
  }
}

module.exports = KinesisStream
