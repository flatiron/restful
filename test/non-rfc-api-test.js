/*
 * non-rfc-api-test.js: Tests for non-strict `restful` routes 
 *
 * (C) 2012, Nodejitsu Inc.
 *
 */
 
var vows = require('vows'),
    assert = require('assert'),
    APIeasy = require('api-easy'),
    helpers = require('./helpers');

var suite = APIeasy.describe('restful/non-rfc-api-test');

helpers.createServer({ strict: false }).listen(8001);

suite.use('localhost', 8001)
  .setHeader('Content-Type', 'application/json')
  .followRedirect(false)
    .get('/creatures')
      .expect(200)
  .next()
    .post('/creatures', {})
      .expect(302)
  .next()
    .get('/creatures/1')
      .expect(200)
  .next()
    .post('/creatures/1/update', { 'type' : 'dragon' })
      .expect(204)
  .next()
    .post('/creatures/1/destroy')
      .expect(200)
  .next()
    .get('/creatures/1')
      .expect(404)
  .next()
    .post('/creatures', {})
      .expect(302)
  .next()
    .get('/creatures/2')
      .expect(200)
  .next()
    .post('/creatures', { 'type': 'Dragon' })
      .expect(302)
  .next()
    .get('/creatures/3')
      .expect(200)
      .expect('should have correct type', function (err, res, body) {
         var result = JSON.parse(body);
         assert.isObject(result.creature)
         assert.equal(result.creature.type, 'Dragon');
      })
.export(module);