var aws = require('aws2js');

var uploader = function() {
	var app = null;
	var s3 = null;
	
	
	var init = function(cfg) {
		s3 = aws.load('s3', cfg.AWS_ACCESSKEYID, cfg.AWS_SECRETACCESSKEY);
		s3.setBucket(cfg.AWS_BUCKET);
	}
	
	
	
	var upload = function (localFile, destFile, callback) {
		s3.putFile(localFile, destFile, "public-read", {}, callback);	
	}



	return {
		"init": init
		, "upload": upload
	}
}

module.exports = uploader;
