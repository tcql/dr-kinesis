#!/usr/bin/env node

const prompts = require('prompts')
const options = require('./src/options')
const yargs = require('yargs')

const description = "Dr. Kinesis helps you read from AWS Kinesis Streams "
  + "and Firehose Delivery Streams"

yargs
  .options({
    limit: {
      type: 'number',
      default: 0,
      alias: 'l',
    },
    batchSize: {
      type: 'number',
      default: 100,
      alias: 'b',
    },
    stdout: {
      type: 'boolean',
      default: false,
    },
  })
  .command('*', description, () => {}, async argv => {
    const {source} = await prompts({
      type: 'select',
      name: 'source',
      message: 'Where do you want to read data from?',
      initial: 0,
      choices: [
        { title: 'A Kinesis Stream', value: 'kinesis', disabled: false},
        { title: 'A Kinesis Firehose on S3', value: 'firehose', disabled: false },
        { title: 'A locally downloaded Firehose data file', value: 'localfirehose'},
      ]
    }, {
      onCancel: () => {
        console.log('Aborting')
        process.exit()
      }
    })
    const cmd = require(`./src/commands/${source}`)
    cmd.handler(argv)
  })
  .commandDir('./src/commands')
  .version()
  .help()
  .parse()


