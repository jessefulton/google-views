if (!process.env.NODE_ENV) process.env.NODE_ENV = "development";


/**
 * Module dependencies.
 */
var express = require('express')
	, stylus = require('stylus')
	, nib = require('nib')
	, sio = require('socket.io')
	, http = require('http')
	, spawn = require('child_process').spawn
	, fs = require('fs');
	
var models = require('./models');
var cronjobs = require('./cronjobs');

var mongoose = require('mongoose')
	, Schema = mongoose.Schema
	, ObjectId = mongoose.SchemaTypes.ObjectId;




var config = {};
config.site = require('./config').init(["MONGODB_URI","LOGGLY_SUBDOMAIN","LOGGLY_INPUT_KEY"], "./conf/site.js");


config.users = require("./conf/users.js").users;

console.log(JSON.stringify(config));


var app = express.createServer();
cronjobs.init(app);
app.configure(function(){
	//app.db = redis.createClient();
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.set('case sensitive routes', true);
	//let's change this to a local dir? then rsync to media server or use nginx?
	app.set('screenshots', '/tmp');
	app.set('root', __dirname);
	app.set('outputdir', __dirname + "/public/_generated");
	app.use(express.favicon());
	app.use(stylus.middleware({ src: __dirname + '/public', compile: compile }))
	app.use(express.static(__dirname + '/public'));
	app.use(app.router);
  
	function compile (str, path) {
		return stylus(str)
			.set('filename', path)
			.use(nib());
	};
  
});


app.configure('development', function(){
	app.use(express.logger('dev'));
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});



models.defineModels(mongoose, function() {
	app.CrawledPage = mongoose.model('crawledpage');
	mongoose.connect(config.site.MONGODB_URI);
    mongoose.connection.on("open", function() {
        console.log("opened connection to database!");
    });
});



/**
 * App routes.
 */
app.get('/', function (req, res) {
	res.render('index', { layout: true });
});
app.get('/about', function (req, res) {
	res.render('about', { layout: true });
});
app.get('/personas', function (req, res) {
	res.render('personas', { layout: true, personas: config.users });
});
app.get('/stream', function (req, res) {
	res.render('stream', { layout: true});
});
app.get('/crawled/:pageId', function (req, res, next) {
	app.CrawledPage.findById(req.params.pageId, function(err, result) {
		if (!err) {
			//TODO: if games empty, display message
			res.render('crawled-view', {
				layout: true
				, locals: { 
					"bodyClasses": "history"
					, "result": result
				}
			});
		}
		else {
			console.log(err);
			next();

		}
	});
});

app.get('/crawled/:userId', function (req, res, next) {

	//db.crawledpages.find({"user": "jesseinla2@gmail.com"}, {"title":1});
	console.log("looking for user: " + req.params.userId);
	app.CrawledPage.find({"user": req.params.userId}, {}).execFind(function(err, results) {
		if (!err) {
			res.render('crawled-list', {
				layout: true
				, locals: { 
					"bodyClasses": "history"
					, "results": results
				}
			});
		}
		else {
			console.log(err);
			next();

		}
	});
});

app.get('/crawled', function (req, res, next) {
	var pgNum = 1; //req.params.pageNumber ? req.params.pageNumber : 1;
	var nPerPage = 100;
	var query = {};
	var fields = {};
	//var opts = {sort: [['date', "ascending"]], limit:100};
	var opts = {limit:100};
	console.log("looking for crawled pages");

	var userEmails = (function() {
		var ret = [];
		config.users.forEach(function(el, idx, arr) {
			ret.push(el.email);
		});
		return ret;
	})();

	console.log(userEmails);

 	app.CrawledPage.find(query, fields).skip((pgNum-1)*nPerPage).limit(nPerPage).execFind(function(err, results) {
		if (!err) {
			app.CrawledPage.count(function(err2, cnt) {
				if (err2) {
					console.log(err2);
					res.send('error finding count', 500);
				} else {
					pageCount = Math.ceil(cnt / nPerPage);
					//TODO: if games empty, display message
					res.render('crawled-list', {
						layout: true
						, locals: { 
							"bodyClasses": "history"
							, "results": results
							, "pageCount": pageCount
							, "users": userEmails
						}
					});

				}
			});
		}
		else {
			console.log(err);
			res.send('couldn\'t find anthying', 404);
		}
	});
});

app.get('/search/:query', function (req, res) {
	var u = [];
	config.users.forEach(function(el, idx, arr) {
		u.push(el.email.toLowerCase());
	});
	res.render('search-view', { layout: true, "users":u, "query": req.params.query });
});

/**
 * App routes.
 */
