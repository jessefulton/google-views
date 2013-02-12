var mongoose = require("mongoose");

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
		, processState: {type: String, default: "waiting" } // "waiting", "searching", "texturing", "error", "complete"
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







	var GoogleUserSeed = new Schema({
		url: String,
		selector: String
	});

	/**
	 * Search query and affiliated client searches
	 */
	var GoogleUser = new Schema({
		email: String
		, password: String
		, description: String
		, seeds: [GoogleUserSeed]
		, proxy: {
			url: String,
			type: String
		}
	});

	GoogleUser.virtual('id')
		.get(function() { return this._id.toHexString(); });





// Initialize
// ----------
// 
// Open the DB connection and set the model to the module exports

var db = require("./db").getConnection();

module.exports.CrawledPage = db.model('crawledpage', CrawledPage);

module.exports.WebSearch = db.model('websearch', WebSearch);
module.exports.ClientWebSearch = db.model('clientwebsearch', ClientWebSearch);
module.exports.WebSearchQueryQueue = db.model('websearchqueryqueue', WebSearchQueryQueue);
module.exports.GoogleUser = db.model('googleuser', GoogleUser);
