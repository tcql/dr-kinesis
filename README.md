
⚠️ **Dr. Kinesis is super experimental right now!** ⚠️

It'll be really easy to hurt yourself or get hurt (okay so the "Dr." part isn't 100% official yet).

## the doctor is in!

Dr. Kinesis is here to cure what ails ya... why, I mean data obscurity, of course!

Decode & Filter records from:

- Kinesis Firehose
- Locally copied Firehose data files
- Kinesis streams (TBD)

![](https://github.com/tcql/dr-kinesis/blob/master/assets/example.svg)

## usage

```sh
git clone https://github.com/tcql/dr-kinesis.git
cd dr-kinesis
npm ci
npm start
```

Or, maybe install globally and reach Dr. Kinesis from anywhere (the doctor does house calls!)

```sh
npm install -g
dr-kinesis
```


### filtering

Dr. Kinesis assumes your data is JSON, so filters are applied as JSON. A filter is a strict match of properties from the filter to the event. For example, if you have a filter like:

```json
{"name": "bill", "age": 57}
```

And records like:

```json
{"name": "bill", "age": 100, "favorite_color": "blue"}
{"name": "bill", "age": 57, "favorite_color": "green"}
{"name": "joe", "age": 57, "favorite_color": "yellow"}
```

The filter would only match record #2 because it's the only one that has both a matching name and a matching age



## notes

Currently there are some known issues / incomplete implementations:

- Remote Firehose doesn't recurse through ListObjects to find all child data files. It just does one single call to ListObjects, currently. This means you could miss some data, but honestly Dr. Kinesis is more meant for a snapshot of data than paging through an entire dataset
- Remote Firehose data is assumed to be gzipped
- Kinesis Streams can't use AT_SEQUENCE_NUMBER or similar iterators. This might not be changed in the future
- filters are pretty basic. It would be nice to provide some regex support, case insensitivity, and perhaps allow for multiple filter types
- "Local" firehose data is a single file, previously unzipped
- (partially addressed) The fundamental data you're working with is JSON
- (partially addressed) Data at the top level is JSON-wrapped base64-encoded gzip, like so:
```json
{"data":"a long base64 string", "encoding": "base64", "gzipped": true}
```

Eventually, the Dr. will learn to respect encoding and zipping hints, as well as fully support non-JSON data. Ideally, Dr. Kinesis would provide a couple of parsing options, such as CSV/TSV
