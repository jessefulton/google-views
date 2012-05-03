//via https://github.com/joshdevins/node-rate-limiter-proxy/blob/master/utils.js
var getNewXForwardedForHeader = function(request) {
	var value = request.headers['x-forwarded-for'];
	if (value != null) {
		return value + ", " + request.socket.remoteAddress;
	} else {
		return request.socket.remoteAddress;
	}
}


module.exports.init = function(app) {

	var config = app.set('config')
		, spawn = require('child_process').spawn
		, fs = require('fs');
	
	
	/**
	 * App routes.
	 */
	app.get('/', function (req, res) {
		var ref = (req.headers.referer);
		var KYM = false;
		if (ref && ref.toLowerCase().indexOf("knowyourmeme.com") != -1) {
			KYM = true;
		}
		
		var q = app.set('visualizationSearchQueue');			
		//console.log("# Submitted: " + req.session.submitted);
		res.render('index', { layout: true, queue: q, kym: KYM });
		
		
	});
	app.get('/about', function (req, res) {
		res.render('about', { layout: true });
	});
	
	/*
	app.get('/personas', function (req, res) {
		res.render('personas', { layout: true, personas: config.users });
	});
	app.get('/stream', function (req, res) {
		res.render('stream', { layout: true });
	});
	*/
	
	app.get('/visualize', function (req, res) {
		res.render('visualize', { layout: false });
	});


	/** 
	* Adds an item to the search queue. If item already exists, error printed to page.
	*/
	app.post('/', function (req, res) {
			console.log('adding to queue');
			var term = req.body.q;
			var err = null;
			term = term.toLowerCase().trim();

			var q = app.set('visualizationSearchQueue');			

			if (!term || term == '') {
				res.render('index', { layout: true, "term": term, queue: q, error: "can't search empty query" });
				return;
			}
			
			
			var addTerm = function(savedObj) {
			
				var rateLimitTable = app.set('rateLimitTable');
				var userIp = getNewXForwardedForHeader(req);
				if (!rateLimitTable[userIp]) {
					rateLimitTable[userIp] = {};
				}
	
				var submissions = rateLimitTable[userIp].submissions;
				if (!submissions) { submissions = 0; }
			
				//if (req.session.submitted && req.session.submitted > 1) {
				if (submissions > 1) {
					err = "Too many queries submitted";
					return false
				}
				else {
					q.push(savedObj); //{"term": savedObj.query, "processState": savedObj.processState })
					if (q.length > app.set('visualizationSearchQueue.maxSize')) {
						q.shift();
					}
					app.set('visualizationSearchQueue', q)
					
					

					submissions++;
					rateLimitTable[userIp].submissions = submissions;
					app.set('rateLimitTable', rateLimitTable);
					console.log(rateLimitTable);
					return true;					
					
					//req.session.submitted = req.session.submitted ? (req.session.submitted + 1) : 1;
					//return true;
				}
				
			}
			

			var wsqq = new app.WebSearchQueryQueue({"query": term});
			wsqq.save(function(saveErr, savedObj) {

				if (!saveErr) {
					if (addTerm(savedObj)) {
						app.emit('visualizationSearchQueue.add', savedObj, q);
					}
				}
				else {
					//TODO: if not in queue, let's add it...
					
					//TODO: This should findOne from DB
					
					
					//not savedObj - findOne()
					var worked = false;
					if (savedObj) {
						savedObj.created = new Date();
						savedObj.save();
						for (var i=0; i<q.length; i++) {
							if (i.query == savedObj.query) {
								addTerm(savedObj);
								//app.emit('visualizationSearchQueue.add', savedObj, q);
								worked = true;
								break;
							}
						}
					}
					if (!worked) {
						console.log(saveErr);
						err = "'" + term + "' is already queued";
					}
				}
				
				
				if (err || req.body.mobile == "true") {
					res.render('index', { layout: true, "term": term, queue: q, error: err });
				}
				else {
					res.redirect('/visualize');
				}
				
			});

		

	});


	/** 
	* Displays queue
	*/
	app.get('/queue', function (req, res) {
		console.log('showing queue');
		var q = app.set('visualizationSearchQueue');
		console.log(q);
		res.render('queue', { layout: true, queue: q });
	});


	/**
	*
	*/
	app.get('/crawled/:pageId', function (req, res, next) {
		app.CrawledPage.findById(req.params.pageId, function(err, result) {
			if (!err && result) {
				console.log(result);
				//TODO: if games empty, display message
				res.render('crawled-view', {
					layout: true
					, locals: { 
						"bodyClasses": "history"
						, "result": result
					}
				});
			}
			else {
				console.log(err);
				next();
			}
		});
	});
	
	/**
	*
	*/
	app.get('/crawled/:userId', function (req, res, next) {
	
		//db.crawledpages.find({"user": "jesseinla2@gmail.com"}, {"title":1});
		console.log("looking for user: " + req.params.userId);
		app.CrawledPage.find({"user": req.params.userId}, {}).limit(10).sort("date", -1).execFind(function(err, results) {
			if (!err && results.length > 0) {
				console.log(results);
				res.render('crawled-list', {
					layout: true
					, locals: { 
						"bodyClasses": "history"
						, "results": results
					}
				});
			}
			else {
				res.send('couldn\'t find anthying', 404);
				//console.log(err);
				//next();
	
			}
		});
	});
	
	
	/**
	*
	*/

	//TODO: remove list of 100 pages...
	app.get('/crawled', function (req, res, next) {
		var pgNum = 1; //req.params.pageNumber ? req.params.pageNumber : 1;
		var nPerPage = 100;
		var query = {};
		var fields = {};
		//var opts = {sort: [['date', "ascending"]], limit:100};
		var opts = {limit:100};
		console.log("looking for crawled pages");
	
		var userEmails = (function() {
			var ret = [];
			config.users.forEach(function(el, idx, arr) {
				ret.push(el.email);
			});
			return ret;
		})();
	
		console.log(userEmails);
	
		app.CrawledPage.find(query, fields).skip((pgNum-1)*nPerPage).limit(nPerPage).execFind(function(err, results) {
			if (!err) {
				app.CrawledPage.count(function(err2, cnt) {
					if (err2) {
						console.log(err2);
						res.send('error finding count', 500);
					} else {
						pageCount = Math.ceil(cnt / nPerPage);
						//TODO: if games empty, display message
						res.render('crawled-list', {
							layout: true
							, locals: { 
								"bodyClasses": "history"
								//, "results": results
								, "pageCount": pageCount
								, "users": userEmails
							}
						});
	
					}
				});
			}
			else {
				console.log(err);
				res.send('couldn\'t find anthying', 404);
			}
		});
	});
	
	
	/**
	*
	*/
	app.get('/search/:query', function (req, res) {
		var u = [];
		config.users.forEach(function(el, idx, arr) {
			u.push(el.email.toLowerCase());
		});
		res.render('search-view', { layout: true, "users":u, "query": req.params.query });
	});
	


	/**
	 * App routes.
	 */
	app.get('/screenshots/searches/:username/:query', function (req, res) {
		var query = req.params.query;
		
		console.log(query + " " + query.indexOf(".png", query.length -4));
		
		if (query.indexOf(".png", query.length - 4) === -1) {
			res.send("invalid request", 500);
			return;
		}
		else {
			query = query.slice(0, -4);
		}
		var userEmail = req.params.username;
		var userPass = "";
		config.users.forEach(function(el, idx, arr) {
			if (el.email.toLowerCase() == userEmail.toLowerCase()) {
				userPass = el.password;
			}
		});
		
		if (!userPass) {
			res.send("Invalid user", 500);
			return;
		}
		
	
		var filename = "public/screenshots/searches/" + userEmail + "/" + query + ".png";
		
		var bin = "casperjs";
		var args = ["./scripts/search.js", "--email=" + userEmail, "--password=" + userPass, "--query=" + query.replace(/(\W)/gi, "\\ "), "--filename=" + filename];
		
	
		console.log("About to run casperjs");
		console.log(args);
	
		var cspr = spawn(bin, args);
	  
		cspr.stdout.on('data', function (data) {
			console.log('stdout: ' + data);
		});
		
		cspr.stderr.on('data', function (data) {
			console.log('stderr: ' + data);
		});
		
		cspr.on('exit', function (err) {
			console.log('child process exited with code ' + err);
			if (err) res.send(err, 500);
			//console.log('screenshot - rasterized %s', url);
			//magic!
			//app.emit('screenshot', url, options.path, id);
			res.sendfile(filename);
		});
	  
	
	
	});
	
	
	
	
	
	/**
	 * GET serve when already rasterized.
	 */
	app.get('/screenshots/textures/:filename', function(req, res, next){
		//if file exists: public/screenshots/id
		//convert to 1024x512
		
		try {
			var fStats = fs.lstatSync("./public/screenshots/" + req.params.filename);
		
			if (fStats.isFile()) {
				//TODO: imagemagick - convert -crop to 1024x1024
				res.send("found source image - next to create thumbnail...", 200);
				return;
			}
		}
		catch(e) {
		
		}
		finally {
				res.send("There was an error processing your request", 500);
				return;	
		}
		
		var cspr = spawn(bin, args);
	  
		cspr.stdout.on('data', function (data) {
			console.log('stdout: ' + data);
		});
		
		cspr.stderr.on('data', function (data) {
			console.log('stderr: ' + data);
		});
		
		cspr.on('exit', function (err) {
			console.log('child process exited with code ' + err);
			if (err) res.send(err, 500);
			//console.log('screenshot - rasterized %s', url);
			//magic!
			//app.emit('screenshot', url, options.path, id);
			res.sendfile(filename);
		});
	  
	});
	
	
	
	/**
	 * App routes.
	 */
	app.get('/screenshots/view/:username/:site', function (req, res) {
		var site = req.params.site;
		
		if ( !(site == "news" || site == "youtube")) {
			res.send("invalid request", 500);
			return;
		}
	
	
		var userEmail = req.params.username;
		var userPass = "";
		config.users.forEach(function(el, idx, arr) {
			if (el.email.toLowerCase() == userEmail.toLowerCase()) {
				userPass = el.password;
			}
		});
		
		if (!userPass) {
			res.send("Invalid user", 500);
			return;
		}
		
		var theUrl = (site == "news") ? "http://news.google.com/" : "http://www.youtube.com/";
		
	
		var filename = "public/screenshots/" + userEmail + "/sites/" + site + ".png";
		
		var bin = "casperjs";
		var args = ["./scripts/view.js", "--email=" + userEmail, "--password=" + userPass, "--url=" + theUrl + "", "--filename=" + filename];
		
	
		console.log("About to run casperjs");
		console.log(args);
	
		var cspr = spawn(bin, args);
	  
		cspr.stdout.on('data', function (data) {
			console.log('stdout: ' + data);
		});
		
		cspr.stderr.on('data', function (data) {
			console.log('stderr: ' + data);
		});
		
		cspr.on('exit', function (err) {
			console.log('child process exited with code ' + err);
			if (err) res.send(err, 500);
			//console.log('screenshot - rasterized %s', url);
			//magic!
			//app.emit('screenshot', url, options.path, id);
			res.sendfile(filename);
		});
	  
	
	
	});
	



}