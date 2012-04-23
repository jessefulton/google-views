var imageProcessor = require('./imageprocessing');
var fs = require('fs.extra');



var processImages = function(dbObj, renderFolder, callback) {
	var texWidth = 512;
	var pngName = dbObj.png;
	var jpgName = pngName.replace(".png", ".jpg");
	var texName = pngName.replace(".png", "-tex.jpg");
	console.log("Processing: " + pngName + "\t" + jpgName + "\t" + texName);
	var fullPngName = renderFolder + pngName;
	var fullJpgName = renderFolder + jpgName;
	var fullTexName = renderFolder + texName;

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


var numHiddenFiles = function(files) {
	var num = 0;
	for (var i=0; i<files.length; i++) {
		if (files[i].indexOf('.') == 0) {
			num++;
		}
		else {
			break;
		}
	}
	return num;
}

/**
 * Finds JSON files in the data directory, parses them
 *    If that record is already in the database, it adds the crawl date, and deletes the JSON & PNG files
 *    If that record does not exist, it is added
 *
 * @param {string} dir The directory for the JSON files
 * @param {string} renderFolder The image directory to look for png files
 * @param {Object} CrawledPage Mongoose model object used to query database
 * @param {Function} callback Callback function receiving two arguments: the db object, and a boolean of whether this is the last item.
 */
var importData = function(dir, renderFolder, CrawledPage, callback) {
	fs.readdir(dir, function(err, files) {
		var numHidden;
		//If empty, return
		if ( (files.length - numHiddenFiles(files)) == 0) { 
			callback(null, true);
		}
		files.forEach(function(el, idx, arr) {
			if (/\.json$/.test(el)) {
				var filename = dir + "/" + el;
			
				var theObj = JSON.parse(fs.readFileSync(filename));
				
				CrawledPage.findOne({"url": theObj.url}, function(err, cp) {
						//IF URL ALREADY EXISTS, DELETE SCREENSHOT & JSON
						if (!err && cp) {
							fs.unlinkSync(renderFolder + theObj.png);
							fs.unlinkSync(filename)
							//add new crawl date
							cp.date.push(obj.date);
							cp.save(function(err, newObj) {
								callback(null, (idx == arr.length -1));
							});
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


/**
 * Finds CrawledPage objects in the DB with duplicate "url" fields, deletes the dupes and removes any associated images
 *
 */
var removeDupes = function(CrawledPage, imageFolder, callback) {
	CrawledPage.where().exists("url")
		.select("url", "png", "jpg", "tex")
		.sort("url", 1)
		.run(function(err, docs) {
			var previous_url;
			docs.forEach(function(el, idx, arr) {
				if (el.url == previous_url) {
					try {
						if (el.png) {
							fs.unlinkSync(imageFolder + el.png);
						}
						if (el.jpg) {
							fs.unlinkSync(imageFolder + el.jpg);
						}
						if (el.tex) {
							fs.unlinkSync(imageFolder + el.tex);
						}
					}
					catch(e) { console.log(e); }
					el.remove(function(err, doc) {
						console.log("REMOVED: " + el.url);
					});
				}
				previous_url = el.url;
				if (idx == arr.length -1) {
					callback();
				}
			});
		}
	);
}

/**
 * Finds all image filenames in the DB (jpg, png, tex) and moves them from one directory to a new one.
 * (Used for manual cleanup)
 */
var moveImages = function(fromDir, toDir, CrawledPage) {
	CrawledPage.where()
		.select("url", "png", "jpg", "tex")
		.run(function(err, docs) {
			docs.forEach(function(el, idx, arr) {
					try {
						if (el.png) {
							fs.move(fromDir + el.png, toDir + el.png, function(err) {
								console.log(err);
							});
						}
						if (el.jpg) {
							fs.move(fromDir + el.jpg, toDir + el.jpg, function(err) {
								console.log(err);
							});
						}
						if (el.tex) {
							fs.move(fromDir + el.tex, toDir + el.tex, function(err) {
								console.log(err);
							});
						}
					}
					catch(e) { console.log(e); }
					console.log("moved "  + el.url);
			});
		}
	);
}


/**
* Finds db objects with png source, but no converted jpg/tex attribute and creates those files & fields
*
* NOTE: this seems to fail if we do more than one at a time... problem with image magick library?
*/
var processOne = function(dir, CrawledPage, callback) {
	var path = require('path');
	CrawledPage.where()
		.exists("png", true)
		.exists("jpg", false)
		.select("url", "png", "jpg", "tex")
		.sort("png", 1)
		.limit(1)
		.run(function(err, docs) {
			if (docs.length == 0) {
				console.log("nothing to do!");
				callback();
			}
			docs.forEach(function(el, idx, arr) {
				var isLast = (idx == arr.length -1);
				if (!path.existsSync(dir + el.png)) {
					console.log("couldn't find " + dir + el.png);
					
					el.png = undefined;
					el.save(function(err) {
						if (err) { console.log("error saving after remove png: " + err); }
						console.log("removed png from object");
						//console.log(err); 
						if (isLast) {
							callback();
						}
					
					});
				}
				else {
					processImages(el, dir, function(err) {
						if (err) console.log(err);
						
						//TODO... remove png file?
						
						if (isLast) {
							callback();
						}
					});
				}
			});
		});
}


/*
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
			
			
			processOne('../public/rendered/', CrawledPage, function() {process.exit();});
		});
	});
	
}
*/


module.exports = importData;
