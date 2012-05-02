var crawl = function(user, seed, imageDir, jsonDir, onStdout, onStderr, onComplete) {
	console.log("running cron-crawl");
	console.log(JSON.stringify(user));
	console.log(JSON.stringify(seed));
	var	spawn = require('child_process').spawn;
	
	
	//TODO: crawl multiple seeds...
	
	var cmd = "casperjs";
	var casperArgs = user.proxy ? ["--proxy=" + user.proxy.url, "--proxy-type=" + user.proxy.type] : [];
	var script = [__dirname + '/../scripts/crawl.js'];
	var scriptArgs = ["--email=" + user.email, "--password=" + user.password, "--seed=" + seed.url, "--selector=" + seed.selector, '--image-output='+imageDir, '--json-output='+jsonDir];
	var cspr = spawn(cmd, casperArgs.concat(script, scriptArgs));
	  
	cspr.stdout.setEncoding('utf8');
	cspr.stdout.on('data', onStdout);
	
	cspr.stderr.setEncoding('utf8');
	cspr.stderr.on('data', onStderr);
	
	
	cspr.on('exit', function (code) {
		console.log('child process exited with code ' + code);
		//process.exit(code);
		if (onComplete) { onComplete(code); }
	});
}

module.exports = crawl;


if (require.main === module) { //run via command line, execute!
	console.log("starting up");
	var users = require('../conf/users.js').users;
	var argv = require('optimist').argv;
	
	var user = users[(typeof(argv._[0]) === "undefined" ? 0 : argv._[0])];
	var seed = user.seeds[(typeof(argv._[1]) === "undefined" ? 0 : argv._[1])];
	
	
	
	if (!user) {
		console.log("Error getting user at index %d", argv._[0]);
		console.log("exiting...");
		process.exit();
	}

	crawl(
		user
		, seed
		, './public/rendered/'
		, './data/'
		, function (data) {
			console.log(data);
			return;
		}
		, function (data) {
			var str = data.toString(), regex = /(\r?\n)/g;
			console.log("ERR: " + str.replace(regex, '$1ERR: '));
		}
		, function() {
			console.log("COMPLETE!");
		}
	);
}
