/**
* Handles all image processing
*
*/


// reference to ImageMagick //
var im = require('imagemagick');


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

	
	var phntm = spawn(cmd, scriptArgs);
	
	/*  
	console.log("Running phantomjs " + JSON.stringify(scriptArgs));
	
	phntm.stdout.setEncoding('utf8');
	phntm.stdout.on('data', function(data) { console.log("PHNTM OUT: " + data); });
	
	phntm.stderr.setEncoding('utf8');
	phntm.stderr.on('data', function(data) { console.log("PHNTM ERR: " + data); });
	*/
	
	phntm.on('exit', function (code) {
		callback(code);
	});
}



module.exports.rasterize = rasterize;
module.exports.generateTexture = generateTexture;
module.exports.convert = convert;