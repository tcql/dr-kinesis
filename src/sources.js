module.exports = {
  'local_firehose': require('./sources/LocalFirehose'),
  'firehose': require('./sources/KinesisFirehose'),
}
