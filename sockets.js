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


		socket.on('queryTextures', function(term, callback) {
			var resp = [
					[ "/rendered/2f1c4e96-8aac-83ad-009f-b0b1443a8142-tex.jpg", "/rendered/3ad20227-fe24-5d59-b179-b3b6fde0d6c4-tex.jpg", "/rendered/3b1dd42e-ff4f-4888-b6ef-d7b7a84df4b7-tex.jpg", "/rendered/4acf6ddb-3088-1fb1-5c45-1ecd578a68e7-tex.jpg" ]
					, [ "/rendered/7b9899a3-3a92-b68d-72d1-cc1aa56e0253-tex.jpg", "/rendered/45afb6d8-6f37-efa2-48e0-2d0469647c65-tex.jpg", "/rendered/62d1e32f-64df-adc0-24d6-a38929021d7e-tex.jpg", "/rendered/68bd3e22-1965-aeaf-5b06-6b6458831884-tex.jpg"]
					, [ "/rendered/2f1c4e96-8aac-83ad-009f-b0b1443a8142-tex.jpg", "/rendered/3ad20227-fe24-5d59-b179-b3b6fde0d6c4-tex.jpg", "/rendered/3b1dd42e-ff4f-4888-b6ef-d7b7a84df4b7-tex.jpg", "/rendered/4acf6ddb-3088-1fb1-5c45-1ecd578a68e7-tex.jpg" ]
					, [ "/rendered/7b9899a3-3a92-b68d-72d1-cc1aa56e0253-tex.jpg", "/rendered/45afb6d8-6f37-efa2-48e0-2d0469647c65-tex.jpg", "/rendered/62d1e32f-64df-adc0-24d6-a38929021d7e-tex.jpg", "/rendered/68bd3e22-1965-aeaf-5b06-6b6458831884-tex.jpg"]
					, [ "/rendered/2f1c4e96-8aac-83ad-009f-b0b1443a8142-tex.jpg", "/rendered/3ad20227-fe24-5d59-b179-b3b6fde0d6c4-tex.jpg", "/rendered/3b1dd42e-ff4f-4888-b6ef-d7b7a84df4b7-tex.jpg", "/rendered/4acf6ddb-3088-1fb1-5c45-1ecd578a68e7-tex.jpg" ]
					, [ "/rendered/7b9899a3-3a92-b68d-72d1-cc1aa56e0253-tex.jpg", "/rendered/45afb6d8-6f37-efa2-48e0-2d0469647c65-tex.jpg", "/rendered/62d1e32f-64df-adc0-24d6-a38929021d7e-tex.jpg", "/rendered/68bd3e22-1965-aeaf-5b06-6b6458831884-tex.jpg"]
					, [ "/rendered/2f1c4e96-8aac-83ad-009f-b0b1443a8142-tex.jpg", "/rendered/3ad20227-fe24-5d59-b179-b3b6fde0d6c4-tex.jpg", "/rendered/3b1dd42e-ff4f-4888-b6ef-d7b7a84df4b7-tex.jpg", "/rendered/4acf6ddb-3088-1fb1-5c45-1ecd578a68e7-tex.jpg" ]
					, [ "/rendered/7b9899a3-3a92-b68d-72d1-cc1aa56e0253-tex.jpg", "/rendered/45afb6d8-6f37-efa2-48e0-2d0469647c65-tex.jpg", "/rendered/62d1e32f-64df-adc0-24d6-a38929021d7e-tex.jpg", "/rendered/68bd3e22-1965-aeaf-5b06-6b6458831884-tex.jpg"]
					, [ "/rendered/2f1c4e96-8aac-83ad-009f-b0b1443a8142-tex.jpg", "/rendered/3ad20227-fe24-5d59-b179-b3b6fde0d6c4-tex.jpg", "/rendered/3b1dd42e-ff4f-4888-b6ef-d7b7a84df4b7-tex.jpg", "/rendered/4acf6ddb-3088-1fb1-5c45-1ecd578a68e7-tex.jpg" ]
					, [ "/rendered/7b9899a3-3a92-b68d-72d1-cc1aa56e0253-tex.jpg", "/rendered/45afb6d8-6f37-efa2-48e0-2d0469647c65-tex.jpg", "/rendered/62d1e32f-64df-adc0-24d6-a38929021d7e-tex.jpg", "/rendered/68bd3e22-1965-aeaf-5b06-6b6458831884-tex.jpg"]
				];
				callback(resp);
				//socket.emit('queryTextures', term, resp);
		});
	

		
		socket.on('disconnect', function() {
			app.removeListener('datastream', emitDataStream);
		});
	});
	
}