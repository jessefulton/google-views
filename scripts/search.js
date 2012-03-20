var casper = require('casper').create({
	pageSettings: {
		loadImages: true
	}
    //, verbose: true
    //, logLevel: 'debug'
});

var confFile = casper.cli.args[0];
var renderFolder = casper.cli.args[1];
var query = casper.cli.args[2];

var config = require(confFile);

var num = 0;

function doSearch(self, user) {
	self.echo("logging out");
	self.start("https://accounts.google.com/Logout");
	self.thenOpen("https://accounts.google.com/Login", function() {
		this.fill('form#gaia_loginform', {
			'Email': user.email
			, 'Passwd': user.password
		}, true);
	});
	self.echo("logged in " + user.email + "... searching for '" + query + "'");
	self.thenOpen('https://www.google.com/search?q=' + query, function() {
		var filename = renderFolder + (user.email).replace("@", "").replace(".", "") + "-" + query + '.png';
		this.echo("CAPTURING: " + filename);
		this.capture(filename);
	});
};

casper.start().then(function(self) {
    self.echo('Starting');
});


// As long as it has a next link, and is under the maximum limit, will keep running
function check(self) {
    if (config.users[num]) {
        doSearch(self, config.users[num]);
        num++;
        self.run(check);
    } else {
        self.echo('All done.').exit();
    }
}


casper.run(check);