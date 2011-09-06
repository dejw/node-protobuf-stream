var ps = require('protobuf-stream');

var assert = require('assert');
var Stream = require('stream').Stream;
var Buffer = require('buffer').Buffer;

var mock = require('../lib/minimock').mock;
var verify = require('../lib/minimock').verify;

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