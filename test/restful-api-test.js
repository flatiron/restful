var vows = require('vows'),
    assert = require('assert'),
    APIeasy = require('api-easy'),
    restful = require('../lib/restful');


var resourceful = require('resourceful');
var http = require('http');

var helpers = require('./helpers');

var suite = APIeasy.describe('restful/restful-api-test');

helpers.createServer({ strict: true }).listen(8000);

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