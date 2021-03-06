var imageProcessing = require('./lib/imageprocessing')
	, utils = require('./lib/utils')
	, async = require('async');


var searcher = require('./lib/searcher');


/**
* Creates a series of listeners to fire off functionality when certain events occur
*
*/
module.exports.init = function(app) {

	var users = require("./config").get('users');
	var RENDER_DIR = app.get('renderdir');
	var TEXTURE_SIZE = app.get('textureSize');





	app.on('visualizationSearchQueue.finishedSearch', function(wsq) {

		wsq.processState = "texturing";
		wsq.save(function(err1, ws) {
			
			if (err1) { 
				console.warn(err1); 
			}
			
			console.log("finished search for " + ws.query);
			
			app.WebSearch.findOne({"query": ws.query}, function(err, webSearch) {
	
				if (err) {
					console.warn(err);
				}
				if (!webSearch) {
					console.warn("Could not find WebSearch for query " + ws.query);
				}
				
	
				var urls = [];
				//ClientSearch objects
				webSearch.searches.forEach(function(cs, csIdx, csArr) {
					cs.results.forEach(function(url, idx, arr) {
						urls.push(url);
					});
				});
			
				urls = utils.unique(urls);
			
				console.log("About to generate textures for " + JSON.stringify(urls));
			
			
				var amt = urls.length;
				var curnum = 0;
			
				async.forEachSeries(
					urls
					, function(url, cb) {
						imageProcessing.generateAndSaveTexture(app, url, function() {
							curnum++;
							console.log(curnum + "/" + amt + ": " + (curnum/amt) + "%");
							app.emit("visualizationSearchQueue.texturesProcessing", webSearch, curnum, amt);
							cb();
						});
					}
					, function(err) {
						if (!err) {
							ws.processState = "complete";
						}
						else {
							console.log(err);
							ws.processState = "error";
						}
						ws.save(function(innerErr, savedObj) {
							app.emit("visualizationSearchQueue.texturesGenerated", savedObj);
						});
					}
				); // end async
			}); //end websearch.findOne
		}); //end webSearchQuery save
	});

	/*
	app.on('crontick', function(el) {
		var datastream = app.get('datastream');
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

	
	app.on('visualizationSearchQueue.add', function(ws, queue) {
		//var q = app.get('visualizationSearchQueue');
		//app.set('visualizationSearchQueue', q);
		//searcher.process(ws, users, app);
		
	});
	
	
}