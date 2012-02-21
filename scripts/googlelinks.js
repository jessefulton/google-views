var casper = require('casper').create();


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

casper.wait(1000);

casper.then(function() {
    this.capture('afterlogin.png');

});

casper.thenOpen('https://www.google.com/search?q=' + query, function() {
    this.capture('searchpage.png');

    this.echo(this.evaluate(function() {
    	var dt = document.doctype;
    	var doctype = '<!DOCTYPE '+ 
			dt.name+' PUBLIC "'+ //maybe you should check for publicId first
			dt.publicId+'" "'+
			dt.systemId+'">';
        return doctype + "<html>" + document.documentElement.innerHTML + "</html>";
    }));

});



casper.run(function() {
	this.exit();
});
