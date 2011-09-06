var ps = require('protobuf-stream');

var _ = require('underscore');

var util = require('util');
var inspect = util.inspect;
var assert = require('assert');

var EventEmitter = require('events').EventEmitter;
var Stream = require('stream').Stream;
var Buffer = require('buffer').Buffer;

var mock = require('../lib/minimock').mock;
var verify = require('../lib/minimock').verify;

// Load schema
var fs = require('fs');
var Schema = require('protobuf').Schema;
var TestSchema = new Schema(fs.readFileSync('./test.desc'));
var TestMessage = TestSchema['node_protobuf_stream.TestMessage'];

// Small utility class
var Pipe = function(){ EventEmitter.call(this); }
util.inherits(Pipe, EventEmitter);

Pipe.prototype.write = function(buffer){
	this.emit('data', buffer);
}

var BufferedPipe = function(){ 
	EventEmitter.call(this); 
	this.buffer = new Buffer(0);
}
util.inherits(BufferedPipe, EventEmitter);

BufferedPipe.prototype.write = function(data){
	var newBuffer = new Buffer(this.buffer.length + data.length);

    this.buffer.copy(newBuffer, 0, 0, this.buffer.length);
    data.copy(newBuffer, this.buffer.length, 0, data.length);

    this.buffer = newBuffer;
}

BufferedPipe.prototype.flush = function(){
	this.emit('data', this.buffer);
	this.buffer = new Buffer(0);
}

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