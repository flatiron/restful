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

macros.resourceTest = function (name, _id, context) {
  
  //
  // TODO: Remove this block of code, we should get back ID from created entities,
  //       and specify it for further test paths using context.before()
  //
  if (_id === null) {
    _id = 1;
  }

  return context
    .get('/creatures/new')
      .expect(404)
    .next()
    .get('/creatures')
      .expect(200)
    .next()
      .post('/creatures/' + _id, {})
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

macros.nonStrictResourceTest = function (context) {
  return context
    .get('/creatures')
      .expect(200)
  .next()
    .post('/creatures/new', { id: 1 })
      .expect(201)
  .next()
    .get('/creatures/1')
      .expect(200)
  .next()
    .post('/creatures/1/update', { 'type' : 'dragon' })
      .expect(204)
  .next()
    .post('/creatures/1/destroy')
      .expect(204)
  .next()
    .get('/creatures/1')
      .expect(404)
  .next()
    .post('/creatures/new', { id: "bob" })
      .expect(201)
  .next()
    .get('/creatures/bob')
      .expect(200)
  .next()
    .post('/creatures', { id: 2, 'type': 'Dragon' })
      .expect(201)
  /* Remark: Tests for testing _id updates of resources
  .next()
    .post('/creatures/bob/update', { '_id' : 'what-about-bob' })
      .expect(204)
  .next()
    .get('/creatures/bob')
      .expect(404)
  .next()
    .get('/creatures/what-about-bob')
      .expect(200)
  */
  .next()
    .get('/creatures/2')
      .expect(200)
      .expect('should have correct type', function (err, res, body) {
         var result = JSON.parse(body);
         assert.isObject(result.creature)
         assert.equal(result.creature.type, 'Dragon');
      })
};

macros.relationalResourceTest = function () {};

macros.typeValidationTest = function (context) {
  return context
  .get('/users')
    .expect(200)
  .next()
    .post('/users')
      .expect(422)
      .expect('should return correct validation error', function (err, res, body) {
         var result = JSON.parse(body);
         assert.equal(result.validate.errors[0].property, 'email');
         assert.equal(result.validate.errors[0].expected, true);
         assert.equal(result.validate.errors[0].message, 'is required');
      })
  .next()
    .get('/users/1')
      .expect(404)
  .next()
    .post('/users', { email: "NOT_VALID_EMAIL@123" })
      .expect(422)
      .expect('should return correct validation error', function (err, res, body) {
        var result = JSON.parse(body);
        assert.equal(result.validate.errors[0].property, 'email');
        assert.equal(result.validate.errors[0].expected, 'email');
        assert.equal(result.validate.errors[0].attribute, 'format');
        assert.equal(result.validate.errors[0].message, 'is not a valid email');
      })
  .next()
    .get('/users/1')
      .expect(404)
  .next()
    .post('/users/1', { email: "marak.squires@gmail.com" })
      .expect(201)
      .expect('should respond with created user', function (err, res, body) {
        var result = JSON.parse(body);
        assert.isDefined(result.user);
      })
  .next()
    .get('/users/1')
      .expect(200)
  .next()
    .put('/users/1', { email: "NOT_VALID_EMAIL@123" })
      .expect(422)
      .expect('should return correct validation error', function (err, res, body) {
        var result = JSON.parse(body);
        assert.equal(result.validate.errors[0].property, 'email');
        assert.equal(result.validate.errors[0].expected, 'email');
        assert.equal(result.validate.errors[0].attribute, 'format');
        assert.equal(result.validate.errors[0].message, 'is not a valid email');
      })
  .next()
    .post('/users/2', { email: "marak.squires@gmail.com" })
      .expect(201)
      .expect('should respond with created user', function (err, res, body) {
        var result = JSON.parse(body);
        assert.isDefined(result.user);
      })
  .next()
    .get('/users/2')
      .expect(200)
  .next()
    .post('/users', { email: "NOT_VALID_EMAIL@123", age: "50" })
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
    .post('/users', { email: "marak.squires@gmail.com", age: "50" })
      .expect(422)
      .expect('should return correct validation error', function (err, res, body) {
        var result = JSON.parse(body);
        assert.equal(result.validate.errors[0].property, 'age');
        assert.equal(result.validate.errors[0].expected, 'number');
        assert.equal(result.validate.errors[0].message, 'is not a valid age');
      })
  .next()
    .post('/users', { email: "marak.squires@gmail.com", age: 50 })
      .expect(201)
};

macros.nonStrictTypeValidationTest = function (context) {
  return context
  .get('/users')
    .expect(200)
  .next()
    .post('/users')
      .expect(422)
      .expect('should return correct validation error', function (err, res, body) {
         var result = JSON.parse(body);
         assert.equal(result.validate.errors[0].property, 'email');
         assert.equal(result.validate.errors[0].expected, true);
         assert.equal(result.validate.errors[0].message, 'is required');
      })
  .next()
    .get('/users/1')
      .expect(404)
  .next()
    .post('/users', { email: "NOT_VALID_EMAIL@123" })
      .expect(422)
      .expect('should return correct validation error', function (err, res, body) {
        var result = JSON.parse(body);
        assert.equal(result.validate.errors[0].property, 'email');
        assert.equal(result.validate.errors[0].expected, 'email');
        assert.equal(result.validate.errors[0].attribute, 'format');
        assert.equal(result.validate.errors[0].message, 'is not a valid email');
      })
  .next()
    .get('/users/1')
      .expect(404)
  .next()
    .post('/users', { id: 1, email: "marak.squires@gmail.com" })
      .expect(201)
      .expect('should respond with created user', function (err, res, body) {
        var result = JSON.parse(body);
        assert.isDefined(result.user);
      })
  .next()
    .get('/users/1')
      .expect(200)
  .next()
    .post('/users/1/update', { email: "NOT_VALID_EMAIL@123" })
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
    .post('/users', { email: "marak.squires@gmail.com", age: "50" })
      .expect(201)
  .next()
    .post('/users',   { email: "marak.squires@gmail.com", age: "50" })
      .expect(201)
  .next()
    .post('/users', { email: "marak.squires@gmail.com", age: 50 })
      .expect(201)
  .next()
    .post('/users',   { email: "marak.squires@gmail.com", age: 50 })
      .expect(201)
};