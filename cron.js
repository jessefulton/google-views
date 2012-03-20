var	spawn = require('child_process').spawn;

var bin = "casperjs"
var args = ['scripts/googlelinks.js'];
var cspr = spawn(bin, args);
  
cspr.stdout.setEncoding('utf8');
cspr.stdout.on('data', function (data) {
	var str = data.toString(), regex = /\r?\n/g;
	var lines = str.split(regex);
	for (var i=0; i<lines.length; i++) {
  		var parts = lines[i].split(/\t/g);
		console.log("OUT " + i + ": "); // + lines[i]);  	
  		for (var j=0; j<parts.length; j++) {
			console.log("\t" + parts[j]);
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
