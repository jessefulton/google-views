var im = require('imagemagick');

im.convert(['tor.png', '-resize', '250', 'tor-small.jpg'], 
	function(err, metadata){
	  if (err) throw err
	  console.log('stdout:', metadata);
	}
);


/*

modules.exports = {
	"pngToTex": function(pngFile, outputFile) {
	
	
	
	}
	, "generateQueue": {
	
	}

}
*/