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

//
// Now that the `Creature` prototype is defined
// we can add custom logic to be available on all instances
//
Creature.prototype.feed = function (food) {
  this.belly.push(food);
};


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

server.listen(8001);

var suite = APIeasy.describe('restful/non-rfc-api-test');

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
      .expect("should have corrent type", function (err, res, body) {
         var result = JSON.parse(body);
         assert.equal(result.type, "Dragon");
      })

.export(module);