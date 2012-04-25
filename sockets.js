var sio = require('socket.io'),
	async = require('async');

module.exports.init = function(app) {
	var RENDER_DIR = app.set('publicrenderdir');
	
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
			io.sockets.emit('queue', element, newQueue);
		};


		emitQueue(null, app.set('visualizationSearchQueue'));
		
		//app.on('datastream', emitDataStream);
		app.on('visualizationSearchQueue.add', emitQueue);


		socket.on('queryTextures', function(term, callback) {
			console.log("SOCKET.ON QUERYTEXTURES");
			var resp = {};
			app.WebSearch.findOne({"query": term}, function(err, ws) {
				if (!ws) {
					console.log("no textures for query " + term);
					callback(null);
				}
				else {
					async.forEach(ws.searches
						, function(search, cbOuter) {
						
							if (!resp[search.clientId]) {
								resp[search.clientId] = [];
								async.forEach(search.results
									, function(url, cbInner) {
										app.CrawledPage.findOne({"url": url}, function(err, cp) {
											if (!err && cp) {
												//console.log("found tex for " + url);
												resp[search.clientId].push(RENDER_DIR + cp.tex);
											}
											else {
												resp[search.clientId].push(null);
												app.emit("texture.missing", url);
												//console.log("couldn't find tex for " + url);
											}

											cbInner();
										});
									}
									, function(innerErr) {
										if (innerErr) { console.log("Error loading textures: " + innerErr); }
										console.log("finished internal loop");
										cbOuter();
									}
								);
							}
							else {
								cbOuter();
							}
						
						}
						, function(outerErr) {
							console.log("finished outer loop " + JSON.stringify(resp));
							
							var arrayed = [];
							for (var user in resp) {
								var userResults = resp[user];
								for (var i=0; i<userResults.length; i++) {
									if (!arrayed[i]) { arrayed[i] = []; }								
									arrayed[i].push(userResults[i]);
								}
							}
							
							callback(arrayed);
						}
					);
				}				
				
			});

		
		
		/*
			resp = [
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
			*/
		});
	

		
		socket.on('disconnect', function() {
			app.removeListener('datastream', emitDataStream);
		});
	});
	
}