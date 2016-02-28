'use strict';

var Socket = require('socket.io');

var io = Socket(http);

io.on('connection', function(socket){
	console.log("Connection established!");
});
