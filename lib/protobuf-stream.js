
/*!
 * protobuf-stream
 * Copyright(c) 2011 Dawid Fatyga <dawid.fatyga@gmail.com>
 * MIT Licensed
 */

/**
 * Library version.
 */

exports.version = '0.0.3';

var EventEmitter = require('events').EventEmitter;
var util = require('util');
var assert = require('assert');
var Buffer = require('buffer').Buffer;

/**
 * Provides simple message streaming functionality.
 * 
 * Assumes that instances of given message class are sent
 * in stream preceded by its length (length_field_bytes bytes long),
 * which should be
 *
 * Emits 'message' event when message is successfully parsed.
 *
 * Argument length_field_bytes is 2 by default (valid values are 1, 2 or 4)
 *
 * Note that it assumes big endian byte order.
 */
var Stream = function(message, stream, length_field_bytes){
	var self = this;

	self.message_length = null;
	self.buffer = null;
	self.message_class = message;

	EventEmitter.call(self);

	/* Helper functions */
	var isAvailable = function(data, length, offset){
		return data.length >= (length + offset);
	};

	var readLength;
	var writeLength;

	if(length_field_bytes === 1) {
		readLength = function (data, offset) {
			return data.readUInt8(offset);
		};
		writeLength = function(data, length) {
			return data.writeUInt8(length, 0);
		};
	} else if(length_field_bytes === 2) {
		readLength = function (data, offset) {
			return data.readUInt16BE(offset);
		};
		writeLength = function(data, length) {
			return data.writeUInt16BE(length, 0);
		};
	} else if(length_field_bytes === 4) {
		readLength = function (data, offset) {
			return data.readUInt32BE(offset);
		};
		writeLength = function (data, length) {
			return data.writeUInt32BE(length, 0);
		};
	} else {
		return assert.fail(length_field_bytes, "1, 2 or 4", 'length_field_bytes can be 1, 2 or 4');
	}

	/* Stream's state */
	self.waitingForMessage = function(){
		return this.message_length === null;
	};

	self.appendData = function(data){
		if(this.buffer){
			var newBuffer = new Buffer(this.buffer.length + data.length);

	        self.buffer.copy(newBuffer, 0, 0, self.buffer.length);
	        data.copy(newBuffer, this.buffer.length, 0, data.length);

	        this.buffer = newBuffer;
	    } else {
	    	this.buffer = data;
	    }
	};

	self.bytesToRead = function(){
		return this.message_length || length_field_bytes;
	};

	stream.on("data", function (data) {
		self.appendData(data);
		
		var offset = 0;
		while(isAvailable(data, self.bytesToRead(), offset)){
			if(self.waitingForMessage()){
				self.message_length = readLength(data, offset);
				offset += length_field_bytes;
			} else {
				var raw_message = self.buffer.slice(offset, offset + self.message_length);
				var parsed_message = self.message_class.decode(raw_message);
				self.emit('message', parsed_message);

				offset += self.message_length;
				self.message_length = null;
			}
		}

		self.buffer = self.buffer.slice(offset);
	});


	/**
	 * Sends the message along the stream.
	 *
	 * When message is not a buffer, than it is serialized using message
	 * class given during initialization.
	 *
	 * Otherwise message is send preceded by its length padded to
	 * length_field_bytes.
	 */
	self.send = function(message){
		if(!(message instanceof buffer.Buffer)){
			message = this.message_class.serialize(message);
			if(!message){
				assert.fail(message, "Could not serialize message");
			}
		}

		var packet = new Buffer(length_field_bytes + message.length);
		writeLength(packet, message.length);
		message.copy(packet, length_field_bytes);

		stream.write(packet);
	};
};


util.inherits(Stream, EventEmitter);

module.exports.Stream = Stream;
