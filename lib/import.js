var imageProcessor = require('./imageprocessing');
var fs = require('fs');



var processImages = function(dbObj, renderFolder, textureFolder, callback) {
	var texWidth = 512;
	var pngName = dbObj.png;
	var jpgName = pngName.replace(".png", ".jpg");
	var texName = pngName.replace(".png", "-tex.jpg");
	console.log("Processing: " + pngName + "\t" + jpgName + "\t" + texName);
	var fullPngName = renderFolder + pngName;
	var fullJpgName = renderFolder + jpgName;
	var fullTexName = textureFolder + texName;

	imageProcessor.convert(fullPngName, fullJpgName, function(err) {
		if (err) { console.log(err); return callback(err); }

		imageProcessor.generateTexture(fullPngName, fullTexName, texWidth, function(err2) {
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


//TODO: HANDLE EMPTY data dir
var importData = function(dir, renderFolder, CrawledPage, callback) {
	fs.readdir(dir, function(err, files) {
		files.forEach(function(el, idx, arr) {
			if (/\.json$/.test(el)) {
				var filename = dir + "/" + el;
			
				var theObj = JSON.parse(fs.readFileSync(filename));
				
				CrawledPage.findOne({"url": theObj.url}, function(err, cp) {
						//IF URL ALREADY EXISTS, DELETE SCREENSHOT & JSON
						if (!err && cp) {
							console.log("url already exists");
							fs.unlinkSync(renderFolder + theObj.png);
							fs.unlinkSync(filename)
							callback(null, (idx == arr.length -1));
						}
						//IF URL DOES NOT EXIST, DELETE JSON & CALLBACK
						else {
							cp = new CrawledPage(theObj);
							cp.save(function(err, newObj) {
								fs.unlinkSync(filename);
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
			} //end if endsWith json
		}); //end files.forEach
	}); //end fs.readdir
};

if (require.main === module) { //run via command line, execute!
	console.log("executing import...");
	var models = require('../models');
	var renderFolder =  '../public/test/';	
				
	var mongoose = require('mongoose')
		, Schema = mongoose.Schema
		, ObjectId = mongoose.SchemaTypes.ObjectId;

	models.defineModels(mongoose, function() {
		var CrawledPage = mongoose.model('crawledpage');
		mongoose.connect('mongodb://' + "localhost/google-views"); //config.MONGODB_URI);
		mongoose.connection.on("open", function() {
			console.log("opened connection to database!");
			importData('../data', renderFolder, CrawledPage, function(dbObj, isLast) {
				if (!dbObj && isLast) { process.exit(); }
				
				if (dbObj) {
					//TODO: pull from app
					processImages(dbObj, renderFolder, renderFolder, function(err) {
						if (err) console.log(err);
						if (isLast) {
							process.exit();
						}
					});
				}
				
			});
		});
	});
	
}

module.exports = importData;
