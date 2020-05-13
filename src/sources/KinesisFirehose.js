const AWS = require('aws-sdk')
const prompts = require('prompts')
const streamArray = require('stream-array')
const zlib = require('zlib')
const through2 = require('through2')
const split = require('binary-split')


function downloadFile(s3) {
  return (file, enc, next) => {
    s3.getObject(file, (e, r) => {
      if (e) return next(e)
      return next(null, r.Body)
    })
  }
}

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


function createStream(s3, s3files) {
  return streamArray(s3files)
    .pipe(through2.obj(downloadFile(s3)))
    .pipe(zlib.createGunzip())
    .pipe(split())
    .pipe(through2.obj(unzipLine))
    .pipe(through2.obj(eventStringToJson))
    .pause()
}

class KinesisFirehose {
  constructor() {
    this.batchSize = 100
  }

  async gatherInput() {
    const questions = [
      // TODO: make this a select list of regions
      {
        type: 'text',
        name: 'region',
        initial: 'us-east-1',
        message: 'What AWS region is the Firehose S3 data in?'
      },
      {
        type: 'text',
        name: 'location',
        message: 'Where on S3 is the Firehose?'
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

    this.input = await prompts(questions)
  }

  splitS3Path(s3path) {
    let parts = s3path.replace('s3://', '').split('/')
    let bucket = parts[0]
    let prefix = parts.slice(1).join('/')
    return {bucket, prefix}
  }

  async start() {
    let count = 0
    let matchedCount = 0

    this.S3 = new AWS.S3({region: this.input.region})
    const {bucket, prefix} = this.splitS3Path(this.input.location)

    // TODO: validate that we've sufficiently filtered down the firehose path to only include a given day/hour instead of just pointing at the entire firehose
    // Also, allow recursively listing so we can find all the files in the supplied path instead of just a few
    const response = await this.S3.listObjectsV2({Bucket: bucket, Prefix: prefix}).promise()
    this._s3Files = response.Contents.map(r => ({Bucket: bucket, Key: r.Key}))

    const stream = createStream(this.S3, this._s3Files)
    stream.on('data', async ev => {
      count++

      if (matchEvent(ev, this.input.filter)) {
        matchedCount++
        console.log(ev)
      }

      if (count % this.batchSize === 0) {
        console.log('Found', matchedCount, 'matching records out of', count, 'records so far')
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
    stream.on('end', () => {
      console.log('Reached end of stream. Displayed', matchedCount, 'matching records of', count, 'total records')
    })
    stream.resume()
  }
}

module.exports = KinesisFirehose
