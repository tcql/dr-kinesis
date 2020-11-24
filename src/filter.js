const parse = require('csv-parse/lib/sync')
const jexl = require('jexl')
const _zipObject = require('lodash/zipObject')

function unpack(context) {
  if (Array.isArray(context)) {
    items = context
    context = {$items: items}
    items.forEach((e, i) => context[`$${i}`] = e)
  } else if (typeof context === 'string' || Buffer.isBuffer(context)) {
    context = {'$0': context.toString()}
  }
  return context
}


function initializeJexl() {
  // TODO: more formats?
  jexl.addTransform('csv', (val, headers=[], unwrap=true) => {
    let csv = parse(val).filter(l => l)

    if (headers && headers.length > 0) {
      csv = csv.map(l => _zipObject(headers, l))
    }

    if (!unwrap) return csv
    return csv[0]
  })
  jexl.addTransform('split', (val, char) => val.split(char))
  jexl.addTransform('unpack', unpack)
}

function applyFilter(event, filter) {
  if (!filter) return event

  event = unpack(event)
  return filter.evalSync(event)
}

function parseFilter(filter) {
  if (!filter) return false
  return jexl.compile(filter)
}


module.exports = {
  unpack,
  parseFilter,
  applyFilter,
  initializeJexl,
}
