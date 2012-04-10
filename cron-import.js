var fs = require('fs');
var models = require('./models');

var mongoose = require('mongoose')
	, Schema = mongoose.Schema
	, ObjectId = mongoose.SchemaTypes.ObjectId;

var CrawledPage;

models.defineModels(mongoose, function() {
	CrawledPage = mongoose.model('crawledpage');
	mongoose.connect('mongodb://' + "localhost/google-views"); //config.MONGODB_URI);
    mongoose.connection.on("open", function() {
        console.log("opened connection to database!");


		fs.readdir('./data', function(err, files) {
			files.forEach(function(el, idx, arr) {
				if (/\.json$/.test(el)) {
				
					var filename = './data' + "/" + el;
				
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
							process.exit();
						}

					});
					
				

				}
			});
		});    
		
		
    });
});


