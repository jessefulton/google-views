if (!process.env.NODE_ENV) process.env.NODE_ENV = "development";

/**
 * Module dependencies.
 */
var express = require('express')
	, http = require('http')
	, winston = require('winston');
	
var models = require('./models')
	, routes = require('./routes');

var mongoose = require('mongoose')
	, Schema = mongoose.Schema
	, ObjectId = mongoose.SchemaTypes.ObjectId;





var config = require('./config');

models.GoogleUser.find({}, function(err, users) {
	if (err) {
		winston.warn("Error finding google users");
	}
	/*
	if (!users || users.length == 0) {
		users = require("./conf/users.json").users;
		users.forEach(function(user) {
			var dbUser = new models.GoogleUser(user);
			dbUser.save(function(saveErr) {
				winston.debug("saved user " + user.email);
			})
		});

	}
	*/
	config.set("users", users);
	winston.debug("Configured " + users.length + " google users");
	//winston.debug(users);
});



/*
var uploader = require('./lib/uploader');

var u = new uploader();
u.init(config.site);
//https://s3.amazonaws.com/everybodysgoogle/test/file2.png
u.upload("/test/file2.png", "./tor.png", function(err) { winston.debug(err); });
*/


var app = express();
var server = http.createServer(app);



app.configure(function(){
	app.use(express.bodyParser());
	app.use(express.cookieParser());
	app.use(express.session({ secret: "pleasedontspamme" }));
	
	app.set('rateLimitTable', {});

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

	app.set('visualizationSearchQueue.maxSize', 15);
	
	
	//app.set('config', config);
	
	
	
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



app.CrawledPage = models.CrawledPage; //mongoose.model('crawledpage');
app.WebSearch = models.WebSearch; //mongoose.model('websearch');
app.ClientWebSearch = models.ClientWebSearch; //mongoose.model('clientwebsearch');
app.WebSearchQueryQueue = models.WebSearchQueryQueue; //mongoose.model('websearchqueryqueue');





routes.init(app);


// Template helpers
// ----------------
app.locals.dateFormat = function(dateObj){ 
	return dateObj.getMonth() + "/" + dateObj.getDate() + "/" + dateObj.getFullYear();
};

app.locals.dateTimeFormat = function(dateObj){ 
			//TODO: clean up time to 12 hour clock?
			return dateObj.getMonth() + "/" + dateObj.getDate() + "/" + dateObj.getFullYear() + " " + dateObj.getHours() + ":" + dateObj.getMinutes();
};

app.locals.percentage = function(num) {
	return Math.round(num * 100) + "%";
};

app.locals.isNumber = function(num) {
	return (typeof(num) == "number") && !isNaN(num);
};
		
//via http://beardscratchers.com/journal/using-javascript-to-get-the-hostname-of-a-url
app.locals.hostname = function(str) {
	var re = new RegExp('^(?:f|ht)tp(?:s)?\://([^/]+)', 'im');
	return str.match(re)[1].toString();
};


// Misc. Initialization
// --------------------
  
var sox = require('./sockets'),
	listeners = require('./listeners'),
	cronjobs = require('./cronjobs');

sox.init(server, app);
listeners.init(app);


cronjobs.search(app, '15 * * * * *');

//cronjobs.crawl(app);
//cronjobs.dbimport(app);
cronjobs.createTextures(app);






// LOAD THE QUEUE FROM THE DB INTO MEMORY //
//app.WebSearchQueryQueue.find({"processState": "complete"}).sort("date", -1, "processState", -1).limit(20).execFind(function(err, results) {
app.WebSearchQueryQueue.find({}).sort("-created -processState").limit(app.get('visualizationSearchQueue.maxSize')).execFind(function(err, results) {
	if (!err) {
		winston.debug("Web Search Query Queue");
		var sq = [];
		results.forEach(function(el, idx, arr) {
			sq.push(el);
			winston.debug(JSON.stringify(el.toJSON()));
		});
		app.set("visualizationSearchQueue", sq);
	}
	else {
		winston.warn(err);
	}
});


//TODO: on load, add all error images into generation queue...




/**
 * Start it.
 */
var port = process.env.PORT || 3000;
server.listen(port, function () {
    var addr = server.address();
    app.set("basedomain", 'http://' + addr.address + ':' + addr.port);
	winston.info('    app listening on ' + app.get("basedomain"));
    winston.info('    NODE_ENV = ' + process.env.NODE_ENV);
});