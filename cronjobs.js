var foo = 0;
module.exports = {

	init: function(app) {
		var cronJob = require('cron').CronJob;
		var job = new cronJob({
		  cronTime: '* * * * * *',
		  onTick: function() {
			app.emit("crontick", "tick! " + foo++);
		  },
		  start: true
		});
		job.start();
	}
};