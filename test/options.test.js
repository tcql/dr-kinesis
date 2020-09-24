const {toCli, toInteractive} = require('../src/options')

test.concurrent('toCli -- generates cli config for options with only cli spec', async () => {
  let opts = {
    file: {
      cli: {
        type: "string",
        alias: "f",
        default: "./local/file",
      }
    }
  }
  expect(toCli(opts)).toEqual({
    file: {
      type: "string",
      alias: "f",
      default: "./local/file",
    }
  })
})

test.concurrent('toCli -- generates cli config for options with both interactive and cli spec', async () => {
  let opts = {
    file: {
      cli: {
        type: "string",
        alias: "f",
        default: "./local/file",
      },
      interactive: {
        type: "text",
        message: "Where is the file located?",
      }
    }
  }
  expect(toCli(opts)).toEqual({
    file: {
      type: "string",
      alias: "f",
      default: "./local/file",
    }
  })
})

test.concurrent('toCli -- does not generate cli config for options missing cli spec', async () => {
  let opts = {
    file: {
      interactive: {
        type: "text",
        message: "Where is the file located?",
      }
    }
  }
  expect(toCli(opts)).toEqual({})
})

test.concurrent('toInteractive -- generates prompts config for options with only interactive spec', async () => {
  let opts = {
    file: {
      interactive: {
        type: "text",
        message: "Where is the file located?",
      }
    }
  }
  expect(toInteractive(opts)).toEqual([
    {
      type: "text",
      name: "file",
      message: "Where is the file located?"
    }
  ])
})

test.concurrent('toInteractive -- generates prompts config for options with both interactive and cli spec', async () => {
  let opts = {
    file: {
      cli: {
        type: "string",
        alias: "f",
        default: "./local/file",
      },
      interactive: {
        type: "text",
        message: "Where is the file located?",
      }
    }
  }
  expect(toInteractive(opts)).toEqual([
    {
      type: "text",
      name: "file",
      message: "Where is the file located?"
    }
  ])
})

test.concurrent('toInteractive -- does not generate prompts config for options missing interactive spec', async () => {
  let opts = {
    cli: {
      type: "string",
      alias: "f",
      default: "./local/file",
    },
  }
  expect(toInteractive(opts)).toEqual([])
})

