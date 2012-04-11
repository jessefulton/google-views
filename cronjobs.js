module.exports = {

	init: function(app) {
		
		var cronJob = require('cron').CronJob;
		var job = new cronJob({
		  cronTime: '* * * * * *',
		  onTick: function() {
			//console.log("tick!");
			app.emit("crontick", "tick!");
			// Runs every weekday (Monday through Friday)
			// at 11:30:00 AM. It does not run on Saturday
			// or Sunday.
		  },
		  start: true
		});
		job.start();
		
		
	}
};