const AWS = require('aws-sdk')
const prompts = require('prompts')
const streamArray = require('stream-array')
const zlib = require('zlib')
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
  async gatherInput() {
    const questions = [
      // TODO: make this a select list of regions
      {
        type: 'text',
        name: 'region',
        initial: 'us-east-1',
        message: 'What AWS region is the Kinesis Stream data in?'
      },
      {
        type: 'text',
        name: 'stream_name',
        message: 'What is the stream\'s name?'
      },
      {
        type: 'select',
        name: 'iterator_type',
        choices: [
          { title: 'At a timestamp', value: 'AT_TIMESTAMP'},
          { title: 'The oldest available data', value: 'TRIM_HORIZON'},
          { title: 'The latest data', value: 'LATEST'},
          // { title: 'At a particular Kinesis sequence number', value: 'AT_SEQUENCE_NUMBER', disabled: true}
        ],
        message: 'Where do you want to begin reading from?'
      },
      {
        type: prev => prev === "AT_TIMESTAMP" ? "date" : null,
        name: 'timestamp',
        message: 'What timestamp do you want to start from?',
        validate: date => date > Date.now() ? 'Not in the future' : true
      },
      // TODO: these are copy/paste from the LocalFirehose class. generalize
      {
        type: 'confirm',
        name: 'want_filter',
        message: 'Do you want to filter the data?'
      },
      {
        type: prev => prev ? 'text' : null,
        name: 'filter',
        message: 'Enter a JSON filter. Events will be discarded unless they contain the properties and values in the filter',
        validate: value => {
          try {
            JSON.parse(value)
            return true
          } catch (e) {
            return "Filter must be valid json"
          }
        },
        format: value => JSON.parse(value)
      },
      {
        type: 'confirm',
        name: 'ready',
        initial: true,
        message: 'Ready to begin streaming?'
      }
    ]

    await this.ask(questions)
  }

  createStream() {
    let input = this.input
    const client = new AWS.Kinesis({
      region: input.region,
      params: { StreamName: input.stream_name }
    })
    const params = {
      limit: 100 // TODO: configure
    }
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
    // kinesis readable wants its own close
    this._readable.close()
    this.stream.end()
  }
}

module.exports = KinesisStream
