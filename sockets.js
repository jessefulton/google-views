var sio = require('socket.io');

module.exports.init = function(app) {
	
	/**
	 * Socket.IO server (single process only)
	 */
	var io = sio.listen(app);
	io.set('log level', 1);
	
	
	io.set('transports', [
		'websocket'
		, 'flashsocket'
		, 'htmlfile'
		, 'xhr-polling'
		, 'jsonp-polling'
	]);
	
	
	io.sockets.on('connection', function (socket) {
		//on first run, send out the whole stream
		socket.emit('datastream', null, app.set('datastream'));
	
		var emitDataStream = function(el, stream) {
			console.log("sending out " + el);
			socket.volatile.emit('datastream', el, stream);
		};
		
		app.on('datastream', emitDataStream);
		
		socket.on('disconnect', function() {
			app.removeListener('datastream', emitDataStream);
		});
	});
	
}