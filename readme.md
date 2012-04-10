Everybody's Google/Google Views
===============================



Requirements
------------

node.js, phantomjs, casperjs, mongodb


Set up
------

### Download code and run `npm install`

### Configure personas
1. Copy `conf/users.template` -> `conf/users.js`
2. Update `conf/users.js` with appropriate information: username; password; proxy configuration; "seed" URLs & CSS selectors for main content DOM elements.

### Configure cron jobs

The `cron-crawl.js` script takes 2 parameters - the index of the persona to use, and the index of the seed URL to begin with.

	0 12 * * * node <path_to>cron-crawl.js 0
	45 12 * * * node <path_to>cron-import.js
