/*
 * app.js
 *
 * (C) 2012, Nodejitsu Inc.
 *
 */

var flatiron    = require('flatiron'),
    fixtures    = require('../test/fixtures'),
    restful     = require('../lib/restful'),
    resourceful = require('resourceful');

var app = module.exports = flatiron.app;
app.resources = {};
app.resources.Creature = fixtures.Creature;
app.resources.Album = fixtures.Album;

app.use(flatiron.plugins.http, {
  headers: {
    'x-powered-by': 'flatiron ' + flatiron.version
  }
});
app.use(restful);
app.start(8000, function(){
  console.log(app.router.routes)
  console.log(' > http server started on port 8000');
  console.log(' > visit: http://localhost:8000/ ');
});

