const read = require('../../src/read')
const LocalFirehose = require('../../src/sources/LocalFirehose')
const localCommand = require('../../src/commands/localfirehose')

jest.mock('../../src/read')

test('configures cli options', () => {
  expect(localCommand.builder).toEqual({
    location: {
      type: 'string'
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

  await localCommand.handler(input)

  expect(askFn.mock.calls[0][0]).toBe(input)
  expect(readFn.mock.calls[0][0]).toBe(askOutput)
  expect(readFn.mock.calls[0][1] instanceof LocalFirehose).toBe(true)
})
