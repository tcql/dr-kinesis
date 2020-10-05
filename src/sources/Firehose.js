const zlib = require('zlib')
const AWS = require('aws-sdk')
const through2 = require('through2')
const split = require('binary-split')
const fromArray = require('from2-array')
const BaseStream = require('./BaseStream')

function downloadFile(s3) {
  return (file, enc, next) => {
    s3.getObject(file, (e, r) => {
      if (e) return next(e)
      return next(null, r.Body)
    })
  }
}

function splitS3Path(s3path) {
  let parts = s3path.replace('s3://', '').split('/')
  let bucket = parts[0]
  let prefix = parts.slice(1).join('/')
  return {bucket, prefix}
}


class Firehose extends BaseStream {
  async createStream() {
    const s3Client = new AWS.S3({region: this.input.region})
    const {bucket, prefix} = splitS3Path(this.input.location)

    // TODO: validate that we've sufficiently filtered down the firehose path to only include a given day/hour instead of just pointing at the entire firehose
    // Also, allow recursively listing so we can find all the files in the supplied path instead of just a few
    const response = await s3Client.listObjectsV2({Bucket: bucket, Prefix: prefix}).promise()
    const s3Files = response.Contents.map(r => ({Bucket: bucket, Key: r.Key}))

    if (this.input.reverse) {
      s3Files.reverse()
    }

    if (s3Files.length === 0) {
      console.log(`No files found at ${this.input.location}`)
      process.exit()
    }

    this.stream = fromArray.obj(s3Files)
      .pipe(through2.obj(downloadFile(s3Client)))
      .pipe(zlib.createGunzip())
      .pipe(split())
      .pipe(this.unzipLine())
      .pipe(this.eventStringToJson())
      .pause()

    return this.stream
  }
}


module.exports = Firehose
