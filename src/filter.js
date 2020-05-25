const parse = require('csv-parse/lib/sync')
const jexl = require('jexl')
const _zip = require('lodash/zip')

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
  jexl.addTransform('csv', (val, unwrap=true) => {
    let csv = parse(val)
    if (!unwrap) return unpack(csv)
    return unpack(csv[0])
  })
  jexl.addTransform('split', (val, char) => val.split(char))
  jexl.addTransform('unpack', unpack)

  importLodashCategories(lodash_categories)
}


function applyFilter(event, filter) {
  if (!filter) return event

  event = unpack(event)
  return jexl.evalSync(filter, event)
}


module.exports = {
  unpack,
  applyFilter,
  importLodashCategories,
  initializeJexl,
}
