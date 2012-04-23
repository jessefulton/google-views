var crypto = require('crypto');

/**
 * MD5 the given `str`.
 */
exports.md5 = function(str) {
  return crypto
    .createHash('md5')
    .update(str)
    .digest('hex');
};

/**
 * Imply "http://" for `url`.
 */
exports.url = function(url){
  if (~url.indexOf('://')) return url;
  return 'http://' + url;
};



/**
 *
 * via http://stackoverflow.com/a/105074/1150652
 */
exports.guid = function() {
    var S4 = function() {
       return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    };
    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}


/**
 *
 * via http://stackoverflow.com/a/7928115/1150652
 */
exports.unique = function(arr){
  return Object.keys(arr.reduce(function(r,v){
    return r[v]=1,r;
  },{}));
}


/**
* Returns array for arguments
*
*/
exports.ensureArray = function(a, b, n) {
	if (arguments.length === 0) return [];            //no args, ret []
	if (arguments.length === 1) {                     //single argument
		if (a === undefined || a === null) return [];   //  undefined or null, ret []
		if (Array.isArray(a)) return a;                 //  isArray, return it
	}
	return Array.prototype.slice.call(arguments);     //return array with copy of all arguments
}
