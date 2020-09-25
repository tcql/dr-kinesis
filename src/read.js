const prompts = require('prompts')
const through2 = require('through2')
const jexl = require('jexl')
const {applyFilter, parseFilter} = require('./filter')

// TODO:
// - several different concerns here;
//   - input reading?
//   - stream reading?

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
      message: 'Enter a filter'
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

async function readStream(input, streamWrapper) {
  const stream = await streamWrapper.createStream()
  const filter = parseFilter(input.filter)
  let count = 0,
    matchedCount = 0

  const ostream = stream.pipe(through2.obj(async (ev, enc, next) => {
    count++

    let filtered = applyFilter(ev, filter)
    if (filtered) {
      matchedCount++
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

  stream.on('end', () => {
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
}

