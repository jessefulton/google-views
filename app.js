if (!process.env.NODE_ENV) process.env.NODE_ENV = "development";


/**
 * Module dependencies.
 */
var express = require('express')
	, stylus = require('stylus')
	, http = require('http')
	, redis = require('redis');


var config = require('./conf/config.js');

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



/**
 * App routes.
 */
app.get('/', function (req, res) {
	res.render('index', { layout: true });
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