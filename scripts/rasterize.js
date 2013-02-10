

var fs = require('fs');
var casper = require('casper').create();
var address, output, size;


if (casper.cli.args.length < 2 || casper.cli.length > 3) {
    console.log('Usage: rasterize.js URL filename');
    casper.exit();
} else {
    address = casper.cli.args[0];
    output = casper.cli.args[1];
    console.log("ADDRESS: " + address);
    
    casper.start(address, function() {
	    casper.viewport(600, 600);
	    this.capture(output);
	    this.exit();
    });
    casper.run();
}
