const AWS = require('aws-sdk')
const fromArray = require('from2-array')
const zlib = require('zlib')
const through2 = require('through2')
const split = require('binary-split')
const BaseSource = require('./BaseSource')

function downloadFile(s3) {
  return (file, enc, next) => {
    s3.getObject(file, (e, r) => {
      if (e) return next(e)
      return next(null, r.Body)
    })
  }
}

class KinesisFirehose extends BaseSource{
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
    ]

    await this.ask(questions)
  }


  splitS3Path(s3path) {
    let parts = s3path.replace('s3://', '').split('/')
    let bucket = parts[0]
    let prefix = parts.slice(1).join('/')
    return {bucket, prefix}
  }


  async start() {
    this.S3 = new AWS.S3({region: this.input.region})
    const {bucket, prefix} = this.splitS3Path(this.input.location)

    // TODO: validate that we've sufficiently filtered down the firehose path to only include a given day/hour instead of just pointing at the entire firehose
    // Also, allow recursively listing so we can find all the files in the supplied path instead of just a few
    const response = await this.S3.listObjectsV2({Bucket: bucket, Prefix: prefix}).promise()
    this._s3_files = response.Contents.map(r => ({Bucket: bucket, Key: r.Key}))

    await super.start()
  }


  createStream() {
    return fromArray.obj(this._s3_files)
      .pipe(through2.obj(downloadFile(this.S3)))
      .pipe(zlib.createGunzip())
      .pipe(split())
      .pipe(this.unzipLine())
      .pipe(this.eventStringToJson())
      .pause()
  }
}

module.exports = KinesisFirehose
