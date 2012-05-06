var vows = require('vows'),
    assert = require('assert'),
    APIeasy = require('api-easy'),
    restful = require('../lib/restful');


var formful = require('../lib/restful');

var resourceful = require('resourceful');
var http = require('http');


//
// 
//
var Creature = resourceful.define('creature', function () {
  //
  // Specify a storage engine
  //
  this.use('memory');

  //
  // Specify some properties with validation
  //
  this.string('type');
  this.string('description');

  //
  // Specify timestamp properties
  //
  this.timestamps();
});


var router = restful.createRouter(Creature);


var server = http.createServer(function (req, res) {
  req.chunks = [];
  req.on('data', function (chunk) {
    req.chunks.push(chunk.toString());
  });
  router.dispatch(req, res, function (err) {
    if (err) {
      res.writeHead(404);
      res.end();
    }
    console.log('Served ' + req.url);
  });
});

server.listen(8000);

var suite = APIeasy.describe('restful/restful-api-test');

suite.use('localhost', 8000)
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
    .put('/Creature/1', { "type" : "Dragon" })
      .expect(204)
  .next()
    .get('/Creature/1')
      .expect(200)
      .expect("should have correct type", function (err, res, body) {
         var result = JSON.parse(body);
         assert.equal(result.type, "Dragon");
      })
  .next()
    .put('/Creature/1', { "type" : "Unicorn" })
      .expect(204)
  .next()
    .get('/Creature/1')
      .expect(200)
      .expect("should have correct type", function (err, res, body) {
         var result = JSON.parse(body);
         assert.equal(result.type, "Unicorn");
      })
  .next()
    .del('/Creature/1')
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
    .next()
      .post('/Creature/bob', {})
        .expect(201)
    .next()
      .get('/Creature/bob')
        .expect(200)
    .next()
      .put('/Creature/bob', { "type" : "Dragon" })
        .expect(204)
    .next()
      .get('/Creature/bob')
        .expect(200)
        .expect("should have correct type", function (err, res, body) {
           var result = JSON.parse(body);
           assert.equal(result.type, "Dragon");
        })
    .next()
      .put('/Creature/bob', { "type" : "Unicorn" })
        .expect(204)
    .next()
      .get('/Creature/bob')
        .expect(200)
        .expect("should have correct type", function (err, res, body) {
           var result = JSON.parse(body);
           assert.equal(result.type, "Unicorn");
        })
    .next()
      .del('/Creature/bob')
        .expect(204)
    .next()
      .get('/Creature/bob')
        .expect(404)

.export(module);