var fs = require('fs');

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
					fs.unlinkSync(filename);
					console.log(idx + ", " + arr.length);
					if (!err) {
						console.log("SAVED OBJ: " + newObj.title);
					}
					else {
						console.log(err);
					}
					
					if (idx == arr.length -1) {
						callback();
					}
	
				});
				
			
	
			}
		});
	});
};

if (require.main === module) { //run via command line, execute!
	console.log("foo");
	var models = require('./models');
	
	var mongoose = require('mongoose')
		, Schema = mongoose.Schema
		, ObjectId = mongoose.SchemaTypes.ObjectId;

	models.defineModels(mongoose, function() {
		console.log("defining models");
		var CrawledPage = mongoose.model('crawledpage');
		console.log("got crawled page");
		mongoose.connect('mongodb://' + "localhost/google-views"); //config.MONGODB_URI);
		console.log("connected mongodb");
		mongoose.connection.on("open", function() {
			console.log("opened connection to database!");
			importData('./data', CrawledPage, function() {
				process.exit();
			});
		});
	});
	
}

module.exports = importData;
