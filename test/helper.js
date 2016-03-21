/* Test helpers */

var util = require('util');

var EventEmitter = require('events').EventEmitter;
var Buffer = require('buffer').Buffer;

// Small utility class
var Pipe = function(){ EventEmitter.call(this); };
util.inherits(Pipe, EventEmitter);

Pipe.prototype.write = function(buffer){
	this.emit('data', buffer);
};

// Pipe with buffering
var BufferedPipe = function(){
	Pipe.call(this);
	this.buffer = new Buffer(0);
};
util.inherits(BufferedPipe, Pipe);

BufferedPipe.prototype.write = function(data){
	var newBuffer = new Buffer(this.buffer.length + data.length);

    this.buffer.copy(newBuffer, 0, 0, this.buffer.length);
    data.copy(newBuffer, this.buffer.length, 0, data.length);

    this.buffer = newBuffer;
};

BufferedPipe.prototype.flush = function(){
	this.emit('data', this.buffer);
	this.buffer = new Buffer(0);
};

exports.Pipe = Pipe;
exports.BufferedPipe = BufferedPipe;
