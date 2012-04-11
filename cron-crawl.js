var	spawn = require('child_process').spawn;
var users = require('./conf/users.js').users;
var argv = require('optimist').argv;

var user = users[(typeof(argv._[0]) === "undefined" ? 0 : argv._[0])];
var seed = user.seeds[(typeof(argv._[1]) === "undefined" ? 0 : argv._[1])];



if (!user) {
	console.log("Error getting user at index %d", argv._[0]);
	console.log("exiting...");
	process.exit();
}


//TODO: crawl multiple seeds...

var cmd = "casperjs";
var casperArgs = user.tor ? user.tor : [];
var script = [__dirname + '/scripts/crawl.js'];
var scriptArgs = ["--email=" + user.email, "--password=" + user.password, "--seed=" + seed.url, "--selector=" + seed.selector, '--image-output=./public/screenshots/', '--json-output=./data/'];
var cspr = spawn(cmd, casperArgs.concat(script, scriptArgs));
  
cspr.stdout.setEncoding('utf8');
cspr.stdout.on('data', function (data) {
	var str = data.toString(), regex = /\r?\n/g;
	var lines = str.split(regex);
	for (var i=0; i<lines.length; i++) {
  		var parts = lines[i].split(/\t/g);
		//console.log("OUT " + i + ": " + lines[i]);  	
		
		
		if (parts.length > 1) {
			if (parts[0] == "USR") { 
				var email = parts[1];
				console.log("NEW USER: " + email);
			}
			if (parts[0] ==  "CMD" ) {
				var url = parts[1];
				var title = parts[2];
				var imageName = parts[3];
				console.log("\turl: " + url);
				console.log("\ttitle: " + title);
				console.log("\timage: " + imageName);
			}
		}
		
	}
});

cspr.stderr.setEncoding('utf8');
cspr.stderr.on('data', function (data) {
	var str = data.toString(), regex = /(\r?\n)/g;
	console.log("ERR: " + str.replace(regex, '$1ERR: '));
});


cspr.on('exit', function (code) {
	console.log('child process exited with code ' + code);
	process.exit(code);
});
