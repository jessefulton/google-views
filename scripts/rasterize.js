

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






/*
var page = require('webpage').create(),
    address, output, size;

console.log("phantom rasterize.js");

if (phantom.args.length < 2 || phantom.args.length > 3) {
    console.log('Usage: rasterize.js URL filename');
    phantom.exit();
} else {
    address = phantom.args[0];
    output = phantom.args[1];
    console.log("ADDRESS: " + address);
    
    page.viewportSize = { width: 600, height: 600 };
    page.open(address, function (status) {
        if (status !== 'success') {
            console.log('Unable to load the address! ' + status);
            phantom.exit(1);
        } else {
            window.setTimeout(function () {
                page.render(output);
                phantom.exit(0);
            }, 200);
        }
    });
}

*/