var vows = require('vows'),
    assert = require('assert'),
    APIeasy = require('api-easy'),
    helpers = require('./helpers');

var suite = APIeasy.describe('restful/non-rfc-api-test');

helpers.createServer({ strict: false }).listen(8001);

suite.use('localhost', 8001)
  .setHeader('Content-Type', 'application/json')
  .followRedirect(false)
    .get('/creature')
      .expect(200)
  .next()
    .post('/creature', {})
      .expect(201)
  .next()
    .get('/creature/1')
      .expect(200)
  .next()
    .post('/creature/1/update', { "type" : "dragon" })
      .expect(204)
  .next()
    .post('/creature/1/destroy')
      .expect(204)
  .next()
    .get('/creature/1')
      .expect(404)
  .next()
    .post('/creature', {})
      .expect(201)
  .next()
    .get('/creature/2')
      .expect(200)
  .next()
    .post('/creature', { "type": "Dragon" })
      .expect(201)
  .next()
    .get('/creature/3')
      .expect(200)
      .expect("should have correct type", function (err, res, body) {
         var result = JSON.parse(body);
         assert.isObject(result.creature)
         assert.equal(result.creature.type, "Dragon");
      })
.export(module);