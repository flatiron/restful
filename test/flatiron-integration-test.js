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

apiEasy.describe('restful as a flatiron plugin')
  .addBatch(helpers.createFlatironServer(port))
  .use('localhost', port)
  .discuss('initial routes')
  .get('/')
    .expect(404)
  .get('/creatures')
    .expect('Should be an empty array', function (err, res /** this body is a string **/) {
      // thats why I do this JSON.parse()
      var body = JSON.parse(res.body);
      assert.isNull(err);
      assert.equal(200, res.statusCode);
      assert.isObject(body);
      assert.isArray(body.creatures);
      assert.equal(0, body.creatures.length);
    })
  .next()
  .undiscuss()
  .discuss('creating a new Creature')
  .post('/creatures', { type:'oneEye', description:'oneEye monster' })
    //.expect('Should respond correctly', )
    .expect('Aqui', function () { console.log('Va', arguments); })
.export(module);