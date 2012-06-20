/*
 * flatiron-integration-test.js: Test for use restful as a flatiron plugin.
 *
 * (C) 2012, Nodejitsu Inc.
 *
 */

var assert      = require('assert'),
    helpers     = require('./helpers'),
    apiEasy     = require('api-easy');

var port = 8080;

function assertCreatureCreation (err, res) {
  var body = JSON.parse(res.body);
  assert.isNull(err);
  assert.equal(res.statusCode, 201);
  assert.isObject(body.creature);
  assert.ok(body.creature._id);
};

apiEasy.describe('restful/flatiron-plugin-test')
  .addBatch(helpers.createFlatironServer(port))
  .setHeader('Content-Type', 'application/json')
  .use('localhost', port)
  .discuss('Initial routes')
  .get('/')
    .expect(404)
  .get('/creatures')
    .expect('Should be an empty array', function (err, res /** this body is a string **/) {
      // thats why I do this JSON.parse()
      var body = JSON.parse(res.body);
      assert.isNull(err);
      assert.equal(res.statusCode, 200);
      assert.isArray(body.creatures);
      assert.equal(body.creatures.length, 0);
    })
  .undiscuss()
  .next()
  .discuss('Creating creatures')
  .post('/creatures', { type:'oneEye', description:'oneEye monster' })
    .expect('Should respond correctly', assertCreatureCreation)
  .post('/creatures/new', { type:'twoEyes', description:'twoEyes monster' })
    .expect('Should create correctly', assertCreatureCreation)
  .post('/creatures/threeEyes', { description:'threeEyes monster' })
    .expect('Should create correctly', assertCreatureCreation)
  .post('/creatures/4', { type:'fourEyes', description:'fourEyes monster' })
    .expect('Should create correctly', assertCreatureCreation)
  .undiscuss()
  .next()
  .discuss('Checking creatures')
  .get('/creatures')
    .expect('Should be an array with three creatures', function (err, res /** this body is a string **/) {
      // thats why I do this JSON.parse()
      var body = JSON.parse(res.body);
      assert.isNull(err);
      assert.equal(res.statusCode, 200);
      assert.isArray(body.creatures);
      assert.equal(body.creatures.length, 4);
    })
  .get('/creatures/1')
    .expect('Should get the details of one creature', function (err, res) {
      var body = JSON.parse(res.body);
      assert.isNull(err);
      assert.equal(res.statusCode, 200);
      assert.isObject(body.creature);
      assert.ok(body.creature._id);
      assert.ok(body.creature.ctime);
      assert.ok(body.creature.mtime);
    })
  .undiscuss()
  .next()
  .discuss('Updating creatures')
  .put('/creatures/1', { description:'this monster has a new description' })
    .expect(204)
  .post('/creatures/2/update', { description:'change over post' })
    .expect(204)
  .undiscuss()
  .next()
  .discuss('Deleting creatures')
  .del('/creatures/threeEyes')
    .expect(204)
  .post('/creatures/4/destroy')
    .expect(204)
  .undiscuss()
  .next()
  .discuss('Final checks')
  .get('/creatures/1')
    .expect('Should have a new description', function (err, res) {
      var body = JSON.parse(res.body);
      assert.isNull(err);
      assert.equal(res.statusCode, 200);
      assert.isObject(body.creature);
      assert.equal(body.creature.description, 'this monster has a new description');
    })
  .get('/creatures')
    .expect('Should be an array with two creatures', function (err, res) {
      var body = JSON.parse(res.body);
      assert.isNull(err);
      assert.equal(res.statusCode, 200);
      assert.isArray(body.creatures);
      assert.equal(body.creatures.length, 2);
    })
    //.expect('Aqui', function () { console.log('Va', arguments); })
.export(module);