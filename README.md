
⚠️ Dr. Kinesis is super experimental right now! ⚠️

It'll be really easy to hurt yourself or get hurt (okay so the "Dr." part isn't 100% official yet).

## the doctor is in!

Dr. Kinesis is here to cure what ails ya... why, I mean data obscurity, of course!

Decode & Filter records from:

- Kinesis Firehose
- Locally copied Firehose data files
- Kinesis streams (TBD)

## usage

```sh
git clone https://github.com/tcql/dr-kinesis.git
cd dr-kinesis
npm ci
npm start
```

## notes

Currently there are some crucial assumptions that Dr. Kinesis works with:

- The fundamental data you're working with is JSON
- Data at the top level is JSON-wrapped base64-encoded gzip, like so:
```json
{"data":"a long base64 string", "encoding": "base64", "gzipped": true}
```

Eventually, the Dr. will learn to respect encoding and zipping hints, as well as support non-JSON data
