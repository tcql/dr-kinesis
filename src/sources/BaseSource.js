const prompts = require('prompts')
const through2 = require('through2')
const zlib = require('zlib')

class BaseSource {
  constructor() {
    this.batchSize = 100
  }

  onPromptCancel() {
    console.log('Aborted prompt')
    process.exit()
  }

  async ask(questions) {
    let post_questions = [
      {
        type: 'confirm',
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

    this.input = await prompts(
      questions.concat(post_questions),
      { onCancel: this.onPromptCancel }
    )
  }

  matchFilter(event, filter) {
    if (!filter) return true
    return Object.keys(filter).reduce((acc, f) => acc && event[f] == filter[f], true)
  }

  validInput(inp = null) {
    if (!inp) inp = this.input
    if (Object.keys(inp).length === 0) {
      return false
    }
    return true
  }

  unzipLine() {
    // can't be an arrow function because "this" is the through2
    // instance, not the BaseSource instance
    return through2.obj(function (line, encoding, next) {
      let data = line
      try {
        data = JSON.parse(line).data
        if (!data) data = line
      } catch {}

      try {
        data = zlib.gunzipSync(Buffer.from(data, 'base64'))
      } catch {}

      next(null, data)
    })
  }

  eventStringToJson(line, encoding, next) {
    return through2.obj(function (line, encoding, next) {
      let events = line
      try {
        events = JSON.parse(line)
      } catch {}

      if (Array.isArray(events)) {
        events.forEach(e => this.push(e))
      } else {
        this.push(events)
      }
      next()
    })
  }

  async readStream(stream, filter) {
    let count = 0
    let matchedCount = 0

    this.stream = stream
    stream.on('data', async ev => {
      count++

      if (this.matchFilter(ev, filter)) {
        matchedCount++
        console.log(ev)
      }

      if (count % this.batchSize === 0) {
        console.log('Found', matchedCount, 'matching records out of', count, 'records so far')
        stream.pause()
        const response = await prompts({
          type: 'confirm',
          name: 'continue',
          message: 'Scan more?',
          initial: true
        }, { onCancel: this.onPromptCancel })
        if (response.continue) {
          stream.resume()
        } else {
          this.end()
        }
      }
    })
    stream.on('end', () => {
      console.log('Reached end of stream. Displayed', matchedCount, 'matching records of', count, 'total records')
    })
    stream.resume()
  }

  async start() {
    const stream = this.createStream()
    this.readStream(stream, this.input.filter)
  }


  end() {
    this.stream.end()
  }
}

module.exports = BaseSource
