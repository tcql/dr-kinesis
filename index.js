#!/usr/bin/env node

const prompts = require('prompts')
// const sources = require('./src/sources.js')
const options = require('./src/options')
const yargs = require('yargs')

const argv = yargs
  .options(options.toCli(options.programOptions))
  .commandDir('./src/commands')
  .help()
  .argv


// prompts.override(yargProgram.argv)

// async function main() {
//   const {source} = await prompts({
//     type: 'select',
//     name: 'source',
//     message: 'Where do you want to read data from?',
//     initial: 0,
//     choices: [
//       { title: 'A Kinesis Stream', value: 'kinesis', disabled: false},
//       { title: 'A Kinesis Firehose on S3', value: 'firehose', disabled: false },
//       { title: 'A locally downloaded Firehose data file', value: 'local_firehose'},
//     ]
//   }, {
//     onCancel: () => {
//       console.log('Aborting')
//       process.exit()
//     }
//   })

//   const handlerClass = sources[source]
//   const handler = new handlerClass(
//     argv.batchSize,
//     argv.stdout,
//     argv.limit
//   )

//   const innerArgv = yargProgram.options(options.toCli(handler.getOptions())).argv
//   prompts.override(argv)
//   await handler.ask()
//   if (!handler.validInput()) {
//     return process.exit()
//   }
//   await handler.start()
// }

async function main() {

}

main()


