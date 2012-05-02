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


### Set up Proxies (optional)

First set up squid proxy on AWS EC2 instance.

	yum -y install squid
	sudo /etc/init.d/squid start


After squid is set up on EC2 and running, create local HTTP proxies by tunneling to EC2

	ssh -i PEM_FILE1 -N -L3128:localhost:3128 root@AWS_SERVER1
	ssh -i PEM_FILE2 -N -L3129:localhost:3128 root@AWS_SERVER2
	ssh -i PEM_FILE3 -N -L3130:localhost:3128 root@AWS_SERVER3