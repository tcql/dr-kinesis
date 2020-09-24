const read = require('../../src/read')
const KinesisStream = require('../../src/sources/KinesisStream')
const kinesisCommand = require('../../src/commands/kinesis')

jest.mock('../../src/read')

test('configures cli options', () => {
  expect(kinesisCommand.builder).toEqual({
    region: {
      type: 'string',
      alias: 'r'
    },
    stream: {
      type: 'string'
    },
    iterator_type: {
      type: 'string',
      alias: 'iterator',
      choices: ['AT_TIMESTAMP', 'TRIM_HORIZON', 'LATEST']
    },
    timestamp: {
      type: 'string',
      coerce: expect.any(Function)
    },
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

  await kinesisCommand.handler(input)

  expect(askFn.mock.calls[0][0]).toBe(input)
  expect(readFn.mock.calls[0][0]).toBe(askOutput)
  expect(readFn.mock.calls[0][1] instanceof KinesisStream).toBe(true)
})
