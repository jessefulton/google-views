if (!process.env.NODE_ENV) process.env.NODE_ENV = "development";

/**
 * Module dependencies.
 */
var express = require('express')
	, http = require('http');
	
var models = require('./models')
	, routes = require('./routes');

var mongoose = require('mongoose')
	, Schema = mongoose.Schema
	, ObjectId = mongoose.SchemaTypes.ObjectId;





var config = {};
config.site = require('./config').init([
	"MONGODB_URI","LOGGLY_SUBDOMAIN","LOGGLY_INPUT_KEY",
	"AWS_ACCESSKEYID", "AWS_SECRETACCESSKEY",
	"AWS_BUCKET", "MEDIA_BASE_URL"
], "./conf/site.js");

config.users = require("./conf/users.js").users;


/*
var uploader = require('./lib/uploader');

var u = new uploader();
u.init(config.site);
//https://s3.amazonaws.com/everybodysgoogle/test/file2.png
u.upload("/test/file2.png", "./tor.png", function(err) { console.log(err); });
*/


var app = express.createServer();



app.configure(function(){
	//app.db = redis.createClient();
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.set('case sensitive routes', true);
	//let's change this to a local dir? then rsync to media server or use nginx?
	//app.set('screenshots', '/tmp');
	app.set('root', __dirname);

	//app.set('outputdir', __dirname + "/public/_generated");
	
	
	//TODO: trailing slash?
	app.set('renderdir', __dirname + "/public/rendered/");
	app.set('publicrenderdir', "/rendered/");
	
	app.set('crawldatadir', __dirname + "/data/");
	app.set('textureSize', 1024)
	
	app.set('datastream', []);
	
	//TODO: set flag for images ready
	app.set('visualizationSearchQueue', []);
	app.set('textureGenerationQueue', [])
	
	
	app.set('config', config);
	app.use(express.favicon());
	//app.use(stylus.middleware({ src: __dirname + '/public', compile: compile }))
	app.use(express.static(__dirname + '/public'));
	app.use(app.router);
  
	/*
	function compile (str, path) {
		return stylus(str)
			.set('filename', path)
			.use(nib());
	};
	*/
});


app.configure('development', function(){
	app.use(express.logger('dev'));
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});


models.defineModels(mongoose, function() {
	app.CrawledPage = mongoose.model('crawledpage');
	app.WebSearch = mongoose.model('websearch');
	app.ClientWebSearch = mongoose.model('clientwebsearch');
	app.WebSearchQueryQueue = mongoose.model('websearchqueryqueue');
	
	mongoose.connect(config.site.MONGODB_URI);
    mongoose.connection.on("open", function() {
        console.log("opened connection to database!");
    });
});


routes.init(app);



app.helpers({
		"dateFormat": function(dateObj){ 
			return dateObj.getMonth() + "/" + dateObj.getDate() + "/" + dateObj.getFullYear();
		}
		, "dateTimeFormat": function(dateObj){ 
			//TODO: clean up time to 12 hour clock?
			return dateObj.getMonth() + "/" + dateObj.getDate() + "/" + dateObj.getFullYear() + " " + dateObj.getHours() + ":" + dateObj.getMinutes();
		}
		, "percentage": function(num) {
			return Math.round(num * 100) + "%";
		}
		, "isNumber": function(num) {
			return (typeof(num) == "number") && !isNaN(num);
		}
		//via http://beardscratchers.com/journal/using-javascript-to-get-the-hostname-of-a-url
		, "hostname": function(str) {
			var re = new RegExp('^(?:f|ht)tp(?:s)?\://([^/]+)', 'im');
			return str.match(re)[1].toString();
		}
});



  
var sox = require('./sockets'),
	listeners = require('./listeners'),
	cronjobs = require('./cronjobs');

sox.init(app);
listeners.init(app);

//cronjobs.search(app, '15 * * * * *');


cronjobs.crawl(app);

cronjobs.createTextures(app);





// LOAD THE QUEUE FROM THE DB INTO MEMORY //
app.WebSearchQueryQueue.find().sort("date", -1, "processed", -1).limit(20).execFind(function(err, results) {
//app.WebSearchQueryQueue.find({"processed": false}).sort("date", -1).execFind(function(err, results) {
	if (!err) {
		var sq = [];
		results.forEach(function(el, idx, arr) {
			sq.push({"term": el.query, "processed": el.processed});
		});
		console.log(sq);
		app.set("visualizationSearchQueue", sq);
	}
	else {
		console.log(err);
	}
});



//app.WebSearchQueryQueue.findOne({"processed": true }, {}, {"sort": {"date": -1}}, function(err, result) {
//	app.emit('visualizationSearchQueue.processedOne', "romney");
//});


//TODO: UPDATE QUEUE... keep 2 separate queues
app.on("visualizationSearchQueue.texturesGenerated", function(ws) {
	console.log("GENERATED TEXTURES FOR : " + ws.query);
});


/**
 * Start it.
 */
var port = process.env.PORT || 3000;
app.listen(port, function () {
    var addr = app.address();
    app.set("basedomain", 'http://' + addr.address + ':' + addr.port);
	console.log('    app listening on ' + app.set("basedomain"));
    console.log('    NODE_ENV = ' + process.env.NODE_ENV);
});