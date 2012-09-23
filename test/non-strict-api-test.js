/*
 * non-strict-api-test.js: Tests for non-strict `restful` routes
 *
 * (C) 2012, Nodejitsu Inc.
 *
 */

var vows = require('vows'),
    assert = require('assert'),
    APIeasy = require('api-easy'),
    fixtures = require('./fixtures'),
    macros = require('./macros');

var suite = APIeasy.describe('restful/non-strict-api-test');

macros.createServer(fixtures.Creature, { strict: false }).listen(8001);

suite.use('localhost', 8001)
  .setHeader('Content-Type', 'application/json')
  .followRedirect(false)
  .next()
    macros.nonStrictResourceTest({}, suite)
.export(module);