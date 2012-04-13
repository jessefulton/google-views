
module.exports = {
	"test": function(app) {
		var cronJob = require('cron').CronJob;
		var job = new cronJob({
		  cronTime: '*/5 * * * * *',
		  onTick: function() {
			var randomString = (function() {
				var text = "";
				var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
			
				for( var i=0; i < 15; i++ )
					text += possible.charAt(Math.floor(Math.random() * possible.length));
				return text;
			})();
			app.emit("crontick", randomString);
		  },
		  start: true
		});
		job.start();
	}

};