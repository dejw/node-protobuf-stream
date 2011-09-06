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