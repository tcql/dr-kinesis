const {toCli, toInteractive} = require('../options')
const {askWithDefaults, readStream} = require('../read')
const prompts = require('prompts')
const KinesisStream = require('../sources/KinesisStream')

const options = {
  region: {
    cli: {
      type: 'string',
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
      choices: ['AT_TIMESTAMP', 'TRIM_HORIZON', 'LATEST'],
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

exports.describe = "Read records from a Kinesis Stream"

exports.builder = toCli(options)

exports.handler = async (argv) => {
  prompts.override(argv)
  let input = await askWithDefaults(argv, toInteractive(options))
  await readStream(input, new KinesisStream(input))
}
