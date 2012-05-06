var helpers = exports,
assert = require('assert');

var restful = require('../../lib/restful');
var resourceful = require('resourceful');
var http = require('http');


helpers.createServer = function () {

  //
  // Create a new Creature resource using the Resourceful library
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

  return server;

}


helpers.resourceTest = function (name, _id, context) {
  
  //
  // TODO: Remove this block of code, we should get back ID from created entities
  //
    var _startid = _id;
    if (_id === null) {
      _id = 1;
      _startid = "";
    }
  //
  //
  //
  
  return context
    .get('/Creature')
      .expect(200)
    .next()
      .post('/Creature/' + _startid, {})
          .expect(201)
    .next()
      .get('/Creature/' + _id)
        .expect(200)
    .next()
      .put('/Creature/' + _id, { "type" : "Dragon" })
        .expect(204)
    .next()
      .get('/Creature/' + _id)
        .expect(200)
        .expect("should have correct type", function (err, res, body) {
           var result = JSON.parse(body);
           assert.equal(result.type, "Dragon");
        })
    .next()
      .put('/Creature/' + _id, { "type" : "Unicorn" })
        .expect(204)
    .next()
      .get('/Creature/' + _id)
        .expect(200)
        .expect("should have correct type", function (err, res, body) {
           var result = JSON.parse(body);
           assert.equal(result.type, "Unicorn");
        })
    .next()
      .del('/Creature/' + _id)
        .expect(204)
    .next()
      .get('/Creature/' + _id)
        .expect(404)
};