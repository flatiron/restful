/*
 * restful-api-test.js: Tests for purely `restful` routes
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

macros.createServer(fixtures.Creature, { strict: true }).listen(8000);

suite.use('localhost', 8000)
  .setHeader('Content-Type', 'application/json')
  .followRedirect(false)
    .next()
      macros.resourceTest('Creature', { _id: null }, suite)
    .next()
      macros.resourceTest('Creature', { _id: 2 }, suite)
    .next()
      macros.resourceTest('Creature', { _id: "bob" }, suite)
    .next()

.export(module);