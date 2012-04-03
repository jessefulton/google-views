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
				
					//TODO: readFileSync, closeSync, unlinkFileSync
					fs.readFile('./data' + "/" + el, function(err, data) {
						if (err) throw err;
						var theObj = JSON.parse(data);
						var cp = new CrawledPage(theObj);
						cp.save(function(err, newObj) {
							if (!err) {
								console.log("SAVED OBJ: " + newObj.title);
							}
							else {
								console.log(err);
							}
							
							//TODO: check if last file in forEach and call process.exit();
							
						});
						
					});
				

				}
			});
		});    
		
		
    });
});


