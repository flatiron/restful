var vows = require('vows'),
    assert = require('assert'),
    APIeasy = require('api-easy'),
    helpers = require('./helpers');

var suite = APIeasy.describe('restful/non-rfc-api-test');

helpers.createServer().listen(8001);

suite.use('localhost', 8001)
  .setHeader('Content-Type', 'application/json')
  .followRedirect(false)
    .get('/Creature')
      .expect(200)
  .next()
    .post('/Creature', {})
      .expect(201)
  .next()
    .get('/Creature/1')
      .expect(200)
  .next()
    .post('/Creature/1/update', { "type" : "dragon" })
      .expect(204)
  .next()
    .post('/Creature/1/destroy')
      .expect(204)
  .next()
    .get('/Creature/1')
      .expect(404)
  .next()
    .post('/Creature', {})
      .expect(201)
  .next()
    .get('/Creature/2')
      .expect(200)
  .next()
    .post('/Creature', { "type": "Dragon" })
      .expect(201)
  .next()
    .get('/Creature/3')
      .expect(200)
      .expect("should have correct type", function (err, res, body) {
         var result = JSON.parse(body);
         assert.equal(result.type, "Dragon");
      })

.export(module);