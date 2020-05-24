const fs = require('fs')
const path = require('path')
const prompts = require('prompts')
const {toCli, toInteractive} = require('../options')
const {askWithDefaults, readStream} = require('../read')
const LocalFirehose = require('../sources/LocalFirehose')

const options = {
  location: {
    cli: {
      type: 'string'
    },
    interactive: {
      type: 'text',
      message: 'Where is the Firehose data located?',
      validate: value => fs.existsSync(path.resolve(value)) ? true : "Location must be a valid file path",
      format: value => path.resolve(value)
    }
  }
}

exports.builder = toCli(options)
exports.description = "Read from locally downloaded Firehose data"
exports.handler = async (argv) => {
  const input = await askWithDefaults(argv, toInteractive(options))
  await readStream(input, new LocalFirehose(input))
}
