var casper = require('casper').create({
	pageSettings: {
		loadImages: true
	},
    verbose: true,
    logLevel: 'debug'
});
var config = require('../conf/config.js');

/*
var fantomas = Object.create(casper);
fantomas.renderJSON = function(what) {
    return this.echo(JSON.stringify(what, null, '  '));
};
*/

var seedPages = [ 
	{
		"selector": "#main_content"
		, "url": "http://www.npr.org/sections/politics/"
	}/*,
	{
		"selector": "#content"
		, "url": "http://www.foxnews.com/politics/index.html"
	}
	*/
];


function getLinksToFollow(theSelector) {
	var mainDiv = document.querySelector(theSelector);
	var foundLinks = mainDiv.querySelectorAll("a[href]:not([href^='javascript:']):not([href*=doubleclick]):not([href^='itpc://']):not([href^='zune://']):not([href^='#'])");
	foundLinks = foundLinks ? foundLinks : [];
	return Array.prototype.map.call(foundLinks, function(e) {
		var s = e.getAttribute('href');
		if (s) {
			var n = s.indexOf('#');
			s = s.substring(0, n != -1 ? n : s.length);
			return s;
		}
		else {
			return e.outerHTML;
		}
	});
	
}

//http://news.cnet.com/8301-17939_109-10151227-2.html
casper.start().each(config.users, function(self, user) {

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
			/*
			casper.thenOpen(links[i], function() {
				this.log("\tFollowed link to " + this.getCurrentUrl() + " ("+this.getTitle()+")", "INFO");				
			});		
			*/
			//this.log("\t" + links[i], "debug");
		}
		
	});
	
});





casper.run(function() {
	this.echo("done", "INFO").exit();
});



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