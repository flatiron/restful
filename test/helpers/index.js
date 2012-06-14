var helpers = exports,
assert = require('assert');

var restful = require('../../lib/restful');
var resourceful = require('resourceful');
var http = require('http');

//
// Create a new Creature resource using the Resourceful library
//
helpers.Creature = resourceful.define('creature', function () {
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
// Create a new Creature resource using the Resourceful library
//
helpers.User = resourceful.define('user', function () {
  //
  // Specify a storage engine
  //
  this.use('memory');

  //
  // Specify some properties with validation
  //
  this.string('name');
  this.string('email', { format: 'email' })

  //
  // Specify timestamp properties
  //
  this.timestamps();
});

helpers.createServer = function (resource, options) {

  var router = restful.createRouter(resource, options);

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
  // TODO: Remove this block of code, we should get back ID from created entities,
  //       and specify it for further test paths using context.before()
  //
  if (_id === null) {
    _id = 1;
  }

  return context
    .get('/creatures')
      .expect(200)
    .next()
      .post('/creatures/' + _id, {})
        .expect(201)
        .expect("should have correct _id", function (err, res, body) {
          var result = JSON.parse(body).creature;
          //
          // We only need to compare the returned _id if we actually specified an _id on creation
          //
          if (_id) {
            assert.equal(result._id, _id);
          } else {
            assert(result._id.length > 0, true);
          }
          
          // TODO Remark: If we had a context.before, we would set _id scope for path here
          //
          // Assign _id returned from endpoint as _id for the rest of the test
          //
          // _id = result._id;
        })
    .next()
      .get('/creatures/' + _id)
        .expect(200)
    .next()
      .put('/creatures/' + _id, { 'type' : "Dragon" })
        .expect(204)
    .next()
      .get('/creatures/' + _id)
        .expect(200)
        .expect("should have correct type", function (err, res, body) {
           var result = JSON.parse(body);
           assert.isObject(result.creature)
           assert.equal(result.creature.type, "Dragon");
        })
    .next()
      .put('/creatures/' + _id, { 'type' : "Unicorn" })
        .expect(204)
    .next()
      .get('/creatures/' + _id)
        .expect(200)
        .expect("should have correct type", function (err, res, body) {
           var result = JSON.parse(body);
           assert.isObject(result.creature)
           assert.equal(result.creature.type, "Unicorn");
        })
    .next()
      .del('/creatures/' + _id)
        .expect(204)
    .next()
      .get('/creatures/' + _id)
        .expect(404)
};