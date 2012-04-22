function defineModels(mongoose, fn) {
	var Schema = mongoose.Schema,
		ObjectId = Schema.ObjectId;

	/**
	 * Pages which have been crawled and captured
	 */
	var CrawledPage = new Schema({
		//"user": String
		"url" : String
		, "title": String
		, "date" : [{type: Date, default: Date.now}]
		, "text" : String
		
		//TODO: Move images to search crawls...
			//eliminate html - just store body text (from main selector)
		, "html" : String
		, "png" : String
		, "pdf" : String
		, "tex" : String
		, "jpg" : String
	});

	CrawledPage.virtual('id')
		.get(function() { return this._id.toHexString(); });


	/**
	 * These are items which the server still needs to look up
	 */
	var WebSearchQueryQueue = new Schema({
		created: {type: Date, default: Date.now}
		, query: String
		, processed: {type: Boolean, default: false }
	});
	WebSearchQueryQueue.virtual('id')
		.get(function() { return this._id.toHexString(); });

	/**
	 * The actual search result items (web pages)
	 */
	 /*
	var WebSearchResult = new Schema({
		title: String
		, url: String
		//, briefDescription: String
		//, pageContent: String
		//, rawHTML: String
		//imageId = id
	});
	WebSearchResult.virtual('id')
		.get(function() { return this._id.toHexString(); });
	*/
	
	/**
	 * A search query result for a particular client (plugin, server, etc.)
	 */
	var ClientWebSearch = new Schema({
		created: {type: Date, default: Date.now}
		//, url: String
		, clientId: String
		//, clicked: [WebSearchResult]
		, results: [String]	
	});
	
	/**
	 * Search query and affiliated client searches
	 */
	var WebSearch = new Schema({
		created: {type: Date, default: Date.now}
		, query: String
		, searches: [ClientWebSearch]
	});

	WebSearch.virtual('id')
		.get(function() { return this._id.toHexString(); });


	mongoose.model('crawledpage', CrawledPage);
	//mongoose.model('websearchresult', WebSearchResult);
	mongoose.model('websearch', WebSearch);
	mongoose.model('clientwebsearch', ClientWebSearch);
	mongoose.model('websearchqueryqueue', WebSearchQueryQueue);
	
	fn();
}

exports.defineModels = defineModels; 