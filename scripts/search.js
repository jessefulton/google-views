//TODO: Combine/replace this with generic "view.js"

var fs = require('fs');
var casper = require('casper').create();


if (!(casper.cli.has("email")) || !(casper.cli.has("password")) || !(casper.cli.has("query")) || !(casper.cli.has("filename"))) {
	casper.echo("Requires arguments --email=% --password=% --query=% --filename=%").exit();
}

var email = casper.cli.get("email");
var password = casper.cli.get("password");
var query = casper.cli.get("query");
var filename = casper.cli.get("filename");


var dir = filename.substring(0, filename.lastIndexOf("/"));
casper.echo("does " + dir + " exist?");
casper.echo(fs.exists(dir));
if (!fs.exists(dir)) {
	fs.makeDirectory(dir);
}

casper.echo ("Beginning script: " + query + " --> " + filename);
casper.start("https://accounts.google.com/Logout");

casper.thenOpen("https://accounts.google.com/Login", function() {
	this.echo("opened login page");
    this.fill('form#gaia_loginform', {
    	'Email': email
    	, 'Passwd': password
    }, true);
});




casper.thenOpen('https://www.google.com/search?q=' + query, function() {
	this.echo("searched");
    this.capture(filename);
});



casper.run(function() {
	this.exit();
});
