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
var texture = function (sourceImg, destImg, texWidth, callback) {
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
	var script = [__dirname + './scripts/rasterize.js'];
	var scriptArgs = [url, filename];
	var cspr = spawn(cmd, casperArgs.concat(script, scriptArgs));
	  
	/*
	cspr.stdout.setEncoding('utf8');
	cspr.stdout.on('data', onStdout);
	
	cspr.stderr.setEncoding('utf8');
	cspr.stderr.on('data', onStderr);
	*/
	
	cspr.on('exit', function (code) {
		callback(code);
	});
}



module.exports.rasterize = rasterize;
module.exports.generateTexture = texture;
module.exports.convert = convert;