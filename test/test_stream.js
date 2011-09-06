var ps = require('protobuf-stream');

var _ = require('underscore');

var util = require('util');
var inspect = util.inspect;
var assert = require('assert');

var Stream = require('stream').Stream;
var Buffer = require('buffer').Buffer;

// Helpers
var Pipe = require('./helper').Pipe;
var BufferedPipe = require('./helper').BufferedPipe;

var mock = require(__dirname + '/../lib/minimock').mock;
var verify = require(__dirname + '/../lib/minimock').verify;

// Load schema
var fs = require('fs');
var Schema = require('protobuf').Schema;
var TestSchema = new Schema(fs.readFileSync(__dirname + '/test.desc'));
var TestMessage = TestSchema['node_protobuf_stream.TestMessage'];


exports.shouldCreateStreamInstance = function(test){
	// given

	// when
	var stream = new ps.Stream(null, new Stream());

	// then
	test.notEqual(stream, null);
	test.done();
};

exports.shouldSendRawMessage = function(test){
	// given
	var message = new Buffer('Hello');
	var dataStream = mock('write', 'on');
	var stream = new ps.Stream(null, dataStream, 4);

	// when
	stream.send(message);

	// then
	verify(dataStream).write(function(data){
		test.equal(data.length, 4 + message.length);
	});
	test.done();
};

exports.shouldValidateLengthBytesArgument = function(test){
	// given
	var message = new Buffer('Hello');
	var dataStream = mock('write', 'on');
	var stream = new ps.Stream(null, dataStream, 20);

	// when
	test.throws(function(){
		stream.send(message);
	});
	
	// then
	test.done();
};

exports.shouldReceiveMessage = function(test){
	// given
	var message = {'hello' : 'World'};
	var dataStream = new Pipe();

	var stream = new ps.Stream(TestMessage, dataStream);
	stream.on('message', function(parsed_message){
		test.equal(inspect(parsed_message), inspect(message));
	});

	// when
	stream.send(message);

	// then
	test.done();
}

exports.shouldParseStream = function(test){
	// given	
	var messages = [];
	var messages_to_send = [{'hello' : 'World'}, {'hello' : 'Space'}];
	var dataStream = new BufferedPipe();

	var stream = new ps.Stream(TestMessage, dataStream);	
	stream.on('message', function(parsed_message){
		messages.push(parsed_message);
	});

	// when
	_.each(messages_to_send, function(message){
		stream.send(message);
	});
	dataStream.flush();

	// then
	for(var i in messages){
		test.equal(inspect(messages[i]), inspect(messages_to_send[i]));	
	};
	
	test.done();
}