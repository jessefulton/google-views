if (!process.env.NODE_ENV) process.env.NODE_ENV = "development";


/**
 * Module dependencies.
 */
var express = require('express')
	, stylus = require('stylus')
	, http = require('http');
	
var models = require('./models');

var mongoose = require('mongoose')
	, Schema = mongoose.Schema
	, ObjectId = mongoose.SchemaTypes.ObjectId;




var config = {};
config.site = require('./config').init(["MONGODB_URI","LOGGLY_SUBDOMAIN","LOGGLY_INPUT_KEY"], "./conf/site.js");


config.users = require("./conf/users.js").users;

console.log(JSON.stringify(config));


var app = express.createServer();

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
  app.use(stylus.middleware({ src: __dirname + '/public' }));
  app.use(express.static(__dirname + '/public'));
  app.use(app.router);
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



/**
 * App routes.
 */
app.get('/search/:query', function (req, res) {
	var exec = require('child_process').exec;
	var script = __dirname + '/scripts/googlelinks.js';
	var query = req.params.query;
	
	var userEmail = config.users[0].email;
	var userPass = config.users[0].password;
	
	var cookies = ""; //--cookies-file=./cookies.txt
	
	
	var cmd = ["casperjs", script];
	cmd.push("--email=" + userEmail);
	cmd.push("--password=" + userPass);
	cmd.push("--query=\"" + query +"\"");
	//cmd.push("--cookies-file=./cookies.txt");
	cmd = cmd.join(' ');
	exec(cmd, function(error, stdout, stderr) {
		console.log(error);
		console.log(stderr);
		res.writeHead(200, {"Content-Type": "text/html"});
		res.write(stdout);
		res.end();
	});

/*
	
	exec("casperjs " + script + " --email=" + userEmail + " --password=" + userPass + " --query=" + query + " " + cookies, function (error, stdout, stderr) {
		console.log(error);
		console.log(stderr);
		res.writeHead(200, {"Content-Type": "text/html"});
		res.write(stdout);
		res.end();
	});
  
*/

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