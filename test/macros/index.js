var macros = exports;

var restful = require('../../lib/restful'),
    assert = require('assert'),
    http = require('http');

macros.createServer = function (resource, options) {
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

macros.resourceTest = function (name, options, context) {

  var _id = options._id,
      prefix = options.prefix || '';

  //
  // TODO: Remove this block of code, we should get back ID from created entities,
  //       and specify it for further test paths using context.before()
  //
  if (_id === null) {
    _id = 1;
  }

  return context
    .get(prefix)
      .expect(200)
    .get(prefix + '/creature')
      .expect(200)
    .next()
      .post(prefix + '/creature/' + _id, {})
        .expect(201)
        .expect("should have correct id", function (err, res, body) {
          var result = JSON.parse(body).creature;
          //
          // We only need to compare the returned _id if we actually specified an _id on creation
          //
          if (_id) {
            assert.equal(result.id, _id);
          } else {
            assert(result.id.length > 0, true);
          }
          // TODO Remark: If we had a context.before, we would set _id scope for path here
          //
          // Assign _id returned from endpoint as _id for the rest of the test
          //
          // _id = result._id;
        })
    .next()
      .get(prefix + '/creature/' + _id)
        .expect(200)
    .next()
      .put(prefix + '/creature/' + _id, { 'type' : "Dragon" })
        .expect(204)
    .next()
      .get(prefix + '/creature/' + _id)
        .expect(200)
        .expect("should have correct type", function (err, res, body) {
           var result = JSON.parse(body);
           assert.isObject(result.creature)
           assert.equal(result.creature.type, "Dragon");
        })
    .next()
      .put(prefix + '/creature/' + _id, { 'type' : "Unicorn", "life": 10 })
        .expect(204)
    .next()
      .get(prefix + '/creature/' + _id)
        .expect(200)
        .expect("should have correct type", function (err, res, body) {
           var result = JSON.parse(body);
           assert.isObject(result.creature)
           assert.equal(result.creature.type, "Unicorn");
        })
    .next()
      .get(prefix + '/creature/' + _id + '/feed')
        .expect(200)
        .expect("should respond with correct message", function (err, res, body) {
           assert.isNull(err);
           var result = JSON.parse(body);
           assert.equal(result.result, "I have been fed my life is: 11");
        })
    .next()
      .get(prefix + '/creature/' + _id)
        .expect(200)
        .expect("should have correct life", function (err, res, body) {
          var result = JSON.parse(body);
          assert.isObject(result.creature)
          assert.equal(result.creature.life, "11");
        })
    .next()
      .post(prefix + '/creature/' + _id + '/feed')
        .expect(200)
        .expect("should respond with correct message", function (err, res, body) {
           assert.isNull(err);
           var result = JSON.parse(body);
           assert.equal(result.result, "I have been fed my life is: 12");
        })
    .next()
      .get(prefix + '/creature/' + _id)
        .expect(200)
        .expect("should have correct life", function (err, res, body) {
          var result = JSON.parse(body);
          assert.isObject(result.creature)
          assert.equal(result.creature.life, "12");
        })
    .next()
      .get(prefix + '/creature/' + _id + '/hit')
        .expect(200)
        .expect("should respond with correct message", function (err, res, body) {
           assert.isNull(err);
           var result = JSON.parse(body);
           assert.equal(result.result, "I have been hit my life is: 11");
        })
    .next()
      .get(prefix + '/creature/' + _id)
        .expect(200)
        .expect("should have correct life", function (err, res, body) {
          var result = JSON.parse(body);
          assert.isObject(result.creature)
          assert.equal(result.creature.life, "11");
        })
    .next()
      .post(prefix + '/creature/' + _id + '/hit')
        .expect(200)
        .expect("should respond with correct message", function (err, res, body) {
           assert.isNull(err);
           var result = JSON.parse(body);
           assert.equal(result.result, "I have been hit my life is: 10");
        })
    .next()
      .get(prefix + '/creature/' + _id)
        .expect(200)
        .expect("should have correct life", function (err, res, body) {
          var result = JSON.parse(body);
          assert.isObject(result.creature)
          assert.equal(result.creature.life, "10");
        })
    .next()
      .get(prefix + '/creature/' + _id + '/_die')
        .expect(404)
    .next()
      .post(prefix + '/creature/' + _id + '/_die')
        .expect(404)


    /* Remark: Tests for testing _id updates of resources
    .next()
      .put(prefix + '/creature/' + _id, { 'type' : "Unicorn", "_id": "charlie" })
        .expect(204)
    .next()
      .get(prefix + '/creature/charlie')
        .expect(200)
        .expect("should have correct type", function (err, res, body) {
           var result = JSON.parse(body);
           assert.isObject(result.creature)
           assert.equal(result.creature.type, "Unicorn");
        })
     */
    .next()
      .del(prefix + '/creature/' + _id)
        .expect(204)
    .next()
      .get(prefix + '/creature/' + _id)
        .expect(404)
};

macros.nonStrictResourceTest = function (options, context) {

  var prefix = options.prefix || '';

  return context
    .get(prefix)
      .expect(200)
    .get(prefix + '/creature')
      .expect(200)
  .next()
    .post(prefix + '/creature/new', { id: 1 })
      .expect(201)
  .next()
    .get(prefix + '/creature/1')
      .expect(200)
  .next()
    .post(prefix + '/creature/1/update', { 'type' : 'dragon' })
      .expect(204)
  .next()
    .post(prefix + '/creature/1/destroy')
      .expect(204)
  .next()
    .get(prefix + '/creature/1')
      .expect(404)
  .next()
    .post(prefix + '/creature/new', { id: "bob" })
      .expect(201)
  .next()
    .get(prefix + '/creature/bob')
      .expect(200)
  .next()
    .post(prefix + '/creature', { id: 2, 'type': 'Dragon' })
      .expect(201)
  /* Remark: Tests for testing _id updates of resources
  .next()
    .post(prefix + '/creature/bob/update', { '_id' : 'what-about-bob' })
      .expect(204)
  .next()
    .get(prefix + '/creature/bob')
      .expect(404)
  .next()
    .get(prefix + '/creature/what-about-bob')
      .expect(200)
  */
  .next()
    .get(prefix + '/creature/2')
      .expect(200)
      .expect('should have correct type', function (err, res, body) {
         var result = JSON.parse(body);
         assert.isObject(result.creature)
         assert.equal(result.creature.type, 'Dragon');
      })
  .next()
    .get(prefix + '/creature/find')
      .expect(200)
      .expect('should return all creatures', function (err, res, body) {
         var result = JSON.parse(body);
         assert.isArray(result.creature);
      })
  .next()
    .post(prefix + '/creature/find')
      .expect(200)
      .expect('should return all creatures', function (err, res, body) {
         var result = JSON.parse(body);
         assert.isArray(result.creature);
      })
  .next()
    .post(prefix + '/creature/find', { 'type': 'Dragon'})
      .expect(200)
      .expect('should return only Dragons', function (err, res, body) {
         var result = JSON.parse(body);
         assert.isArray(result.creature);
         result.creature.forEach(function(creature){
           assert.equal(creature.type, 'Dragon');
         });
      })
  .next()
    .get(prefix + '/creature/find?type=Dragon')
      .expect(200)
      .expect('should return only Dragons', function (err, res, body) {
         var result = JSON.parse(body);
         assert.isArray(result.creature);
         result.creature.forEach(function(creature){
           assert.equal(creature.type, 'Dragon');
         });
      })
};

macros.relationalResourceTest = function (options, context) {
  var prefix = options.prefix || '';
  return context
  .get(prefix + '/album')
    .expect(200)
  .next()
    .get(prefix + '/song')
      .expect(404)
  .next()
    .post(prefix + '/album/ill-communication')
      .expect(201)
  .next()
    .post(prefix + '/song/random-no-album-track')
      .expect(404)
  .next()
    .post(prefix + '/song', { id: 'random-no-album-track'})
      .expect(404)
  .next()
    .post(prefix + '/album/ill-communication/song/get-it-together')
      .expect(201)
  .next()
    .post(prefix + '/song', { id: "sure-shot" })
      .expect(404)
  .next()
    .post(prefix + '/album/ill-communication/song', { id: "sure-shot" })
      .expect(201)
      .expect('should return correct song', function (err, res, body) {
         var result = JSON.parse(body);
         assert.isObject(result.song);
         //
         // TODO: Shouldn't this be song.key, 'sure-shot' ??
         //
         assert.equal(result.song.id, 'album/ill-communication/sure-shot');
      })
  .next()
    .get(prefix + '/album/ill-communication/song/sure-shot')
      .expect(200)
  .next()
    .get(prefix + '/album/ill-communication')
      .expect(200)
      .expect('should return correct album with new songs', function (err, res, body) {
         var result = JSON.parse(body);
         assert.isArray(result.album.song_ids);
         assert.equal(result.album.song_ids.length, 2);
      })
  .next()
    .get(prefix + '/album/ill-communication/song/get-it-together')
      .expect(200)
      .expect('should return correct song', function (err, res, body) {
         var result = JSON.parse(body);
         assert.isObject(result.song)
         assert.equal(result.song.album_id, 'ill-communication');
      })
  .next()
    .get(prefix + '/album/ill-communication')
      .expect(200)
      .expect('should return correct album', function (err, res, body) {
         var result = JSON.parse(body);
         assert.isObject(result.album)
         assert.equal(result.album.resource, 'Album');
      })
  .next()
    .post(prefix + '/album/ill-communication/song/root-down')
      .expect(201)
      .expect('should return correct song', function (err, res, body) {
         var result = JSON.parse(body);
         assert.isObject(result.song)
         assert.equal(result.song.resource, 'Song');
      })
  .next()
    .get(prefix + '/album/ill-communication/song/root-down')
      .expect(200)
  .next()
    .post(prefix + '/album/ill-communication/song/sabotage')
      .expect(201)
  .next()
    .get(prefix + '/album/ill-communication/song/sabotage')
      .expect(200)
      .expect('should return correct song', function (err, res, body) {
        var result = JSON.parse(body)
        assert.equal(result.song.resource, 'Song');
        assert.equal(result.song.album_id, 'ill-communication');
      })
  .next()
    .get(prefix + '/album/ill-communication')
      .expect(200)
      .expect('should return correct songs', function (err, res, body) {
         var result = JSON.parse(body);
         assert.isObject(result.album)
         assert.isArray(result.album.song_ids)
         assert.equal(result.album.song_ids.length, 4);
         assert.equal(result.album.song_ids[0], 'get-it-together');
         assert.equal(result.album.song_ids[1], 'sure-shot');
         assert.equal(result.album.song_ids[2], 'root-down');
         assert.equal(result.album.song_ids[3], 'sabotage')

      })
  .next()
    .put(prefix + '/album/ill-communication/song/sabotage', { "description": "uses real instruments played by beastie boys"})
      .expect(204)
      .expect('should not error', function (err, res, body) {
        assert.isNull(err);
      })
  .next()
    .get(prefix + '/album/ill-communication/song/sabotage')
    .expect(200)
    .expect('should return correct description', function (err, res, body) {
       var result = JSON.parse(body);
       assert.isObject(result.song)
       assert.equal(result.song.resource, 'Song');
       assert.equal(result.song.description, "uses real instruments played by beastie boys")
    })
  .next()
    .del(prefix + '/album/ill-communication/song/sabotage')
    .expect(204)
  .next()
    .get(prefix + '/album/ill-communication/song/sabotage')
    .expect(404)
  .next()
    .get(prefix + '/album/invalid-album/song/invalid-song')
    .expect(404)
  .next()
    .get(prefix + '/album/invalid-album/song')
    .expect(404)
};

macros.typeValidationTest = function (context) {
  return context
  .get('/user')
    .expect(200)
  .next()
    .post('/user')
      .expect(422)
      .expect('should return correct validation error', function (err, res, body) {
         var result = JSON.parse(body);
         assert.equal(result.validate.errors[0].property, 'email');
         assert.equal(result.validate.errors[0].expected, true);
         assert.equal(result.validate.errors[0].message, 'is required');
      })
  .next()
    .get('/user/1')
      .expect(404)
  .next()
    .post('/user', { email: "NOT_VALID_EMAIL@123" })
      .expect(422)
      .expect('should return correct validation error', function (err, res, body) {
        var result = JSON.parse(body);
        assert.equal(result.validate.errors[0].property, 'email');
        assert.equal(result.validate.errors[0].expected, 'email');
        assert.equal(result.validate.errors[0].attribute, 'format');
        assert.equal(result.validate.errors[0].message, 'is not a valid email');
      })
  .next()
    .get('/user/1')
      .expect(404)
  .next()
    .post('/user/1', { email: "marak.squires@gmail.com" })
      .expect(201)
      .expect('should respond with created user', function (err, res, body) {
        var result = JSON.parse(body);
        assert.isDefined(result.user);
      })
  .next()
    .get('/user/1')
      .expect(200)
  .next()
    .put('/user/1', { email: "NOT_VALID_EMAIL@123" })
      .expect(422)
      .expect('should return correct validation error', function (err, res, body) {
        var result = JSON.parse(body);
        assert.equal(result.validate.errors[0].property, 'email');
        assert.equal(result.validate.errors[0].expected, 'email');
        assert.equal(result.validate.errors[0].attribute, 'format');
        assert.equal(result.validate.errors[0].message, 'is not a valid email');
      })
  .next()
    .post('/user/2', { email: "marak.squires@gmail.com" })
      .expect(201)
      .expect('should respond with created user', function (err, res, body) {
        var result = JSON.parse(body);
        assert.isDefined(result.user);
      })
  .next()
    .get('/user/2')
      .expect(200)
  .next()
    .post('/user', { email: "NOT_VALID_EMAIL@123", age: "50" })
      .expect(422)
      .expect('should return correct validation error', function (err, res, body) {
        var result = JSON.parse(body);
        assert.equal(result.validate.errors[0].property, 'email');
        assert.equal(result.validate.errors[0].expected, 'email');
        assert.equal(result.validate.errors[0].attribute, 'format');
        assert.equal(result.validate.errors[0].message, 'is not a valid email');
        assert.equal(result.validate.errors[1].property, 'age');
        assert.equal(result.validate.errors[1].expected, 'number');
        assert.equal(result.validate.errors[1].message, 'is not a valid age');
      })
  .next()
    .post('/user', { email: "marak.squires@gmail.com", age: "50" })
      .expect(422)
      .expect('should return correct validation error', function (err, res, body) {
        var result = JSON.parse(body);
        assert.equal(result.validate.errors[0].property, 'age');
        assert.equal(result.validate.errors[0].expected, 'number');
        assert.equal(result.validate.errors[0].message, 'is not a valid age');
      })
  .next()
    .post('/user', { email: "marak.squires@gmail.com", age: 50 })
      .expect(201)
};

macros.nonStrictTypeValidationTest = function (options, context) {
  return context
  .get('/user')
    .expect(200)
  .next()
    .post('/user')
      .expect(422)
      .expect('should return correct validation error', function (err, res, body) {
         var result = JSON.parse(body);
         assert.equal(result.validate.errors[0].property, 'email');
         assert.equal(result.validate.errors[0].expected, true);
         assert.equal(result.validate.errors[0].message, 'is required');
      })
  .next()
    .get('/user/1')
      .expect(404)
  .next()
    .post('/user', { email: "NOT_VALID_EMAIL@123" })
      .expect(422)
      .expect('should return correct validation error', function (err, res, body) {
        var result = JSON.parse(body);
        assert.equal(result.validate.errors[0].property, 'email');
        assert.equal(result.validate.errors[0].expected, 'email');
        assert.equal(result.validate.errors[0].attribute, 'format');
        assert.equal(result.validate.errors[0].message, 'is not a valid email');
      })
  .next()
    .get('/user/1')
      .expect(404)
  .next()
    .post('/user', { id: 1, email: "marak.squires@gmail.com" })
      .expect(201)
      .expect('should respond with created user', function (err, res, body) {
        var result = JSON.parse(body);
        assert.isDefined(result.user);
      })
  .next()
    .get('/user/1')
      .expect(200)
  .next()
    .post('/user/1/update', { email: "NOT_VALID_EMAIL@123" })
      .expect(422)
      .expect('should return correct validation error', function (err, res, body) {
        var result = JSON.parse(body);
        assert.equal(result.validate.errors[0].property, 'email');
        assert.equal(result.validate.errors[0].expected, 'email');
        assert.equal(result.validate.errors[0].attribute, 'format');
        assert.equal(result.validate.errors[0].message, 'is not a valid email');
      })
  .next()
    /* Test String -> Number cohersions for non-strict mode */
    .post('/user', { email: "marak.squires@gmail.com", age: "50" })
      .expect(201)
  .next()
    .post('/user',   { email: "marak.squires@gmail.com", age: "50" })
      .expect(201)
  .next()
    .post('/user', { email: "marak.squires@gmail.com", age: 50 })
      .expect(201)
  .next()
    .post('/user',   { email: "marak.squires@gmail.com", age: 50 })
      .expect(201)
};
