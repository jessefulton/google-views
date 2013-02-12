// Database
// ========
// 
// Initialize the database and cache the connection.
var config = require("./config"),
    mongoose = require('mongoose');

console.log("connecting to database at " + config.get("MONGODB_URI"));
var db = mongoose.createConnection(config.get("MONGODB_URI"));


db.once('open', function () {
    console.log("Application connected to db %s", config.get("MONGO_CONNECTION"));
});

db.on("disconnected", function() {
    console.error("Application disconnected from database");
    console.error(JSON.stringify(arguments));
});
db.on("error", function() {
    console.error("DB Error");
    console.error(JSON.stringify(arguments)); 
});


// `getConnection`
// ---------------
// 
// Return the database connection.
module.exports.getConnection = function() {
    // see [Connection#readyState](http://mongoosejs.com/docs/api.html#connection_Connection-readyState)
    if (db.readyState === 0) { /* disconnected */ }
    return db;
};