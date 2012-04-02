function defineModels(mongoose, fn) {
	var Schema = mongoose.Schema,
		ObjectId = Schema.ObjectId;

	/**
	 * These are items which the server still needs to look up
	 */
	var CrawledPage = new Schema({
		"user": String
		, "url" : String
		, "title": String
		, "date" : {type: Date, default: Date.now}
		, "html" : String
		, "text" : String
		, "png" : String
		, "pdf" : String
	});

	CrawledPage.virtual('id')
		.get(function() { return this._id.toHexString(); });


  mongoose.model('crawledpage', CrawledPage);
  fn();
}

exports.defineModels = defineModels; 