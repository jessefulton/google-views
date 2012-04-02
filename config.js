/**
 * Merges environment variables + config file + command line args
 */

var argv = require('optimist').argv;

function init(vars, file) {
	//1. check process.env
	//2. config files override
	//3. command line args final override

	
	var config = {};
	var fileConfig = {};
	try {
		fileConfig = require(file);
	} catch(e) {}
	
	
	vars.forEach(function(el, idx, arr) {
		config[el] = process.env[el];
		if (fileConfig[el]) { config[el] = fileConfig[el]; }
		if (argv[el]) { config[el] = argv[el]; }
	});
	return config;

}

exports.init = init; 




/*
var argv = require('optimist').argv;

function init(vars, confDir) {
	//1. check process.env
	//2. config files override
	//3. command line args final override

	
	var config = {};
	var fileConfig = {};
	try {
		if (confDir) {
			fileConfig = require(file);
			fs.readdir('screenshots', function(err, files) {
				files.forEach(function(el, idx, arr) {
					if (/\.js$/.test(el)) {
						var basename = el.substr(0, el.lastIndexOf('.'));
						fileConfig[basename] = require(confDir + "/" + el);
					}
				}
			}

			
			
		}
	} catch(e) {}
	
	
	vars.forEach(function(el, idx, arr) {
		config[el] = process.env[el];
		if (fileConfig[el]) { config[el] = fileConfig[el]; }
		if (argv[el]) { config[el] = argv[el]; }
	});
	return config;

}

exports.init = init; 
*/