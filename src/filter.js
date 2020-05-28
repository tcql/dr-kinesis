const parse = require('csv-parse/lib/sync')
const jexl = require('jexl')
const _zip = require('lodash/zip')
const _zipObject = require('lodash/zipObject')

function importLodashCategories(categories) {
  for (let cat of categories) {
    let mod = require(`lodash/${cat}`)
    importLodash(mod)
  }
}


// TODO: figure out which lodash methods need to
// have some arguments flipped
function importLodash(category) {
  for (let key in category) {
    jexl.addTransform(`_${key}`, category[key])
  }
}


function unpack(context) {
  if (Array.isArray(context)) {
    items = context
    context = {items: items}
    items.forEach((e, i) => context[`$${i}`] = e)
  } else if (typeof context === 'string' || Buffer.isBuffer(context)) {
    context = {'$0': context.toString()}
  }
  return context
}


function initializeJexl(lodash_categories) {
  // TODO: get rid of this zip implementation and create
  // auto-flipped version from lodash imports
  jexl.addTransform('zip', (vals, keys) => {
    return _zip(keys, vals)
  })

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

  importLodashCategories(lodash_categories)
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
  importLodashCategories,
  initializeJexl,
}
