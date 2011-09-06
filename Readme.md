
# protobuf-stream

Adds simple message streaming functionality to node version of protobuf module, which can be cloned from https://github.com/dejw/node-protobuf.

It works with node 0.5.5 since latest `node-protobuf` works with that version.

## Installation

Install `node-protobuf` from instructions given at https://github.com/dejw/node-protobuf, and simply type:

    npm install node-protobuf-stream

## Usage

Contents of `test.proto`:

    package hello;

    message TestMessage {
        optional string hello = 1;
    }

Protocol compilation:

    protoc test.proto -o test.desc

Contents of `server.js`:

~~~~~ javascript
var net = require('net');
var protostream = require('protobuf-stream');

// Load schema
var fs = require('fs');
var Schema = require('protobuf').Schema;
var TestSchema = new Schema(fs.readFileSync('test.desc'));
var TestMessage = TestSchema['hello.TestMessage'];

var server = net.createServer(function(connection){
    var transport = new protostream.Stream(TestMessage, connection);
    transport.on('message', function(message){
        console.log(message);
    });
});

console.log("Listening on port 1234...");
server.listen(1234, 'localhost');
~~~~~

Generate Python code:

    protoc test.proto --python_out=.

Contents of `client.py`:

~~~~~ python
#!/usr/bin/env python
# -*- coding: utf-8 -*-

from test_pb2 import TestMessage
import socket
import struct

def send(stream, message):
    serialized = message.SerializeToString()
    stream.send(struct.pack('!h', len(serialized)))
    stream.send(serialized)

message = TestMessage()
message.hello = "World!"

stream = socket.create_connection(('localhost', 1234))
send(stream, message)
send(stream, message)

message.hello = "Space!"
send(stream, message)
~~~~~

Start:

    node server.js &
    python client.py

Desired output:

    Listening on port 1234...
    { hello: 'World!' }
    { hello: 'World!' }
    { hello: 'Space!' }

## License 

(The MIT License)

Copyright (c) 2011 Dawid Fatyga &lt;dawid.fatyga@gmail.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.