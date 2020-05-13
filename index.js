const prompts = require('prompts')
const sources = require('./src/sources.js')

async function main() {
  const {source} = await prompts({
    type: 'select',
    name: 'source',
    message: 'Where do you want to read data from?',
    initial: 2,
    choices: [
      { title: 'A Kinesis Stream', value: 'kinesis', disabled: true},
      { title: 'A Kinesis Firehose on S3', value: 'firehose', disabled: true },
      { title: 'A locally downloaded Firehose data file', value: 'local_firehose'},
    ]
  })

  const handlerClass = sources[source]
  const handler = new handlerClass()

  await handler.gatherInput()
  await handler.start()
}

main()


