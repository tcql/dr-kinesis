
⚠️ **Dr. Kinesis is super experimental right now!** ⚠️

It'll be really easy to hurt yourself or get hurt (okay so the "Dr." part isn't 100% official yet).

## the doctor is in!

Dr. Kinesis is here to cure what ails ya... why, I mean data obscurity, of course!

Decode & Filter records from:

- Kinesis streams
- Kinesis Firehose
- Locally copied Firehose data files


![](https://github.com/tcql/dr-kinesis/raw/main/assets/example.svg)



## installation

### from npm

```
npm install -g dr-kinesis
```



### from source

```sh
git clone https://github.com/tcql/dr-kinesis.git
cd dr-kinesis
npm ci
npm start
```

Or, maybe install globally and reach Dr. Kinesis from anywhere (the doctor does house calls!)

```sh
npm link
dr-kinesis
```



## usage

Dr. Kinesis features an interactive mode that will prompt you through the process of reading from a stream or firehose. Just run `dr-kinesis` to get started!

All interactive features of Dr. Kinesis can also be supplied via CLI options, allowing you to skip prompts. For example, you could do the following to select reading from an S3 firehose and skip the questions about S3 location and region:

```sh
dr-kinesis firehose --location s3://my/firehose/path -r us-east-1
```

See `dr-kinesis --help` for more information.



### commands

Currently Dr.Kinesis supports 3 commands:

- `dr-kinesis kinesis` - read from a Kinesis Data Stream
- `dr-kinesis firehose` - read from  a Firehose Delivery Stream on S3
- `dr-kinesis localfirehose` - read data from a local file

Each command has its own CLI options and prompts. Try `dr-kinesis <command> --help` to see available options



### global options

Certain options are not available in interactive mode and can only be set via flags when you invoke Dr. Kinesis

- `-b, --batchSize` controls how many records to scan in each batch
- `-l, --limit` controls the max number of records to scan before aborting
- `--stdout` modifies the doctor's behavior & output to facilitate using dr-kinesis to pipe data out to other programs:
  - `--limit` is required in stdout mode
  - initial "Ready?" prompt is suppressed
  - batch continuation prompts are suppressed
  - output records JSON.stringify-ed, resulting in line-delimited JSON; perfect for passing in to `jq`

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
