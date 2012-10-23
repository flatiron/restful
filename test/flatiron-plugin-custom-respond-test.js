/*
 * flatiron-plugin-custom-respond-test.js: Integration test with Flatiron as
 * plugin and a custom respond method
 *
 * (C) 2012, Nodejitsu Inc.
 *
 */

var vows = require('vows'),
    assert = require('assert'),
    APIeasy = require('api-easy');

var suite = APIeasy.describe('restful/flatiron-plugin-custom-respond-test');

var flatiron    = require('flatiron'),
    fixtures    = require('./fixtures'),
    macros      = require('./macros'),
    restful     = require('../lib/restful');

var app = flatiron.app;
app.resources = {};
app.resources.Creature = fixtures.Creature;

app.use(flatiron.plugins.http);
app.use(restful, {
  respond: function (req, res, status, key, value) {
    var result;
    res.writeHead(status);

    if (arguments.length === 5) {
      result = value;
    }
    else {
      result = key;
    }

    res.end(result ? JSON.stringify(result) : '');
  }
});

app.start(8005)

suite.use('localhost', 8005)
  .setHeader('Content-Type', 'application/json')
  .followRedirect(false)
  .post('/creature/new', { id: 1 })
    .expect(201)
  .next()
    .get('/creature/1')
      .expect(200)
  .next()
    .post('/creature/1/update', { 'type' : 'dragon' })
      .expect(204)
  .next()
    .post('/creature/1/destroy')
      .expect(204)
  .next()
    .get('/creature/1')
      .expect(404)
  .next()
    .post('/creature/new', { id: "bob" })
      .expect(201)
  .next()
    .get('/creature/bob')
      .expect(200)
  .next()
    .post('/creature', { id: 2, 'type': 'Dragon' })
      .expect(201)
  .next()
    .get('/creature/2')
      .expect(200)
      .expect('should have correct type', function (err, res, body) {
         var creature = JSON.parse(body);
         assert.isObject(creature)
         assert.equal(creature.type, 'Dragon');
      })
  .next()
    .get('/creature/find')
      .expect(200)
      .expect('should return all creatures', function (err, res, body) {
         var creature = JSON.parse(body);
         assert.isArray(creature);
      })
  .next()
    .post('/creature/find')
      .expect(200)
      .expect('should return all creatures', function (err, res, body) {
         var creature = JSON.parse(body);
         assert.isArray(creature);
      })
  .next()
    .post('/creature/find', { 'type': 'Dragon'})
      .expect(200)
      .expect('should return only Dragons', function (err, res, body) {
         var creature = JSON.parse(body);
         assert.isArray(creature);
         creature.forEach(function(creature){
           assert.equal(creature.type, 'Dragon');
         });
      })
  .next()
    .get('/creature/find?type=Dragon')
      .expect(200)
      .expect('should return only Dragons', function (err, res, body) {
         var creature = JSON.parse(body);
         assert.isArray(creature);
         creature.forEach(function(creature){
           assert.equal(creature.type, 'Dragon');
         });
      })

.export(module);
