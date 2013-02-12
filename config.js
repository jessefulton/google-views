var fs    = require('fs'),
	nconf = require('nconf');

//
// Setup nconf to use (in-order):
//   1. Command-line arguments
//   2. Environment variables
//   3. A file located at 'path/to/config.json'
//
nconf.argv()
	.env()
	.file('site', { file: './conf/site.json' });
//	.file('users', { file: './conf/users.json' });


// TODO: move users to DB and set explicitly

if (nconf.get("MONGOHQ_URL")) {
	nconf.set("MONGODB_URI", nconf.get("MONGOHQ_URL"));
}


module.exports = nconf;



