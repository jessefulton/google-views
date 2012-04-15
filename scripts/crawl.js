//see https://groups.google.com/forum/#!msg/casperjs/3t8R10N6zPo/CKi6yScMILEJ

var fs = require('fs');

var casper = require('casper').create({
	pageSettings: {
		loadImages: true
	}
    , verbose: true
    , logLevel: 'debug'
});


if (!(casper.cli.has("email")) || !(casper.cli.has("password")) || !(casper.cli.has("seed")) || !(casper.cli.has("selector")) || !(casper.cli.has("image-output")) || !(casper.cli.has("json-output"))) {
	casper.echo("Requires arguments --email=% --password=% --seed=% --selector=% --image-output=% --json-output=%").exit();
}


var _email = casper.cli.get("email");
var _password = casper.cli.get("password");
var _seedurl = casper.cli.get("seed");
var _selector = casper.cli.get("selector");
var renderFolder = casper.cli.get("image-output");
var jsonFolder = casper.cli.get("json-output");


var THE_USER = 	{
	"email": _email
	, "password": _password
	, "seed": {
		"url": _seedurl
		, "selector": _selector
	}
};





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


/**
 *
 * via http://casperjs.org/#extending
 */
casper.renderJSON = function(what) {
    return this.log(JSON.stringify(what, null, '  '));
};



/**
 *
 *
 */
function getLinksToFollow(theSelector, baseUrl) {
	var mainDiv = document.querySelector(theSelector);
	var foundLinks = mainDiv.querySelectorAll("a[href]:not([href^='javascript:']):not([href*=doubleclick]):not([href^='itpc://']):not([href^='zune://']):not([href^='#'])");
	foundLinks = foundLinks ? foundLinks : [];
	return Array.prototype.map.call(foundLinks, function(e) {
		var s = e.getAttribute('href');
		if (s) {
			var n = s.indexOf('#');
			s = s.substring(0, n != -1 ? n : s.length);
			
			//this will create fully qualified URLs
			var a = document.createElement('a');
	        a.href = s;
    	    return a.href;
			
			//return s;
		}
		else {
			return null;
		}
	});
}




var start = function(self, user) {

	var seedUrl = user.seed.url;
	var selector = user.seed.selector;
    self.start("https://accounts.google.com/Logout", function(self) {
        //self.echo('Page title: ' + self.getTitle());
    }).thenOpen("https://accounts.google.com/Login", function() {
		this.fill('form#gaia_loginform', {
			'Email': user.email
			, 'Passwd': user.password
			, "PersistentCookie": false
		}, true);
	});

	
	self.then(function() {
    	
    	var loginSuccess = (this.getCurrentUrl().indexOf("https://accounts.google.com/ServiceLoginAuth") != 0);
    	
		if (loginSuccess) {
			this.log("Logged in " + user.email + " successfully", "info");
			this.thenOpen(seedUrl, function() {
				var links = [];
				var found = this.evaluate(getLinksToFollow, {"theSelector" : selector, "baseUrl" : this.getCurrentUrl()});
				this.echo(found.length + " links found on " + selector);
				links = links.concat(found);
				links = links.unique();
				//links.sort();
				visitLinks(this, user, links);
			});
		}
		else {
			this.log("Could not log in " + user.email, "error");
			this.log(this.getTitle() + " " + this.getCurrentUrl(), "error");
			this.capture("error" + Date.now() + ".png");
		}        	
    	
	});
};

var visitLinks = function(self, user, links) {

	var theUserEmail = user.email;
	var seedUrl = user.seed.url;
	
	for (var i=0; i<links.length; i++) {
		self.thenOpen(links[i], function() {
			this.log("Opened Page! \n");
		
			var theUrl = this.getCurrentUrl();
			var theTitle = this.getTitle();
			this.log("\tFollowed link to " + theUrl + " (" + theTitle + ")", "INFO");	

			/*
			var theHtml = this.evaluate(function() {
				var dt = document.doctype;
				var doctype = '<!DOCTYPE '+ 
					dt.name+' PUBLIC "'+ //maybe you should check for publicId first
					dt.publicId+'" "'+
					dt.systemId+'">';
				return doctype + document.documentElement.outerHTML;
			});
			this.log("Got the HTML! \n" + theHtml);
			*/
			var theText = this.evaluate(function() { return document.body.innerText; });
			//this.log("Got the text! \n" + theText);
			
			var filenameRoot = guidGenerator();
			var screenshotNamePng = filenameRoot + '.png';
			this.capture(renderFolder + screenshotNamePng);
			/*
			this.capture(renderFolder + "textures/" + screenshotNamePng, {
				top: 0,
				left: 0,
				width: 1024,
				height: 1024
			});
			*/

			
			this.log("Writing JSON file...");

			//fs - see http://code.google.com/p/phantomjs/wiki/Interface#Filesystem_Module
			fs.write(jsonFolder + filenameRoot + ".json"
				, JSON.stringify({
					"user": theUserEmail
					, "url" : theUrl
					, "seed" : seedUrl
					, "title": theTitle
					, "date": Date.now()
					//, "html" : theHtml
					, "text" : theText
					, "png" : screenshotNamePng
					//, "pdf" : screenshotNamePdf
				})
				, "w"
			); 
			
			this.echo("CMD" + "\t" + this.getCurrentUrl() + "\t" + this.getTitle() + "\t" + screenshotNamePng);
		});		
	}

	/*
	self.then(function() {
		this.renderJSON(links);    
	}).thenOpen('https://www.google.com/search?q=' + "foo", function() {
		var fn = guidGenerator(); //(user.email).replace("@", '').replace('.', '');
		this.capture(fn + '.png');
	});
	*/
};



casper.start().then(function(self) {
    self.echo('Starting');
});


var currentUserIdx = 0;

// As long as it has a next link, and is under the maximum limit, will keep running
function check(self) {
    if (currentUserIdx <= 0) {
        self.echo('--- User ' + currentUserIdx + ' (' + THE_USER.email + ') ---');
        start(self, THE_USER);
        currentUserIdx++;
        self.run(check);
    } else {
        self.echo('All done.').exit();
    }
}

casper.run(check);






