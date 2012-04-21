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
		
		var emitQueue = function(element, newQueue) {
			console.log("sending out " + element);
			console.log("queue " + newQueue);
			socket.emit('queue', element, newQueue);
		};


		emitQueue(null, app.set('visualizationSearchQueue'));
		
		app.on('datastream', emitDataStream);
		app.on('visualizationSearchQueue.add', emitQueue);
		
		socket.on('disconnect', function() {
			app.removeListener('datastream', emitDataStream);
		});
	});
	
}