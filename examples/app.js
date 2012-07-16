/*
 * app.js
 *
 * (C) 2012, Nodejitsu Inc.
 *
 */
 
var flatiron    = require('flatiron'),
    helpers     = require('../test/helpers'),
    restful     = require('../lib/restful'),
    resourceful = require('resourceful');

var app = module.exports = flatiron.app;
app.resources = {};
app.resources.Creature = helpers.Creature;
app.resources.Album = helpers.Album;

app.use(flatiron.plugins.http, {
  headers: {
    'x-powered-by': 'flatiron ' + flatiron.version
  }
});
app.use(restful);
app.start(8000);

console.log(' > http server started on port 8000');
console.log(' > visit: http://localhost:8000/ ');