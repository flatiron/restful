/*
 * one-many-test.js: Tests for one-many relational `restful` routes
 *
 * (C) 2012, Nodejitsu Inc.
 *
 */

var vows = require('vows'),
    assert = require('assert'),
    APIeasy = require('api-easy'),
    fixtures = require('../fixtures'),
    macros = require('../macros');

var suite = APIeasy.describe('restful/relational/one-many');

macros.createServer(fixtures.Album, { strict: false }).listen(8003);

suite.use('localhost', 8003)
  .setHeader('Content-Type', 'application/json')
  .followRedirect(false)
  .next()
    macros.relationalResourceTest({}, suite)

.export(module);