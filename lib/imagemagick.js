var im = require('imagemagick');

im.convert(['public/screenshots/0a2fdfdc-4ad9-1892-cc37-314f7a4ad560.png', 'test.jpg'], 
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