const prompts = require('prompts')
const {toCli, toInteractive} = require('../options')
const {askWithDefaults, readStream} = require('../read')
const Firehose = require('../sources/Firehose')

const options = {
  region: {
    cli: {
      type: 'string',
      alias: 'r'
    },
    interactive: {
      type: 'text',
      initial: 'us-east-1',
      message: 'What AWS region is the Firehose S3 data in?'
    }
  },
  location: {
    cli: {
      type: 'string'
    },
    interactive: {
      type: 'text',
      message: 'Where on S3 is the Firehose?'
    }
  },
  reverse: {
    cli: {
      type: 'boolean',
    }
  }
}

exports.builder = toCli(options)
exports.description = "Read from a Firehose DeliveryStream on S3"
exports.handler = async (argv) => {
  const input = await askWithDefaults(argv, toInteractive(options))
  await readStream(input, new Firehose(input))
}
