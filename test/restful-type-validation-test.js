/*
 * restful-type-validation-test.js: Tests for basic validation checking for resources
 *
 * (C) 2012, Nodejitsu Inc.
 *
 */
 
var vows = require('vows'),
    assert = require('assert'),
    APIeasy = require('api-easy'),
    helpers = require('./helpers');

var suite = APIeasy.describe('restful/type-validation-test');

helpers.createServer(helpers.User, { strict: true }).listen(8001);

suite.use('localhost', 8001)
  .setHeader('Content-Type', 'application/json')
  .followRedirect(false)
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
    .post('/users', { email: "marak.squires@gmail.com" })
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
.export(module);