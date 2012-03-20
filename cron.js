var	spawn = require('child_process').spawn;

var bin = "casperjs"
var args = ['scripts/crawl.js', './conf/config.js', './screenshots/'];
var cspr = spawn(bin, args);
  
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
