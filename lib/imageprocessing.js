/**
* Handles all image processing
*
*/


// reference to ImageMagick //
var im = require('imagemagick');



var async = require('async')
	, fs = require('fs')
	, utils = require('./utils');


/**
 * Creates a square texture of the image passed in
 *
 */
var generateTexture = function (sourceImg, destImg, texWidth, callback) {
	im.identify(['-format', '%wx%h', sourceImg], function(err, output){
		if (err) {
			console.log(err);
		}
		var wh = output.replace("\n", "").split("x");
		var width = wh[0];
		var height = wh[1];
		
		im.convert([sourceImg, '-crop', width+"x"+width+"+0+0", '-resize', texWidth, destImg], 
			function(err2, metadata){
			  if (err2) throw err2
			  callback();
			}
		);
	});
}


/**
* Calls imageMagick's 'convert' method
* 	(ie., convert png to jpg)
*
*/
var convert = function (sourceImg, destImg, callback) {
	im.convert([sourceImg, destImg], 
		function(err, metadata){
			if (err) {
		  		throw err;
		  	}
			callback();
		}
	);
}


/**
* Rasterizes a given URL
*
*/
var rasterize = function(url, filename, callback) {
	var	spawn = require('child_process').spawn;
	
	var cmd = "phantomjs";
	var script = __dirname + '/../scripts/rasterize.js';
	var scriptArgs = [script, url, filename];

	console.log("RASTERIZE: " + JSON.stringify(scriptArgs));

	
	var phntm = spawn(cmd, scriptArgs);
	
	
	console.log("Running phantomjs " + JSON.stringify(scriptArgs));
	
	phntm.stdout.setEncoding('utf8');
	phntm.stdout.on('data', function(data) { console.log("PHNTM OUT: " + data); });
	
	phntm.stderr.setEncoding('utf8');
	phntm.stderr.on('data', function(data) { console.log("PHNTM ERR: " + data); });
	
	
	phntm.on('exit', function (code) {
		console.log("EXITING RASTERIZE: " + code);
		callback(code);
	});
}




var generateAndSaveTexture = function(app, url, cb) {


	var users = app.set('config').users;
	var RENDER_DIR = app.set('renderdir');
	var TEXTURE_SIZE = app.set('textureSize');



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
				rasterize(url, (RENDER_DIR + pngFilename), function(code) {
					if (code === 0) {

						convert((RENDER_DIR + pngFilename), (RENDER_DIR + jpgFilename), function() {
							generateTexture((RENDER_DIR + jpgFilename), (RENDER_DIR + texFilename), TEXTURE_SIZE, function() {
										
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
						app.emit("texture.missing", url);
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



module.exports.rasterize = rasterize;
module.exports.generateTexture = generateTexture;
module.exports.convert = convert;
module.exports.generateAndSaveTexture = generateAndSaveTexture;
