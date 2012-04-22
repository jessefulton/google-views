var	spawn = require('child_process').spawn;
	
var search = function(user, query, callback, onStdout, onStderr) {
	console.log("setting timeout for search function");
	setTimeout(function() {
		console.log("running cron-search");
		console.log("\t" + JSON.stringify(user));
		console.log("\t" + query);
	
			
		var cmd = "casperjs";
		var casperArgs = user.tor ? user.tor : [];
		var script = [__dirname + '/../scripts/search.js'];
		var scriptArgs = ["--email=" + user.email, "--password=" + user.password, "--query=" + query];
		
		console.log('about to run: ' + cmd + " " + casperArgs.concat(script, scriptArgs))
		
		var cspr = spawn(cmd, casperArgs.concat(script, scriptArgs));
	
		console.log('command executed');
		
		cspr.stdout.setEncoding('utf8');
		cspr.stdout.on('data', onStdout);
		
		cspr.stderr.setEncoding('utf8');
		cspr.stderr.on('data', onStderr);
		
		cspr.on('exit', function (code) {
			console.log("casper search exiting with code " + code);
			callback(code);
			//process.exit(code);
		});
	}, 5000);
}

module.exports = search;

if (require.main === module) { //run via command line, execute!
	console.log("starting up");
	var users = require('../conf/users.js').users;
	var argv = require('optimist').argv;
	
	var user = users[(typeof(argv._[0]) === "undefined" ? 0 : argv._[0])];
	var query = argv._[1];
	
	if (!user) {
		console.log("Error getting user at index %d", argv._[0]);
		console.log("exiting...");
		process.exit();
	}

	search(
		user
		, query
		, function() { console.log("completed"); }
		, function (data) {
			console.log("std in " + data);
			var links = JSON.parse(data);
			console.log(JSON.stringify(links));
			
			
			//TODO: ADD THIS TO THE DATABASE!!!!
			
			
			return;
		}
		, function (data) {
			var str = data.toString(), regex = /(\r?\n)/g;
			console.log("ERR: " + str.replace(regex, '$1ERR: '));
		}
	);
}