/*
 * standalone-server.js: Simple standalone `restful` server.
 *
 * (C) 2012, Nodejitsu Inc.
 *
 */

var fixtures    = require('../test/fixtures'),
    restful     = require('../lib/restful');

//
// Setup a standalone restful server
//
var server = restful.createServer([fixtures.Creature, fixtures.Album]);
server.listen(8000);
console.log(' > http server started on port 8000');
