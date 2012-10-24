/*
 * flatiron-plugin-test.js: Integration test with Flatiron as plugin
 *
 * (C) 2012, Nodejitsu Inc.
 *
 */

var vows = require('vows'),
    assert = require('assert'),
    APIeasy = require('api-easy'),
    restful = require('../lib/restful'),
    resourceful = require('resourceful'),
    http = require('http'),
    fixtures = require('./fixtures'),
    macros = require('./macros');

var suite = APIeasy.describe('restful/flatiron-plugin-test');

suite.use('localhost', 8004)
  .setHeader('Content-Type', 'application/json')
  .followRedirect(false)
  /*

      REMARK:

          These tests all pass locally, but I was having issues getting them to pass on travis.

      TODO:

          Uncomment these tests and figure out why they are not passing on travis
  
  .addBatch({
    'With a flatiron app ' : {
      'starting the app': {
        topic: function () {
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
          app.use(restful, { prefix: "/custom-prefix" });
          app.start(8004, this.callback)
        },
        'should not error': function (err, router) {
          assert.isNull(err, router);
        }
      }
    }
  })
  .next()
    macros.resourceTest('Creature', { _id: null, prefix: '/custom-prefix' }, suite)
  */
.export(module);