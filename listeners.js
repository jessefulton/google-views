var imageProcessing = require('./lib/imageprocessing');



/**
 *
 * via http://stackoverflow.com/a/105074/1150652
 */
function guidGenerator() {
    var S4 = function() {
       return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    };
    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}


/**
 *
 * via http://stackoverflow.com/a/7928115/1150652
 */
Array.prototype.unique = function(){
  return Object.keys(this.reduce(function(r,v){
    return r[v]=1,r;
  },{}));
}




function rasterize(url, filename, callback) {
	var	spawn = require('child_process').spawn;
	
	var cmd = "phantomjs";
	var script = [__dirname + './scripts/rasterize.js'];
	var scriptArgs = [url, filename];
	var cspr = spawn(cmd, casperArgs.concat(script, scriptArgs));
	  
	/*
	cspr.stdout.setEncoding('utf8');
	cspr.stdout.on('data', onStdout);
	
	cspr.stderr.setEncoding('utf8');
	cspr.stderr.on('data', onStderr);
	*/
	
	cspr.on('exit', function (code) {
		callback(code);
	});
}


module.exports.init = function(app) {

	app.on('searchComplete', function(query) {
		function eliminateDuplicates(arr) {
			var i, len=arr.length, out=[], obj={};

			for (i=0;i<len;i++) {
				obj[arr[i]]=0;
			}
			for (i in obj) {
				out.push(i);
			}
			return out;
		}
	
		function generateTexture(urls) {
			//remove dups from urls
			urls = eliminateDuplicates(urls);
			urls.forEach(function(url, idx, arr) {
			
				var pngFilename = guidGenerator() + ".png";
				rasterize(url, './public/rendered/'+pngFilename, function(code) {
					if (code === 0) {
						/*
						imageprocessing.convert(filename+'.png', filename+'.jpg', function() {
							imageprocessing.texture(filename+'.jpg', filename+'-tex.jpg', 1024, function() {
								
							});
						});
						*/
						app.CrawledPage.findOne({"url": url}, function(err, cp) {
							if (err || !ws) {
								cp = new app.CrawledPage({"url": url});
							}
							
							cp.png = pngFilename;
							cp.save();
						});						
					}
					else {
						console.log("error rasterizing " + url);
					}
				});
				//phantom rasterize url filename
			

			
			});
		}
	
		app.WebSearch.findOne({"query": query}, function(err, ws) {
					if (!err && ws) {
						var urls = [];
						//ClientSearch objects
						ws.searches.forEach(function(cs, csIdx, csArr) {
							cs.results.forEach(function(url, idx, arr) {
								urls.push(url);
							});
						});
						
						generateTextures(urls);
					}
		});
	});

	/*
	app.on('crontick', function(el) {
		var datastream = app.set('datastream');
		datastream.push(el);
		if(datastream.length > 10) {
			datastream.shift();
		}
		app.set('datastream', datastream);
		
		console.log(datastream);
		
		app.emit('datastream', el, datastream);
	});
	app.on('crawl output', function(obj) {
		switch (obj.type) {
			case "error": 
				var msg = obj.message;
				break;
			case "user":
				var eml = obj.email;
				break;
			case "command":
				var url = obj.url;
				var title = obj.title;
				var img = obj.image;
				break;
		}
		console.log(JSON.stringify(obj));
	});

	*/
	
	/*
	app.on('visualizationSearchQueue.add', function(obj) {
		var q = app.set('visualizationSearchQueue');
		q.push(obj);
		app.set('visualizationSearchQueue', q);
	});
	*/
	
}