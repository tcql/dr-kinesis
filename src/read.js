const prompts = require('prompts')
const through2 = require('through2')
const _ = require('lodash')

// TODO:
// - tons of different concerns here;
//   - input reading?
//   - stream reading?
//   - filtering?
//

function defaultOnCancel() {
  console.log('Aborted prompt')
  process.exit()
}

async function askWithDefaults(argv, questions, onCancel) {
  if (!onCancel && onCancel !== false) {
    onCancel = defaultOnCancel
  }

  // if we're using stdout, allow skipping
  if (argv.stdout) {
    argv.ready = true
    argv.want_filter = argv.want_filter || false
  }

  prompts.override(argv)
  let post_questions = [
    {
      // if filter set on console, skip asking if we want a filter
      type: prev => argv.filter ? null : 'confirm',
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

  let input = await prompts(
    questions.concat(post_questions),
    { onCancel: onCancel }
  )
  if (!input.ready) process.exit()

  return Object.assign(argv, input)
}

function matchFilter (event, filter) {
  if (!filter) return true
  return _.isMatch(event, filter)
}


async function readStream(input, streamWrapper) {
  const stream = await streamWrapper.createStream()
  let count = 0,
    matchedCount = 0

  const ostream = stream.pipe(through2.obj(async (ev, enc, next) => {
    count++

    if (matchFilter(ev, input.filter)) {
      matchedCount++
      // todo, write to stdout
      if (input.stdout) {
        console.log(JSON.stringify(ev))
      } else {
        console.log(ev)
      }
    }

    if (input.limit && count === input.limit) {
      console.error('Aborting; reached configured limit of', input.limit)
      stream.destroy()
      ostream.destroy()
      return false
    }

    let cont = await handleBatching(input, stream, count, matchedCount)
    if (cont) next()
  }))
  .on('close', () => {
    streamWrapper.closeStream()
    process.exit()
  })
  .on('end', () => {
    console.error('Reached end of stream. Displayed', matchedCount, 'matching records of', count, 'total records')
  })

  stream.resume()
}


async function handleBatching(input, stream, count, matchedCount) {
  if (!input.batchSize) return true

  if (count % input.batchSize === 0) {
    console.error('Found', matchedCount, 'matching records out of', count, 'records so far')

    if (input.stdout) return true

    stream.pause()

    const response = await prompts({
      type: 'confirm',
      name: 'continue',
      message: 'Scan more?',
      initial: true
    }, { onCancel: defaultOnCancel })

    if (response.continue) {
      stream.resume()
      return true
    } else {
      stream.destroy()
      return false
    }
  }
  return true
}


module.exports = {
  defaultOnCancel,
  askWithDefaults,
  readStream,
  handleBatching,
  matchFilter,
}

