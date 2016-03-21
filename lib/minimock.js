/*!
 * node-minimock
 * Copyright(c) 2011 Dawid Fatyga <dawid.fatyga@gmail.com>
 * MIT Licensed
 */

/**
 * Library version.
 */

var _ = require('underscore');
var assert = require('assert');

exports.version = '0.0.1';

exports.mock = function(){
	var MockClass = function() {};
	var VerifierClass = function(mock_instance, times) {
		this.__mock__ = mock_instance;
		this.times = times || 1;
	};

	var methods_to_mock = _.values(arguments);
	_.each(methods_to_mock, function(method){

		MockClass.prototype[method] = function(){
			this.__called_arguments__[method].push(arguments);
		};

		VerifierClass.prototype[method] = function(callback){
			var calls = this.__mock__.__called_arguments__[method];

			if(calls.length != this.times){
				assert.fail(calls.length, this.times, null, "is not valid invocation count; should be");
			}

			if(callback){
				_(this.times).times(function(){
					callback.apply(this, _.values(calls.shift()));
				});
			} else {
				return _.values(calls.shift());
			}
		};
	});

	var instance = new MockClass();
	instance.verifier = VerifierClass;

	instance.__called_arguments__ = {};
	_.each(methods_to_mock, function(method){
		instance.__called_arguments__[method] = [];
	});

	return instance;
};

exports.verify = function(mock_instance, times){
	return new mock_instance.verifier(mock_instance, times);
};
