const AWS = require('aws-sdk')
const through2 = require('through2')
const readable = require('kinesis-readable')
const BaseSource = require('./BaseSource')

function splitRecords(chunk, enc, next) {
  chunk.forEach(rec => {
    this.push(rec.Data)
  })
  next()
}

class KinesisStream extends BaseSource {
  createStream() {
    let input = this.input

    const client = new AWS.Kinesis({
      region: input.region,
      params: { StreamName: input.stream }
    })

    const params = { limit: this.batchSize }

    if (input.iterator_type === "AT_TIMESTAMP") {
      params.timestamp = input.timestamp.toISOString()
    } else {
      params.iterator = input.iterator_type
    }

    this._readable = readable(client, params)
    return this._readable
      .pipe(through2.obj(splitRecords))
      .pipe(this.unzipLine())
      .pipe(this.eventStringToJson())
      .pause()
  }


  end() {
    // kinesis readable needs an explicit `close`
    this._readable.close()
    super.end()
  }
}


KinesisStream.options = {
  region: {
    cli: {
      type: 'string',
      default: 'us-east-1',
      alias: 'r',
    },
    interactive: {
      type: 'text',
      initial: 'us-east-1',
      message: 'What AWS region is the Kinesis Stream data in?',
    }
  },
  stream: {
    cli: {
      type: 'string',
    },
    interactive: {
      type: 'text',
      message: 'What is the stream\'s name?',
    }
  },
  iterator_type: {
    cli: {
      type: 'string',
      alias: 'iterator',
    },
    interactive: {
      type: 'select',
      choices: [
        { title: 'At a timestamp', value: 'AT_TIMESTAMP'},
        { title: 'The oldest available data', value: 'TRIM_HORIZON'},
        { title: 'The latest data', value: 'LATEST'},
      ],
      message: 'Where do you want to begin reading from?',
    }
  },
  timestamp: {
    cli: {
      type: 'string',
    },
    interactive: {
      type: prev => prev === "AT_TIMESTAMP" ? "date" : null,
      message: 'What timestamp do you want to start from?',
      format: date => {
        if (!(date instanceof Date)) {
          return Date.parse(date)
        }
        return date
      },
      validate: date => {
        if (!(date instanceof Date)) {
          date = Date.parse(date)
        }
        if (!date || Number.isNaN(date)) return false
        return date > Date.now() ? 'Date cannot be in the future' : true
      },
    }
  }
}

module.exports = KinesisStream
