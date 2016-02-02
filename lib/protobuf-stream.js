
/*!
 * protobuf-stream
 * Copyright(c) 2011 Dawid Fatyga <dawid.fatyga@gmail.com>
 * MIT Licensed
 */

/**
 * Library version.
 */

exports.version = '0.0.1';

var events = require('events');
var util = require('util');
var assert = require('assert');
var buffer = require('buffer');

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

	length_field_bytes = length_field_bytes || 2;

	events.EventEmitter.call(self);

	/* Helper functions */
	var isAvailable = function(data, length, offset){
		return data.length >= (length + offset);
	};

	var readLength = function(data, offset){
		switch(length_field_bytes){
			case 1: return data.readUInt8(offset);
			case 2: return data.readUInt16BE(offset);
			case 4: return data.readUInt32BE(offset);
			default:
				assert.fail(length_field_bytes, "1, 2 or 4", 
					'length_field_bytes can be 1, 2 or 4');
		}
	};

	var writeLength = function(data, length){
		switch(length_field_bytes){
			case 1: return data.writeUInt8(length, 0);
			case 2: return data.writeUInt16BE(length, 0);
			case 4: return data.writeUInt32BE(length, 0);
			default:
				assert.fail(length_field_bytes, "1, 2 or 4", 
					'length_field_bytes can be 1, 2 or 4');
		}
	};

	/* Stream's state */
	self.waitingForMessage = function(){
		return self.message_length === null;
	}

	self.appendData = function(data){
		if(this.buffer){
			var newBuffer = new buffer.Buffer(this.buffer.length + data.length);

	        self.buffer.copy(newBuffer, 0, 0, self.buffer.length);
	        data.copy(newBuffer, this.buffer.length, 0, data.length);

	        this.buffer = newBuffer;
	    } else {
	    	this.buffer = data;
	    }
	}

	self.bytesToRead = function(){
		return this.message_length || length_field_bytes;
	}

	stream.on("data", function(data){
		self.appendData(data);
		
		var offset = 0;
		while(isAvailable(data, self.bytesToRead(), offset)){
			if(self.waitingForMessage()){
				self.message_length = readLength(data, offset);
				offset += length_field_bytes;
			} else {
				var raw_message = self.buffer.slice(offset, offset + self.message_length);
				parsed_message = self.message_class.decode(raw_message);
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
			message = self.message_class.serialize(message);
			if(!message){
				assert.fail(message, "Could not serialize message");
			}
		}

		var packet = new buffer.Buffer(length_field_bytes + message.length);
		writeLength(packet, message.length);
		message.copy(packet, length_field_bytes);

		stream.write(packet);
	}
}


util.inherits(Stream, events.EventEmitter);

module.exports.Stream = Stream;