const fs = require('fs')
const path = require('path')
const zlib = require('zlib')
const prompts = require('prompts')
const through2 = require('through2')
const split = require('binary-split')

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

function matchEvent(event, filter) {
  if (!filter) return true
  return Object.keys(filter).reduce((acc, f) => acc && event[f] == filter[f], true)
}

function createStream(location) {
  return fs.createReadStream(location, 'utf-8')
    .pipe(split())
    .pipe(through2.obj(unzipLine))
    .pipe(through2.obj(eventStringToJson))
    .pause()
}

class LocalFirehose {
  constructor() {
    this.batchSize = 100
  }

  async start() {
    console.log("starting")
    let count = 0
    let matchedCount = 0
    const stream = createStream(path.resolve(this.input.location))
    this.stream = stream
    stream.on('data', async ev => {
      count++

      if (matchEvent(ev, this.input.filter)) {
        matchedCount++
        console.log(ev)
      }

      if (count % this.batchSize === 0) {
        console.log('Found', matchedCount, 'matching out of', count, 'records so far')
        stream.pause()
        const response = await prompts({
          type: 'confirm',
          name: 'continue',
          message: 'Scan more?',
          initial: true
        })
        if (response.continue) {
          stream.resume()
        } else {
          this.end()
        }
      }
    })
    stream.resume()
  }

  end() {
    this.stream.end()
  }

  async gatherInput() {
    const questions = [
      {
        type: 'text',
        name: 'location',
        message: 'Where is the Firehose data located?',
        validate: value => fs.existsSync(path.resolve(value)) ? true : "Location must be a valid file path",
        format: value => path.resolve(value)
      },
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
    // prompts.inject(['./api-events-sample', true, '{"event": "visit"}', true])
    this.input = await prompts(questions)
    // prompts.inject([])
    console.log(this.input)
  }
}


module.exports = LocalFirehose
