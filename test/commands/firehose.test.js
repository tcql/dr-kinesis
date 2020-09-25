const read = require('../../src/read')
const Firehose = require('../../src/sources/Firehose')
const firehoseCommand = require('../../src/commands/firehose')

jest.mock('../../src/read')

test('configures cli options', () => {
  expect(firehoseCommand.builder).toEqual({
    region: {
      type: 'string',
      alias: 'r'
    },
    location: {
      type: 'string'
    },
    reverse: {
      type: 'boolean'
    }
  })
})


test('handler', async () => {
  const input = {
    a: 1,
    b: 2
  }
  const askOutput = {
    a: 1,
    b: 2,
    c: 3
  }
  const askFn = read.askWithDefaults
  const readFn = read.readStream
  askFn.mockResolvedValue(askOutput)
  readFn.mockResolvedValue({})

  await firehoseCommand.handler(input)

  expect(askFn.mock.calls[0][0]).toBe(input)
  expect(readFn.mock.calls[0][0]).toBe(askOutput)
  expect(readFn.mock.calls[0][1] instanceof Firehose).toBe(true)
})