app.get('/screenshots/searches/:username/:query', function (req, res) {
	var query = req.params.query;
	
	console.log(query + " " + query.indexOf(".png", query.length -4));
	
	if (query.indexOf(".png", query.length - 4) === -1) {
		res.send("invalid request", 500);
		return;
	}
	else {
		query = query.slice(0, -4);
	}
	var userEmail = req.params.username;
	var userPass = "";
	config.users.forEach(function(el, idx, arr) {
		if (el.email.toLowerCase() == userEmail.toLowerCase()) {
			userPass = el.password;
		}
	});
	
	if (!userPass) {
		res.send("Invalid user", 500);
		return;
	}
	

	var filename = "public/screenshots/searches/" + userEmail + "/" + query + ".png";
	
	var bin = "casperjs";
	var args = ["./scripts/search.js", "--email=" + userEmail, "--password=" + userPass, "--query=\"" + query + "\"", "--filename=" + filename];
	

	console.log("About to run casperjs");
	console.log(args);

	var cspr = spawn(bin, args);
  
	cspr.stdout.on('data', function (data) {
		console.log('stdout: ' + data);
	});
	
	cspr.stderr.on('data', function (data) {
		console.log('stderr: ' + data);
	});
	
	cspr.on('exit', function (err) {
		console.log('child process exited with code ' + err);
		if (err) res.send(err, 500);
		//console.log('screenshot - rasterized %s', url);
		//magic!
		//app.emit('screenshot', url, options.path, id);
		res.sendfile(filename);
	});
  


});





/**
 * GET serve when already rasterized.
 */

app.get('/screenshots/textures/:filename', function(req, res, next){
	//if file exists: public/screenshots/id
	//convert to 1024x512
	
	try {
		var fStats = fs.lstatSync("./public/screenshots/" + req.params.filename);
	
		if (fStats.isFile()) {
			//TODO: imagemagick - convert -crop to 1024x1024
			res.send("found source image - next to create thumbnail...", 200);
			return;
		}
	}
	catch(e) {
	
	}
	finally {
			res.send("There was an error processing your request", 500);
			return;	
	}
	
	var cspr = spawn(bin, args);
  
	cspr.stdout.on('data', function (data) {
		console.log('stdout: ' + data);
	});
	
	cspr.stderr.on('data', function (data) {
		console.log('stderr: ' + data);
	});
	
	cspr.on('exit', function (err) {
		console.log('child process exited with code ' + err);
		if (err) res.send(err, 500);
		//console.log('screenshot - rasterized %s', url);
		//magic!
		//app.emit('screenshot', url, options.path, id);
		res.sendfile(filename);
	});
  
});



/**
 * App routes.
 */
app.get('/screenshots/view/:username/:site', function (req, res) {
	var site = req.params.site;
	
	if ( !(site == "news" || site == "youtube")) {
		res.send("invalid request", 500);
		return;
	}


	var userEmail = req.params.username;
	var userPass = "";
	config.users.forEach(function(el, idx, arr) {
		if (el.email.toLowerCase() == userEmail.toLowerCase()) {
			userPass = el.password;
		}
	});
	
	if (!userPass) {
		res.send("Invalid user", 500);
		return;
	}
	
	var theUrl = (site == "news") ? "http://news.google.com/" : "http://www.youtube.com/";
	

	var filename = "public/screenshots/" + userEmail + "/sites/" + site + ".png";
	
	var bin = "casperjs";
	var args = ["./scripts/view.js", "--email=" + userEmail, "--password=" + userPass, "--url=" + theUrl + "", "--filename=" + filename];
	

	console.log("About to run casperjs");
	console.log(args);

	var cspr = spawn(bin, args);
  
	cspr.stdout.on('data', function (data) {
		console.log('stdout: ' + data);
	});
	
	cspr.stderr.on('data', function (data) {
		console.log('stderr: ' + data);
	});
	
	cspr.on('exit', function (err) {
		console.log('child process exited with code ' + err);
		if (err) res.send(err, 500);
		//console.log('screenshot - rasterized %s', url);
		//magic!
		//app.emit('screenshot', url, options.path, id);
		res.sendfile(filename);
	});
  


});





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





/**
 * Socket.IO server (single process only)
 */
var io = sio.listen(app);
io.set('log level', 1);


io.set('transports', [
	'websocket'
	, 'flashsocket'
	, 'htmlfile'
	, 'xhr-polling'
	, 'jsonp-polling'
]);


io.sockets.on('connection', function (socket) {
	socket.emit('news', { hello: 'world' });
	socket.on('my other event', function (data) {
		console.log(data);
	});
  
		app.on('crontick', function(el) {
			socket.emit('news', {"content": "app.on " + el});
		});
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