var im = require('imagemagick');


var sourceImg = "tor.png";

	im.identify(['-format', '%wx%h', sourceImg], function(err, output){
		if (err) {
			console.log(err);
		}
		var wh = output.replace("\n", "").split("x");
		var width = wh[0];
		var height = wh[1];
		
		//im.convert([sourceImg, '-crop', width+"x"+width+"+0+0", '-resize', '250', 'tor-sq.jpg'], 
		im.convert([sourceImg, '-crop', width+"x"+width+"+0+0", 'tor-sq.jpg'], 
			function(err2, metadata){
			  if (err2) throw err2
			  console.log('stdout:', metadata);
			}
		);

		
		console.log("width: " + parseInt(wh[0]));
		console.log("height: " + parseInt(wh[1]));
	});

var texture = function (sourceImg, destImg, callback) {


	/*
	im.convert(['tor.png', '-resize', '250', 'tor-small.jpg'], 
		function(err, metadata){
		  if (err) throw err
		  console.log('stdout:', metadata);
		}
	);
	*/
}




/*

modules.exports = {
	"pngToTex": function(pngFile, outputFile) {
	
	
	
	}
	, "generateQueue": {
	
	}

}
*/