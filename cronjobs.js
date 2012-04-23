var cronJob = require('cron').CronJob
	, async = require('async')
	, searcher = require('./lib/searcher.js')
	, users = require('./conf/users.js').users
	, fs = require('fs');


var ensureArray = function(a, b, n) {
	if (arguments.length === 0) return [];            //no args, ret []
	if (arguments.length === 1) {                     //single argument
		if (a === undefined || a === null) return [];   //  undefined or null, ret []
		if (Array.isArray(a)) return a;                 //  isArray, return it
	}
	return Array.prototype.slice.call(arguments);     //return array with copy of all arguments
}

module.exports = {
	"test": function(app) {
		var job = new cronJob({
		  cronTime: '*/5 * * * * *',
		  onTick: function() {
			var randomString = (function() {
				var text = "";
				var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
			
				for( var i=0; i < 15; i++ )
					text += possible.charAt(Math.floor(Math.random() * possible.length));
				return text;
			})();
			app.emit("crontick", randomString);
		  },
		  start: true
		});
		job.start();
	}
	
	
	
	, "search": function(app, cronTime) {
		var job = new cronJob({
			"cronTime": cronTime ? cronTime : '0 * * * * *',
			"onTick": function() {

				app.WebSearchQueryQueue.findOne({"processed": false }, {}, {"sort": {"date": -1}}, function(err, result) {
					if (!err && result) {
							var query = result.query;
							
							
							async.forEachSeries(users
								, function(user, cb) {
									var email = user.email
							
									searcher.search(result.query, user, function(links) {
										app.WebSearch.findOne({"query": query}, function(err, ws) {
											if (!err && ws) {
												console.log("===found one!");
											}
											else {
												console.log("Couldn't find record for " + query);
												ws = new app.WebSearch({"query": query});
											}
								
											var cs = new app.ClientWebSearch({clientId: email, results: links});
											ws.searches.push(cs);
											
											ws.save(function(err, newObj) {
												if (err) {
													console.log("Error saving websearch");
												}
												cb();
											});
										});				
									});
									
								}
								, function(e) {
									console.log("FINISHED SEARCHES!! SAVING!");
									result.processed = true;
									result.save(function(err, savedObj) {
										if (!err) {
											app.emit("visualizationSearchQueue.processedOne", savedObj.query);
										}
									});
							});
					}
					else {
						if (err) {
							console.log(err);
						}
						else { 
							console.log("ran search cron job, but nothing in queue");
						}
					}
				});

		  },
		  "start": true
		});
		job.start();


	}
	
	
	, "createTextures": function(app) {
		var files = [];
		
		//listen for calls to add elements to queue
		app.on('textures-queue-add', function(els) {
			files.push.apply(files, ensureArray(els));
		});
		/*
		var crawlFn = require('./cron-textures.js');
		var job = new cronJob({
		  cronTime: '0 * * * * *',
		  onTick: function() {
		  	if (files.length > 0) {
		  		//open image magick
		  		//convert png to jpg
		  		//app.emit(texture filename)

		  	}
		  
		  }
		});
		job.start();
		*/
	}

//	, "dbimport"
//	, "imageprocessUpload (make sure to update DB)

	//inserts data into database
	, "process": function(app) {
		
	}
	
	, "crawl": function(app) {

		var crawlFn = require('./lib/crawl.js');
		var RENDER_DIR = app.set('renderdir');
		var CRAWL_DATA_DIR = app.set('crawldatadir');
		var userIdx = 0;
		var seedIdx = 0;
		
		var onStdout = function(data) {
			var str = data.toString(), regex = /\r?\n/g;
			var lines = str.split(regex);
			for (var i=0; i<lines.length; i++) {
				var parts = lines[i].split(/\t/g);
				if (parts.length > 1) {
					if (parts[0] == "USR") { 
						app.emit('crawl output', {"type": "user", "email": parts[1]});
					}
					if (parts[0] ==  "CMD" ) {
						app.emit('crawl output', {"type": "command", "url": parts[1], "title": parts[2], "image": parts[3]});
					}
				}
			}
		};
		
		var onStderr = function(data) {
			var str = data.toString(), regex = /(\r?\n)/g;
			app.emit('crawl output', {"type": "error", "message": str.replace(regex, '$1ERR: ')});
		};
		
		var job = new cronJob({
			cronTime: '0 58 * * * *',
			onTick: function() {
				
			
			
				console.log('starting crawl job');
				var user = users[userIdx];
				var seed = user.seeds[seedIdx];

				//TODO: replace directories with settings from app
				crawlFn(user, seed, RENDER_DIR, CRAWL_DATA_DIR, onStdout, onStderr);			

				if (++seedIdx >= user.seeds.length) {
					seedIdx = 0;
					userIdx++;
				}
				if (userIdx >= users.length) { 
					userIdx = 0;
				}
		  }
		});
		job.start();	
	}

};