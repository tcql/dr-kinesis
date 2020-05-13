const prompts = require('prompts')

class BaseSource {
  constructor() {
    this.batchSize = 100
  }

  matchFilter(event, filter) {
    if (!filter) return true
    return Object.keys(filter).reduce((acc, f) => acc && event[f] == filter[f], true)
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
        })
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

  end() {
    this.stream.end()
  }
}

module.exports = BaseSource
