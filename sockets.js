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

		var emitProgress = function(obj, numProcessed, total) {
			io.sockets.emit('progress', obj, numProcessed, total);
		}


		emitQueue(null, app.set('visualizationSearchQueue'));
		
		//app.on('datastream', emitDataStream);
		app.on('visualizationSearchQueue.add', emitQueue);


		//TODO: UPDATE QUEUE... keep 2 separate queues
		app.on("visualizationSearchQueue.texturesGenerated", function(ws) {
			console.log("~~~~~ TEXTURES GENERATED [" + ws.query + "] ~~~~~~~");
			var q = app.set('visualizationSearchQueue');
			for (var i=0; i<q.length; i++) { //q.forEach(el, idx, arr) {
				if (q[i].term == ws.query) {
					q[i].processState = ws.processState;
					app.set('visualizationSearchQueue', q);
					emitQueue(ws, q);
					break;
				}
			} //do we add if not already in there...??? Prob not
			//	q.push({"term": term, "processed":false})

			

			//console.log("GENERATED TEXTURES FOR : " + ws.query);
		});


		app.on("visualizationSearchQueue.texturesProcessing", function(webSearch, curnum, amt) {
			emitProgress(webSearch, curnum, amt);
		});

		socket.on('queryTextures', function(term, callback) {
			//console.log("SOCKET.ON QUERYTEXTURES");
			
			var q = app.set('visualizationSearchQueue');
			for (var i=0; i<q.length; i++) { //q.forEach(el, idx, arr) {
				if (q[i].query == term) {
					if (!(q[i].processState) || !(q[i].processState == "complete")) {
						console.log("Still generating textures for query " + term + " [" + q[i].processState + "]");
						callback(null);
					}
					break;
				}
			} //do we add if not already in there...??? Prob not
			//	q.push({"term": term, "processed":false})
			
			
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
										app.CrawledPage.findOne({"url": url, "tex": {"$exists":true}}, function(err, cp) {
											if (!err && cp && cp.tex) {
											
												//console.log("found tex for " + url);
												//console.log(cp);
												resp[search.clientId].push(RENDER_DIR + cp.tex);
											}
											else {
												resp[search.clientId].push("/loading.jpg");
												app.emit("texture.missing", url);
												//console.log("couldn't find tex for " + url);
											}

											cbInner();
										});
									}
									, function(innerErr) {
										if (innerErr) { console.log("Error loading textures: " + innerErr); }
										//console.log("finished internal loop");
										cbOuter();
									}
								);
							}
							else {
								cbOuter();
							}
						
						}
						, function(outerErr) {
							//console.log("finished outer loop " + JSON.stringify(resp));
							
							var arrayed = [];
							for (var user in resp) {
								var userResults = resp[user];
								for (var i=0; i<userResults.length; i++) {
									if (!arrayed[i]) { arrayed[i] = []; }								
									arrayed[i].push(userResults[i]);
								}
							}
							
							for (var i=0; i<arrayed.length; i++) {
								if (arrayed[i].length < 4) {
									while (arrayed[i].length < 4) {
										arrayed[i].push("/loading.jpg");
									}
								}
							}
							
							callback(arrayed);
						}
					);
				}				
				
			});

		
		});
	

		
		socket.on('disconnect', function() {
			app.removeListener('datastream', emitDataStream);
		});
	});
	
}