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
/*
  Creature: helpers.Creature,
  Album: helpers.Album
}*/


app.use(flatiron.plugins.http, {
  headers: {
    'x-powered-by': 'flatiron ' + flatiron.version
  }
});

//
// This will expose all resources as restful routers
//
app.use(restful);

//
// Expose the common part of flatiron
//
app.common = flatiron.common;

//
// When `app` initializes load the composer systems and setup
// `resourceful` with the available configuration.
//
app.on('init', function () {
  //
  // Setup the `database` options with the environment in `options`.
  //
  var database = app.config.get('database') || {
    host: 'localhost',
    port: 5984
  };
  
  database.database = database.database || 'test';

  resourceful.use('couchdb', database);
  resourceful.autoMigrate = true;
});

app.start(8000);

console.log(' > http server started on port 8000');
console.log(' > visit: http://localhost:8000/ ');