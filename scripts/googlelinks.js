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
