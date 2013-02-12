var	spawn = require('child_process').spawn;
var async = require('async');



var _doSearch = function(user, query, callback, onStdout, onStderr) {

console.log("doing search for " + query);
console.log(user);

	setTimeout(function() {
		console.log("cron-search [RUN]: " + JSON.stringify(user.email) + " - " + query);
			
		var cmd = "casperjs";
		var casperArgs = user.proxy ? ["--proxy=" + user.proxy.url, "--proxy-type=" + user.proxy.type] : [];
		
		var script = [__dirname + '/../scripts/search.js'];
		var scriptArgs = ["--email=" + user.email, "--password=" + user.password, "--query=" + query];
		
		
		
		var cspr = spawn(cmd, casperArgs.concat(script, scriptArgs));

		
		cspr.stdout.setEncoding('utf8');
		cspr.stdout.on('data', onStdout);
		
		cspr.stderr.setEncoding('utf8');
		cspr.stderr.on('data', onStderr);
		
		
		cspr.on('exit', function (code) {
			console.log("cron-search [EXIT]: " + JSON.stringify(user.email) + " - " + query + " (" + code + ")");
			callback(code);
		});
	}, 5000);
}

var search = function(query, user, callback) {

		var links = [];
				
		_doSearch(
			user
			, query
			, function(code) { 
				if (code === 0) {
					code = null;
				}
				callback(code, links);
			}
			, function(data) {
				console.log("DATA: " + data);
				var l = JSON.parse(data);
				links = links.concat(l);
				//saveLinks(queueItem.query, user.email, links);
			}
			, function(errData) {
				console.log("error searching: " + errData);
			}
		);

				
}



var process = function(wsq, users, app) {

console.log("Processing search for " + wsq.query);

	wsq.processState = "searching";
	wsq.save(function(err, result) {
		if (err) {
			console.log("%%%% PROCESSING SEARCH [ERR]: " + err);
		}
		
		console.log("searcher.process");
		console.log(JSON.stringify(result));
		
		var query = result.query;
		
		console.log('processing search for ' + result.query);
		
		async.forEachSeries(users
			, function(user, cb) {
				var email = user.email
		
				search(result.query, user, function(searchErr, links) {
					if (searchErr) {
						console.warn("Error searching: " + searchErr);
					}
					console.log("Found links " + JSON.stringify(links));
					app.WebSearch.findOne({"query": query}, function(err, ws) {
						if (err) {
							console.warn("Error searching for " + query + " on user " + user.email);
							console.warn(err);
							return cb(err);
						}
						
						if (!ws) {
							ws = new app.WebSearch({"query": query});
						}
			
						var cs = new app.ClientWebSearch({clientId: email, results: links});
						ws.searches.push(cs);
						
						ws.save(function(err2, newObj) {
							if (err2) {
								console.log("Error saving websearch");
								console.log(err);
							}
							cb();
						});
					});				
				});
				
			}
			, function(e) {
				console.log("FINISHED SEARCHES!! SAVING!");
				result.processState = "complete";
				result.save(function(err, savedObj) {
					if (!err) {
						app.emit("visualizationSearchQueue.finishedSearch", savedObj);
					}
				});
		});
	});
}





module.exports.search = search;
module.exports.process = process;



if (require.main === module) { //run via command line, execute!
	console.log("starting up");
	var users = require('./config').get("users"); //../conf/users.js').users;
	var argv = require('optimist').argv;
	
	var user = users[(typeof(argv._[0]) === "undefined" ? 0 : argv._[0])];
	var query = argv._[1];
	
	if (!user) {
		console.log("Error getting user at index %d", argv._[0]);
		console.log("exiting...");
		process.exit();
	}

	search(
		query
		, user
		, function(err, links) {
			if (err) { console.warn(err); }
			console.log(JSON.stringify(links));
		}
	);
}

