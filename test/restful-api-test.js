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
    helpers = require('./helpers');

var suite = APIeasy.describe('restful/restful-api-test');

helpers.createServer(helpers.Creature, { strict: true }).listen(8000);

suite.use('localhost', 8000)
  .setHeader('Content-Type', 'application/json')
  .followRedirect(false)
    .next()
      helpers.resourceTest('Creature', null, suite)
    .next()
      helpers.resourceTest('Creature', '2', suite)
    .next()
      helpers.resourceTest('Creature', 'bob', suite)
.export(module);