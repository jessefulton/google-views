var imageProcessing = require('./lib/imageprocessing');
var utils = require('./lib/utils');



/**
* Creates a series of listeners to fire off functionality when certain events occur
*
*/
module.exports.init = function(app) {


	var RENDER_DIR = app.set('renderdir');
	var TEXTURE_SIZE = 1024;


	app.on('searchComplete', function(query) {

		function generateTexture(urls) {
			//remove dups from urls
			urls = utils.unique(urls);
			urls.forEach(function(url, idx, arr) {
				var baseFilename = utils.md5(url);
				var pngFilename = baseFilename + ".png";
				var jpgFilename = baseFilename + ".jpg";
				var texFilename = baseFilename + "-tex.jpg";
				
				imageProcessing.rasterize(url, (RENDER_DIR + pngFilename), function(code) {
					if (code === 0) {

						imageprocessing.convert(pngFilename, jpgFilename, function() {
							imageprocessing.texture(jpgFilename, texFilename, TEXTURE_SIZE, function() {
								app.CrawledPage.findOne({"url": url}, function(err, cp) {
									if (err || !ws) {
										cp = new app.CrawledPage({"url": url});
									}
									
									cp.png = pngFilename;
									cp.jpg = jpgFilename;
									cp.tex = texFilename;
									cp.save();
								});	// end findOne
								
							}); // end texture
						}); // end convert
					
					}
					else {
						console.log("error rasterizing " + url);
					}
				}); // end rasterize

			}); // end foreach
		}
	
		app.WebSearch.findOne({"query": query}, function(err, ws) {
					if (!err && ws) {
						var urls = [];
						//ClientSearch objects
						ws.searches.forEach(function(cs, csIdx, csArr) {
							cs.results.forEach(function(url, idx, arr) {
								urls.push(url);
							});
						});
						
						generateTextures(urls);
					}
		});
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