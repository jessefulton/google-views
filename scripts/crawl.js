//see https://groups.google.com/forum/#!msg/casperjs/3t8R10N6zPo/CKi6yScMILEJ

var casper = require('casper').create({
	pageSettings: {
		loadImages: true
	}
    //, verbose: true
    //, logLevel: 'debug'
});

var confFile = casper.cli.args[0];
var renderFolder = casper.cli.args[1];

var config = require(confFile);



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
		}, true);
	});

	
	self.then(function() {
		var loginSuccess = this.evaluate(function(eml) {
	    	var el = document.querySelector("#gbgs4dn");
	    	var ret = false;
	    	//if (el && (el.innerText == eml)) { ret = true; }
	    	if (el) { ret = true; }
	    	return ret;
    	}, {"eml": user.email});
    	
    	loginSuccess = (this.getTitle() == "Account overview - Account Settings");
    	
		if (loginSuccess) {
			this.log("Logged in " + user.email + " successfully", "info");
			this.thenOpen(seedUrl, function() {
				var links = [];
				var found = this.evaluate(getLinksToFollow, {"theSelector" : selector, "baseUrl" : this.getCurrentUrl()});
				this.echo(found.length + " links found on " + selector);
				links = links.concat(found);
				links = links.unique();
				//links.sort();
				visitLinks(this, links);
			});
			

			
		}
		else {
			this.log("Could not log in " + user.email, "error");
			this.log(this.getTitle() + " " + this.getCurrentUrl(), "error");
		}        	
    	
	});
};

var visitLinks = function(self, links) {
	self.echo("=================");	
	self.renderJSON(links);
	self.echo("=================");
	
	for (var i=0; i<links.length; i++) {
		self.thenOpen(links[i], function() {
			this.log("\tFollowed link to " + this.getCurrentUrl() + " ("+this.getTitle()+")", "INFO");	
			var fn = renderFolder + guidGenerator() + '.png';
			this.capture(fn);
			this.echo("CMD" + "\t" + this.getCurrentUrl() + "\t" + this.getTitle() + "\t" + fn);
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
    if (config.users[currentUserIdx]) {
        self.echo('--- User ' + currentUserIdx + ' (' + config.users[currentUserIdx].email + ') ---');
		self.echo("USR" + "\t" + config.users[currentUserIdx].email);
        start(self, config.users[currentUserIdx]);
        currentUserIdx++;
        self.run(check);
    } else {
        self.echo('All done.').exit();
    }
}

casper.run(check);












/*



//http://news.cnet.com/8301-17939_109-10151227-2.html
//casper.start("https://accounts.google.com/Logout");

casper.start("about:blank", function() {

	this.each(config.users, function(self, user) {
		
		self.log("Logging out", "debug");
		self.thenOpen("https://accounts.google.com/Logout");
		self.log("Logging in user " + user.email, "debug");
		
		self.thenOpen("https://accounts.google.com/Login", function() {
			this.fill('form#gaia_loginform', {
				'Email': user.email
				, 'Passwd': user.password
			}, true);
		});
		
		var loginSuccess =  self.thenEvaluate(function(eml) {
			return document.querySelector("#gbgs4dn").innerText == eml;
		}, {"eml": user.email});
		
		if (loginSuccess) {
			self.log("Logged in " + user.email + " successfully", "info");
		}
		else {
			self.log("Could not log in " + user.email, "error");
		}
		
		
	
		var seedPage = user.seed;
		self.thenOpen(seedPage.url, function() {
			var links = [];
			this.log("Beginning for " + this.getCurrentUrl() + " ("+this.getTitle()+")", "info");
			links = casper.evaluate(getLinksToFollow, {"theSelector": seedPage.selector});
	
			for (var i=0; i<links.length; i++) {
				//casper.thenOpen(links[i], function() {
				//	this.log("\tFollowed link to " + this.getCurrentUrl() + " ("+this.getTitle()+")", "INFO");				
				//});		
				
				//this.log("\t" + links[i], "debug");
			}
			
		});
		
		self.thenOpen('https://www.google.com/search?q=' + "foo", function() {
			var fn = (user.email).replace("@", '').replace('.', '');
			this.capture(fn + '.png');
		});
	});
});





casper.run(function() {
	this.echo("done", "INFO").exit();
});
*/

//===================================================

/*
//casper.echo(JSON.stringify(config.users));
i=0;
casper.start().each(config.users, function(self, user) {
	self.echo("going through user" + i);
	self.thenOpen("https://accounts.google.com/Logout");
	self.echo("logged out");
	self.thenOpen("https://accounts.google.com/Login", function() {
		this.fill('form#gaia_loginform', {
			'Email': user.email
			, 'Passwd': user.password
		}, true);
	});
	self.echo("logged in " + user.email + ":" + user.password);	
	self.thenOpen('https://www.google.com/search?q=' + "foo", function() {
		this.capture((++i) + 'searchpage.png');
	});
	self.echo("searched");
});

*/


//casper.exit();
/*
if (!(casper.cli.has("email")) || !(casper.cli.has("password")) || !(casper.cli.has("query"))) {
	casper.echo("Requires arguments --email=% --password=% --query=%").exit();
}

var email = casper.cli.get("email");
var password = casper.cli.get("password");
var query = casper.cli.get("query");

casper.start("https://accounts.google.com/Logout");

casper.thenOpen("https://accounts.google.com/Login", function() {
    this.fill('form#gaia_loginform', {
    	'Email': email
    	, 'Passwd': password
    }, true);
});


//casper.wait(1000);

casper.then(function() {
    this.capture('afterlogin.png');

});

casper.thenOpen('https://www.google.com/search?q=' + query, function() {
    this.capture('searchpage.png');


	//TODO: should we just replace the body with only the results?
    this.echo(this.evaluate(function() {
    	//var main = "<div id='center_col'>" + document.getElementById("center_col").innerHTML + "</div>";
    	var main = "<div class='personalized_results'>" + document.getElementById("center_col").innerHTML + "</div>";
    	var dt = document.doctype;
    	var doctype = '<!DOCTYPE '+ 
			dt.name+' PUBLIC "'+ //maybe you should check for publicId first
			dt.publicId+'" "'+
			dt.systemId+'">';
		document.body.innerHTML = main;
        return doctype + "<html>" + document.documentElement.innerHTML + "</html>";
    }));

});


casper.run(function() {
	this.exit();
});
*/