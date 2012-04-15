var imageProcessor = require('./imageprocessing');
var fs = require('fs');



var processImages = function(dbObj, renderFolder, textureFolder, callback) {
	var texWidth = 512;
	var pngName = renderFolder + dbObj.png;
	var jpgName = pngName.replace(".png", ".jpg");
	var texName = pngName.replace(".png", "-tex.jpg");
	console.log("Processing: " + pngName + "\t" + jpgName + "\t" + texName);

	imageProcessor.convert(pngName, jpgName, function(err) {
		if (err) { console.log(err); return callback(err); }

		imageProcessor.generateTexture(pngName, texName, texWidth, function(err2) {
			if (err2) { console.log(err2); return callback(err2); }
			console.log("images Processed: " + jpgName + "\n\t" + texName);
			dbObj.tex = texName;
			dbObj.jpg = jpgName;
			dbObj.save(function(err3) {
				callback(err3);
			});
		});

	});
}

var importData = function(dir, CrawledPage, callback) {
	//dir = './data'
	fs.readdir(dir, function(err, files) {
		files.forEach(function(el, idx, arr) {
			if (/\.json$/.test(el)) {
			
				var filename = dir + "/" + el;
			
				//TODO: readFileSync, closeSync, unlinkFileSync
				var theObj = JSON.parse(fs.readFileSync(filename));
				//fs.closeSync(filename);
				
				var cp = new CrawledPage(theObj);
				cp.save(function(err, newObj) {
					//fs.unlinkSync(filename);
					console.log(idx + ", " + arr.length);
					if (!err) {
						console.log("SAVED OBJ: " + newObj.title);
					}
					else {
						console.log(err);
					}
					
					callback(newObj, (idx == arr.length -1));
	
				});
				
			
	
			}
		});
	});
};

if (require.main === module) { //run via command line, execute!
	console.log("executing import...");
	var models = require('../models');
	
	var mongoose = require('mongoose')
		, Schema = mongoose.Schema
		, ObjectId = mongoose.SchemaTypes.ObjectId;

	models.defineModels(mongoose, function() {
		var CrawledPage = mongoose.model('crawledpage');
		mongoose.connect('mongodb://' + "localhost/google-views"); //config.MONGODB_URI);
		mongoose.connection.on("open", function() {
			console.log("opened connection to database!");
			importData('../data', CrawledPage, function(dbObj, isLast) {
				//TODO: pull from app
				var renderFolder =  '../public/test/';	
				processImages(dbObj, renderFolder, renderFolder, function(err) {
					if (err) console.log(err);
					if (isLast) {
						process.exit();
					}
				});
			});
		});
	});
	
}

module.exports = importData;
