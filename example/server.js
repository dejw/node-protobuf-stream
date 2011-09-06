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