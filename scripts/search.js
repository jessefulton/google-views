//TODO: Combine/replace this with generic "view.js"
	
var fs = require('fs');
var casper = require('casper').create();

//casper.echo("Starting casper script");

var links = [];

function getLinks() {
	var l = [];
    //var foundLinks = document.querySelectorAll('h3.r a');
	var foundLinks = document.querySelectorAll("#ires li:not([class*=tpo]):not([id=newsbox]):not([id=imagebox_bigimages]) .vsc > h3.r a");
 	//var foundLinks = document.querySelectorAll("#ires li:not([class*=tpo]):not([id=newsbox]):not([id=imagebox_bigimages]) .vsc h3.r a");
	console.log("FOUND LINKS: " + foundLinks.length); 	
	
	for (var i=0; i<foundLinks.length; i++) {
		l.push(foundLinks[i]);
	}
	
	
	
 	var diff = 10 - l.length
 	if (diff > 0) {
 		var newsLinks = document.querySelectorAll("#ires li#newsbox .vsc a");
		for (var i=0; i< newsLinks.length; i++) {
 			if (i > (diff-1)) { break; }
 			l.push(newsLinks[i]);
			console.log("ADDING ONE: " + l.length);
 		}
 	}
 	
 	var links = [];
	var dummyA = document.createElement('a');
	for(var i=0; i<l.length; i++) {
		var el = l[i];
		dummyA.href = el.href
		el.href = dummyA.href;
		links.push(el.href);
	}
	
	return links;

	/*
	 return Array.prototype.map.call(links, function(e) {
        return e.getAttribute('href')
    });
    */
}



if (!(casper.cli.has("email")) || !(casper.cli.has("password")) || !(casper.cli.has("query")) ) {
	casper.echo("Requires arguments --email=% --password=% --query=%").exit();
}

var email = casper.cli.get("email");
var password = casper.cli.get("password");
var query = casper.cli.get("query");



casper.start("https://accounts.google.com/Logout");

casper.thenOpen("https://accounts.google.com/Login", function() {
	//this.echo("opened login page");
    this.fill('form#gaia_loginform', {
    	'Email': email
    	, 'Passwd': password
    }, true);
});




casper.thenOpen('https://www.google.com/search?q=' + query, function() {
	//this.echo("user " + email + " searched for " + query);
    links = links.concat(this.evaluate(getLinks));
});



casper.run(function() {
	//this.echo("about to run casper script");
    //this.echo(links.length + ' links found:');
    this.echo(JSON.stringify(links)).exit();
	//this.exit();
});
