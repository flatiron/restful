var helpers = exports,
assert = require('assert');

var restful = require('../../lib/restful');
var resourceful = require('resourceful');
var http = require('http');

//
// Create a new Creature resource using the Resourceful library
//
helpers.Creature = resourceful.define('creature', function () {

  var self = this;
  //
  // Specify a storage engine
  //
  this.use('memory');
  //this.use('couchdb', {database: "test3" })

  //
  // Specify some properties with validation
  //
  this.string('type');
  this.string('description');

  //
  // Specify timestamp properties
  //
  this.timestamps();
  this.number('life');

  this.feed = function (_id, options, callback) {
    self.get(_id, function(err, creature){
      if(err) {
        return callback(err);
      }
      var life = creature.life + 1;
      self.update(_id, { life: life }, function(err, result){
        callback(null, 'I have been fed my life is: ' + result.life);
      });
    });
  }
  this.feed.remote = true;

  this.hit = function (_id, options, callback) {
    self.get(_id, function(err, creature){
      if(err) {
        return callback(err);
      }
      var life = creature.life - 1;
      self.update(_id, { life: life }, function(err, result){
        callback(null, 'I have been hit my life is: ' + result.life);
      });
    });
  }
  this.hit.remote = true;


  this._die = function (food) {
    //
    // Remark: We'll consider the _die function "private",
    // in the sense that restful will not expose it
    //
    console.log('creature died.');
  }
  //
  // _die is not set to remote, so it won't be exposed
  //
});

//
// Create a new Creature resource using the Resourceful library
//
helpers.User = resourceful.define('user', function () {
  //
  // Specify a storage engine
  //
  this.use('memory');
  this.string('name');

  //
  // Specify some properties with validation
  //
  this.string('email', { format: 'email', required: true })

  //
  // Specify a Number type
  //
  this.number('age', { message: 'is not a valid age' });

  //
  // Specify timestamp properties
  //
  this.timestamps();
});

helpers.Album = resourceful.define('album', function () {
  //this.use('couchdb', {database: "test3" })
  this.use('memory');
  this.string('title');
});

helpers.Song = resourceful.define('song', function () {
  //this.use('couchdb', {database: "test3" })
  this.use('memory');
  this.number('bpm');
  this.string('description');
  this.string('title');
  this.bool('playing');
});

helpers.Song.play = function () {
  this.playing = true;
};
helpers.Song.play.remote = true;

helpers.Song.pause = function () {
  this.playing = false;
};
helpers.Song.pause.remote = true;

helpers.Song._encode = function () {
  //
  // Consider this a "private" method,
  // in that it won't be exposed through restful
  //
};



helpers.Song.parent('album');

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
      .put('/creatures/' + _id, { 'type' : "Unicorn", "life": 10 })
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
      .get('/creatures/' + _id + '/feed')
        .expect(200)
        .expect("should respond with correct message", function (err, res, body) {
           assert.isNull(err);
           var result = JSON.parse(body);
           assert.equal(result.result, "I have been fed my life is: 11");
        })
    .next()
      .get('/creatures/' + _id)
        .expect(200)
        .expect("should have correct life", function (err, res, body) {
          var result = JSON.parse(body);
          assert.isObject(result.creature)
          assert.equal(result.creature.life, "11");
        })
    .next()
      .post('/creatures/' + _id + '/feed')
        .expect(200)
        .expect("should respond with correct message", function (err, res, body) {
           assert.isNull(err);
           var result = JSON.parse(body);
           assert.equal(result.result, "I have been fed my life is: 12");
        })
    .next()
      .get('/creatures/' + _id)
        .expect(200)
        .expect("should have correct life", function (err, res, body) {
          var result = JSON.parse(body);
          assert.isObject(result.creature)
          assert.equal(result.creature.life, "12");
        })
    .next()
      .get('/creatures/' + _id + '/hit')
        .expect(200)
        .expect("should respond with correct message", function (err, res, body) {
           assert.isNull(err);
           var result = JSON.parse(body);
           assert.equal(result.result, "I have been hit my life is: 11");
        })
    .next()
      .get('/creatures/' + _id)
        .expect(200)
        .expect("should have correct life", function (err, res, body) {
          var result = JSON.parse(body);
          assert.isObject(result.creature)
          assert.equal(result.creature.life, "11");
        })
    .next()
      .post('/creatures/' + _id + '/hit')
        .expect(200)
        .expect("should respond with correct message", function (err, res, body) {
           assert.isNull(err);
           var result = JSON.parse(body);
           assert.equal(result.result, "I have been hit my life is: 10");
        })
    .next()
      .get('/creatures/' + _id)
        .expect(200)
        .expect("should have correct life", function (err, res, body) {
          var result = JSON.parse(body);
          assert.isObject(result.creature)
          assert.equal(result.creature.life, "10");
        })
    .next()
      .get('/creatures/' + _id + '/_die')
        .expect(404)
    .next()
      .post('/creatures/' + _id + '/_die')
        .expect(404)


    /* Remark: Tests for testing _id updates of resources
    .next()
      .put('/creatures/' + _id, { 'type' : "Unicorn", "_id": "charlie" })
        .expect(204)
    .next()
      .get('/creatures/charlie')
        .expect(200)
        .expect("should have correct type", function (err, res, body) {
           var result = JSON.parse(body);
           assert.isObject(result.creature)
           assert.equal(result.creature.type, "Unicorn");
        })
     */
    .next()
      .del('/creatures/' + _id)
        .expect(204)
    .next()
      .get('/creatures/' + _id)
        .expect(404)
};

