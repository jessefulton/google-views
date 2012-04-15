var im = require('imagemagick');




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

var convert = function (sourceImg, destImg, callback) {
	im.convert([sourceImg, destImg], 
		function(err, metadata){
		  if (err) throw err
		  callback();
		}
	);
}


module.exports.generateTexture = texture;
module.exports.convert = convert;