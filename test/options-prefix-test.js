/*
 * options-prefix-test.js: Tests adding custom prefix to all routes
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

var suite = APIeasy.describe('restful/restful-api-test');

macros.createServer([fixtures.Creature, fixtures.Album], { strict: false, prefix: '/custom-prefix' }).listen(8002);

suite.use('localhost', 8002)
  .setHeader('Content-Type', 'application/json')
  .followRedirect(false)
    .next()
      macros.resourceTest('Creature', { _id: null, prefix: '/custom-prefix' }, suite)
    .next()
      macros.nonStrictResourceTest({ prefix: '/custom-prefix' }, suite)
    .next()
      macros.relationalResourceTest({ prefix: "/custom-prefix" }, suite)

.export(module);