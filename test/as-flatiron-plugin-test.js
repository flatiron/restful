//
// Running as a flatiron plugin does make some things different.
//

var vows = require('vows'),
    assert = require('assert'),
    APIeasy = require('api-easy');

var suite = APIeasy.describe('restful/director-extra-function');

var flatiron    = require('flatiron'),
    fixtures    = require('./fixtures'),
    macros      = require('./macros'),
    restful     = require('../lib/restful');

var app = flatiron.app;
app.resources = {};
app.resources.Creature = fixtures.Creature;

app.use(flatiron.plugins.http);
app.use(restful);

app.start(8005)

suite.use('localhost', 8005)
  .setHeader('Content-Type', 'application/json')
  .followRedirect(false)

  macros.resourceTest("unused", {_id: 'creatureID'}, suite)

.export(module);