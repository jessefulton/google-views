var cronJob = require('cron').CronJob
	, async = require('async')
	, searcher = require('./lib/searcher')
	, importer = require('./lib/import')
	, users = require('./config').get("users")
	, fs = require('fs');

var imageProcessing = require('./lib/imageprocessing')
	, utils = require('./lib/utils');


var searcher = require('./lib/searcher');

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
			"cronTime": cronTime ? cronTime : '0 */2 * * * *',
			"onTick": function() {
			
				//TODO: What if search (not search queueu) already exists?
				app.WebSearchQueryQueue.findOne({"processState": "waiting" }, {}, {"sort": {"date": -1}}, function(err, result) {
					if (!err && result) {
						console.log("processing search queue item from cron");
						searcher.process(result, users, app);
					}
					else {
						console.log('nothing in search queue');
					}
				});

			},
			"start": true
		});
		job.start();


	}
	
	
	
	//TODO: add callback (or something) in order to fix "error" state of associated wsq
	, "createTextures": function(app) {

		app.on("texture.missing", function(url) {
			var q = app.get('textureGenerationQueue');
			q.push(url);
			q = utils.unique(q);
			app.set('textureGenerationQueue', q);
			
			console.log("ADDED MISSING TEXTURE TO QUEUE: " + url);
			console.log(JSON.stringify(q));
			
		});

		/*
		//listen for calls to add elements to queue
		app.on('textures-queue-add', function(els) {
			files.push.apply(files, ensureArray(els));
		});
		*/
		
		//var crawlFn = require('./cron-textures.js');
		var job = new cronJob({
		  cronTime: '0 * * * * *',
		  onTick: function() {
  			var queue = app.get('textureGenerationQueue');
		  	if (queue.length > 0) {
		  		var url = queue.shift();
		  		
		  		//TODO: track count of errors, if over thresh, insert dummy tex
			  	imageProcessing.generateAndSaveTexture(app, url, function(err) {
			  		if (err) { console.log("Error generating texture "+ url); }
			  		else { console.log("genereated texture " + url); }
			  	});
		  		//open image magick
		  		//convert png to jpg
		  		//app.emit(texture filename)

		  	}
		  
		  }
		});
		job.start();
		
	}

//	, "dbimport"
//	, "imageprocessUpload (make sure to update DB)

	//inserts data into database
	, "dbimport": function(app) {
	
		var dataDir = app.get('crawldatadir')
			, renderDir = app.get('renderdir')
			, model = app.CrawledPage;
	
		
	
		var job = new cronJob({
		  cronTime: '0 10 * * * *',
		  onTick: function() {
		  		importer(dataDir, renderDir, model, function(obj, isLast) {
		  			if (isLast) { console.log("finished dbimport"); }
		  		});
		  }
		});
		job.start();
	}
	
	, "crawl": function(app) {

		var crawlFn = require('./lib/crawl.js');
		var RENDER_DIR = app.get('renderdir');
		var CRAWL_DATA_DIR = app.get('crawldatadir');
		
		var now = new Date();
		
		var userIdx = Math.floor(Math.random() * users.length);
		var seedIdx = Math.floor(Math.random() * users[userIdx].seeds.length);
		
		console.log("USER INDEX: " + userIdx + "; SEED INDEX: " + seedIdx);
		
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
			//cronTime: '0 0,10,20,30,40,50 * * * *',
			cronTime: '0 0,20,40 * * * *',
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