

module.exports.programOptions = {
  limit: {
    cli: {
      type: 'number',
      default: 0,
      alias: 'l',
    }
  },
  batchSize: {
    cli: {
      type: 'number',
      default: 100,
      alias: 'b',
    }
  },
  stdout: {
    cli: {
      type: 'boolean',
      default: false,
      implies: ['l']
    }
  },
}


module.exports.toCli = (options) => {
  let args = {}

  for (let key in options) {
    let elem = options[key]
    if (!elem.cli) continue

    args[key] = elem.cli
  }
  return args
}


module.exports.toInteractive = (options) => {
  let questions = []

  for (let key in options) {
    let elem = options[key]
    if (!elem.interactive) continue

    questions.push(Object.assign({name: key}, elem.interactive))
  }
  return questions
}
