const fs = require('fs')
const path = require('path')
const prompts = require('prompts')
const {toCli, toInteractive} = require('../options')
const {askWithDefaults, readStream} = require('../read')
const LocalFirehose = require('../sources/LocalFirehose')
const glob = require('glob')
const os = require('os')

// const startingFiles = glob.sync(`${process.cwd()}/*`).map(f => {return {title: f}})
// console.log(startingFiles)

const options = {
  location: {
    cli: {
      type: 'string'
    },
    interactive: {
      type: 'autocomplete',
      message: 'Where is the Firehose data located?',
      limit: 5,
      initial: './',
      choices: [1,2,3,4,5],
      validate: value => fs.existsSync(path.resolve(value)) ? true : "Location must be a valid file path",
      suggest: async val => {
        val = val.replace("~", os.homedir())

        return glob.sync(`${val}*`)
          .map(f => {return {title: f}})
      },
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
