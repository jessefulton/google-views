var search = function(user, query, onStdout, onStderr) {
	console.log("running cron-search");

	var	spawn = require('child_process').spawn;
		
	var cmd = "casperjs";
	var casperArgs = user.tor ? user.tor : [];
	var script = [__dirname + '/../scripts/search.js'];
	var scriptArgs = ["--email=" + user.email, "--password=" + user.password, "--query=" + query];
	var cspr = spawn(cmd, casperArgs.concat(script, scriptArgs));
	  
	cspr.stdout.setEncoding('utf8');
	cspr.stdout.on('data', onStdout);
	
	cspr.stderr.setEncoding('utf8');
	cspr.stderr.on('data', onStderr);
	
	cspr.on('exit', function (code) {
		console.log('child process exited with code ' + code);
		process.exit(code);
	});
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