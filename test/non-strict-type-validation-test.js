/*
 * non-strict-type-validation-test.js: Tests for basic validation checking for resources
 *
 * (C) 2012, Nodejitsu Inc.
 *
 */

var vows = require('vows'),
    assert = require('assert'),
    APIeasy = require('api-easy'),
    fixtures = require('./fixtures'),
    macros = require('./macros');

var suite = APIeasy.describe('restful/non-strict-type-validation-test');

macros.createServer(fixtures.User, { strict: false }).listen(8001);


suite.use('localhost', 8001)
  .setHeader('Content-Type', 'application/json')
  .followRedirect(false)
  .next()
    macros.nonStrictTypeValidationTest({}, suite)
.export(module);