/**
 * Merges environment variables + config file + command line args
 */

var argv = require('optimist').argv;

function init() {
	//1. check process.env
	//2. config files override
	//3. command line args final override

	var vars = [
		"GOOGLE_API_KEY", 
		"GOOGLE_CSE_ID",
		"MONGODB_URI",
		"LOGGLY_SUBDOMAIN",
		"LOGGLY_INPUT_KEY"
	];
	
	var config = {};
	var fileConfig = {};
	try {
		fileConfig = require('./conf/config.js');
	} catch(e) {}
	
	
	vars.forEach(function(el, idx, arr) {
		config[el] = process.env[el];
		if (fileConfig[el]) { config[el] = fileConfig[el]; }
		if (argv[el]) { config[el] = argv[el]; }
	});
	return config;

}

exports.init = init; 