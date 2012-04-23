var imageProcessing = require('./lib/imageprocessing')
	, utils = require('./lib/utils')
	, async = require('async');



/**
* Creates a series of listeners to fire off functionality when certain events occur
*
*/
module.exports.init = function(app) {


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
					app.CrawledPage.findOne({"url": url}, function(err, cp) {
						if (err || !cp) {
							cp = new app.CrawledPage({"url": url});
						}
						//if this page already has textures generated, return
						if (cp.jpg || cp.tex) { 
							console.log("texture already exists for " + url);
							cb();
							return;
						}
						
						
						var baseFilename = utils.md5(url);
						var pngFilename = baseFilename + ".png";
						var jpgFilename = baseFilename + ".jpg";
						var texFilename = baseFilename + "-tex.jpg";
						
						console.log("generating textures for " + url);
						try {
							imageProcessing.rasterize(url, (RENDER_DIR + pngFilename), function(code) {
								if (code === 0) {
			
									imageProcessing.convert((RENDER_DIR + pngFilename), (RENDER_DIR + jpgFilename), function() {
										imageProcessing.generateTexture((RENDER_DIR + jpgFilename), (RENDER_DIR + texFilename), TEXTURE_SIZE, function() {
													
											cp.png = pngFilename;
											cp.jpg = jpgFilename;
											cp.tex = texFilename;
											cp.save(function(err, savedObj) { 
												console.log("generated textures " + JSON.stringify(cp));
												cb(); 
											});
											
										}); // end texture
									}); // end convert
								
								}
								else {
									console.log("**** error rasterizing " + url);
									cb();
								}
							}); // end rasterize
						}
						catch(e) { 
							console.log(e);
							cb();
						}
					});	// end CrawledPages findOne
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
	app.on('crawl output', function(obj) {
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
		console.log(JSON.stringify(obj));
	});

	*/
	
	/*
	app.on('visualizationSearchQueue.add', function(obj) {
		var q = app.set('visualizationSearchQueue');
		q.push(obj);
		app.set('visualizationSearchQueue', q);
	});
	*/
	
}