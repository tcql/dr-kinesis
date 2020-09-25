jest.mock('prompts', () => jest.fn())
const prompts = require('prompts')
const {
  defaultOnCancel,
  matchFilter,
  handleBatching
} = require('../src/read')

// TODO: askWithDefaults & readStream

test.concurrent('defaultOnCancel', async () => {
  const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {})
  defaultOnCancel()
  expect(mockExit).toHaveBeenCalled()
})

test.concurrent('matchFilter', async () => {
  expect(matchFilter({a: 2}, {a: 1})).toBe(false)
  expect(matchFilter({a: 1, b: 2}, {a: 1})).toBe(true)
  expect(matchFilter({a: {b: 3}}, {a: {b: 2}})).toBe(false)
  expect(matchFilter({a: {b: 2}, c: 3}, {a: {b: 2}})).toBe(true)
})


test('handleBatching -- quick escapes', async () => {
  // if the count is NOT a multiple of batchSize, batching skips
  expect(await handleBatching(
    {batchSize: 75},
    {},
    74,
    0
  )).toBe(true)
  expect(await handleBatching(
    {batchSize: 75},
    {},
    139,
    0
  )).toBe(true)

  // if batchSize is 0 or empty, batching always skips
  expect(await handleBatching(
    {batchSize: 0},
    {},
    100,
    100
  )).toBe(true)

  // if we're using stdout mode and batchSize % count is 0
  // batching logs matchCount and skips
  const mockLog = jest.spyOn(console, 'error').mockImplementation((...args) => args.join(' '))
  expect(await handleBatching(
    {batchSize: 100, stdout: true},
    {},
    100,
    50
  )).toBe(true)
  expect(mockLog).toHaveBeenCalled()
  expect(mockLog.mock.results[0].value).toBe('Found 50 matching records out of 100 records so far')
  mockLog.mockRestore()
})

test('handleBatching -- log and continue', async () => {
  prompts.mockResolvedValue({continue: true})
  const mockLog = jest.spyOn(console, 'error').mockImplementation((...args) => args.join(' '))
  const stream = {
    pause: jest.fn(),
    resume: jest.fn(),
    destroy: jest.fn()
  }
  expect(await handleBatching(
    {batchSize: 50},
    stream,
    100,
    7
  )).toBe(true)

  // we logged match info
  expect(mockLog).toHaveBeenCalled()
  expect(mockLog.mock.results[0].value).toBe('Found 7 matching records out of 100 records so far')

  // we paused the stream
  expect(stream.pause).toHaveBeenCalled()

  // we asked if the user wanted to continue?
  expect(prompts).toHaveBeenCalled()
  expect(prompts.mock.calls[0][0]).toEqual({
    type: 'confirm',
    name: 'continue',
    message: 'Scan more?',
    initial: true
  })

  // we resumed streaming
  expect(stream.resume).toHaveBeenCalled()

  // we didn't destroy the stream
  expect(stream.destroy.mock.calls.length).toEqual(0)

  mockLog.mockRestore()
  prompts.mockReset()
})

test('handleBatching -- abort', async () => {
  prompts.mockResolvedValue({continue: false})
  const mockLog = jest.spyOn(console, 'error').mockImplementation(() => {})
  const stream = {
    pause: jest.fn(),
    resume: jest.fn(),
    destroy: jest.fn()
  }
  expect(await handleBatching(
    {batchSize: 50},
    stream,
    100,
    7
  )).toBe(false)

  // we did all the same stuff as before,
  expect(mockLog).toHaveBeenCalled()
  expect(stream.pause).toHaveBeenCalled()
  expect(prompts).toHaveBeenCalled()

  // but, the  user didn't want to continue,
  // so we didn't resume,
  expect(stream.resume.mock.calls.length).toEqual(0)
  // and we destoryed the stream
  expect(stream.destroy).toHaveBeenCalled()

  mockLog.mockRestore()
  prompts.mockReset()
})
