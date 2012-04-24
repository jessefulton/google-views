var imageProcessing = require('./lib/imageprocessing')
	, utils = require('./lib/utils')
	, async = require('async');


var searcher = require('./lib/searcher');


/**
* Creates a series of listeners to fire off functionality when certain events occur
*
*/
module.exports.init = function(app) {

	var users = app.set('config').users;
	var RENDER_DIR = app.set('renderdir');
	var TEXTURE_SIZE = app.set('textureSize');





	app.on('visualizationSearchQueue.processedOne', function(query) {
		app.WebSearch.findOne({"query": query}, function(err, ws) {
			if (err) { console.log("ERROR finding websearch for " + query); return; }
			console.log("found object for " + query);
			console.log(ws);
		
			var urls = [];
			//ClientSearch objects
			ws.searches.forEach(function(cs, csIdx, csArr) {
				cs.results.forEach(function(url, idx, arr) {
					urls.push(url);
				});
			});
			
			
			async.forEachSeries(
				urls
				, function(url, cb) {
					imageProcessing.generateAndSaveTexture(app, url, cb);
				}
				, function(err) {
					app.emit("visualizationSearchQueue.texturesGenerated", ws);
				}
			); // end async
		}); // end WebSearch findOne
	});

	/*
	app.on('crontick', function(el) {
		var datastream = app.set('datastream');
		datastream.push(el);
		if(datastream.length > 10) {
			datastream.shift();
		}
		app.set('datastream', datastream);
		
		console.log(datastream);
		
		app.emit('datastream', el, datastream);
	});
	*/
	
	
	app.on('crawl output', function(obj) {
		/*
		switch (obj.type) {
			case "error": 
				var msg = obj.message;
				break;
			case "user":
				var eml = obj.email;
				break;
			case "command":
				var url = obj.url;
				var title = obj.title;
				var img = obj.image;
				break;
		}
		*/
		console.log(JSON.stringify(obj));
	});

	
	app.on('visualizationSearchQueue.add', function(term, ws) {
		//var q = app.set('visualizationSearchQueue');
		//q.push(term);
		//app.set('visualizationSearchQueue', q);

		searcher.process(ws, users, app);

		
	});
	
	
}