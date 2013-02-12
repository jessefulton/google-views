Everybody's Google/Google Views
===============================



Requirements
------------

node.js, casperjs, mongodb


Set up
------

### Download code and run `npm install`

### Configure personas
1. Copy `conf/users.template` -> `conf/users.js`
2. Update `conf/users.js` with appropriate information: username; password; proxy configuration; "seed" URLs & CSS selectors for main content DOM elements.


#### Set up Proxies (optional)

If you don't want all of your Google behavior to come from the same IP (a *lot* of information is inferred simply from IP), then set up web proxies in appropriate geographic regions. I've been using Amazon EC2 (US West, US East, EU West.) Note that if using a non-US IP address, Google will often try to force/redirect you to other domains or services.

First set up squid proxy on each AWS EC2 instance.

	yum -y install squid
	sudo /etc/init.d/squid start


After squid is set up on EC2 and running, create local HTTP proxies by tunneling to EC2

	ssh -i PEM_FILE1 -N -L3128:localhost:3128 root@AWS_SERVER1
	ssh -i PEM_FILE2 -N -L3129:localhost:3128 root@AWS_SERVER2
	ssh -i PEM_FILE3 -N -L3130:localhost:3128 root@AWS_SERVER3
	
	
	
	
	
Deploy to Heroku
----------------

heroku config:add BUILDPACK_URL=https://github.com/ddollar/heroku-buildpack-multi.git

heroku config:set PATH=bin:node_modules/.bin:/usr/local/bin:/usr/bin:/bin:vendor/phantomjs/bin:vendor/casperjs/bin
heroku config:set LD_LIBRARY_PATH=/usr/local/lib:/usr/lib:/lib:/app/vendor/phantomjs/lib
