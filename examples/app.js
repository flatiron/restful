/*
 * app.js: Test fixtures for http-users tests
 *
 * (C) 2012, Nodejitsu Inc.
 *
 */
 
var flatiron = require('flatiron'),
    restful     = require('../lib/restful'),
    resourceful = require('resourceful');

var app = module.exports = flatiron.app;

app.resources = app.resources || {};

//
// Create a new Creature resource using the Resourceful library
//
app.resources.Creature = resourceful.define('creature', function () {
  this.restful = true;
  
  //
  // Specify a storage engine
  //
  this.use('memory');
  //
  // Specify some properties with validation
  //
  this.string('type');
  this.string('description');
});

app.use(flatiron.plugins.http, {
  headers: {
    'x-powered-by': 'flatiron ' + flatiron.version
  }
});

//
// This will expose all resources as restful routers
//
app.use(restful);

app.router.get('/', function () {
  this.res.text(niceTable(app.router.routes));
  this.res.end();
})

var traverse = require('traverse');


//
// TODO: Move this to director core?
//
function niceTable (routes) {
  var niceRoutes = routes,
      verbs = ['get', 'post', 'put', 'delete'],
      str = '';

  traverse(niceRoutes).forEach(visitor);

  function visitor () {
    var path = this.path, 
    pad = '';
    if (path[path.length - 1] && verbs.indexOf(path[path.length - 1]) !== -1) {
      pad += path.pop().toUpperCase();
      for (var i = pad.length; i < 8; i++) {
        pad += ' ';
      }
      
      path = path.join('/');
      str += pad + '/' + path  + ' \n'
    }
  }
  
  return str;
}

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

app.start(8080);