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
			callback(err);
		}
		else {
			var wh = output.replace("\n", "").split("x");
			var width = wh[0];
			var height = wh[1];
			
			im.convert([sourceImg, '-crop', width+"x"+width+"+0+0", '-resize', texWidth, destImg], 
				function(err2, metadata){
				  //if (err2) throw err2
				  callback(err2);
				}
			);
		}
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
			callback(err);
		}
	);
}


/**
* Rasterizes a given URL
*
*/
var rasterize = function(url, filename, callback) {
	var	spawn = require('child_process').spawn;
	
	var cmd = "casperjs";
	var script = __dirname + '/../scripts/rasterize.js';
	var scriptArgs = [script, url, filename];

	console.log("RASTERIZE: " + JSON.stringify(scriptArgs));

	
	var phntm = spawn(cmd, scriptArgs);
	
	
	console.log("Running casperjs " + JSON.stringify(scriptArgs));
	
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


	var users = require('../config').get("users");
	var RENDER_DIR = app.get('renderdir');
	var TEXTURE_SIZE = app.get('textureSize');


	var doError = function(_url, _err, _cb) {
		console.log("**** error in imageprocessing.generateAndSaveTexture() " + _url);
		console.log("\t " + _err);
		app.emit("texture.missing", _url);
		_cb(_err);
	}


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

						convert((RENDER_DIR + pngFilename), (RENDER_DIR + jpgFilename), function(conversionError) {
							if (conversionError) {
								doError(url, conversionError, cb);
							}
							else {
								generateTexture((RENDER_DIR + jpgFilename), (RENDER_DIR + texFilename), TEXTURE_SIZE, function(textureError) {
									if (textureError) {
										doError(url, textureError, cb);
									}
									else {		
										cp.png = pngFilename;
										cp.jpg = jpgFilename;
										cp.tex = texFilename;
										cp.save(function(err, savedObj) { 
											console.log("generated textures " + JSON.stringify(cp));
											cb(); 
										});
									}									
								}); // end texture
							}
						}); // end convert
					
					}
					else {
						doError(url, "error code when rasterizing", cb);

					}
				}); // end rasterize
			}
			catch(e) { 
				doError(url, e, cb);
			}
		});	// end CrawledPages findOne
	}



module.exports.rasterize = rasterize;
module.exports.generateTexture = generateTexture;
module.exports.convert = convert;
module.exports.generateAndSaveTexture = generateAndSaveTexture;
