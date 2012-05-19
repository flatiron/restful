var APIeasy = require('api-easy'),
    helpers = require('./helpers');

// HTTP Server

helpers.createServer({strict: false, disable: ["get","create","update", "destroy","all"]})
       .listen(8002);

// Modified version from helpers/index.js

var resourceTest = function (name, _id, context) {
  
  //
  // TODO: Remove this block of code, we should get back ID from created entities,
  //       and specify it for further test paths using context.before()
  //
  if (_id === null) {
    _id = 1;
  }

  return context
    .get('/creatures')
      .expect(404)
    .next()
      .post('/creatures/' + _id, {})
        .expect(404)
    .next()
      .put('/creatures/' + _id, { "type" : "Unicorn" })
        .expect(404)
    .next()
      .del('/creatures/' + _id)
        .expect(404)
    .next()
      .get('/creatures/' + _id)
        .expect(404)
    .next()
      .get('/creatures/' + _id)
        .expect(404)
    .next()
      .post('creatures/' + _id + '/update')
        .expect(404)
    .next()
      .post('creatures/' + _id + '/destroy')
        .expect(404)
};

// Test suite

var suite = APIeasy.describe('restful/disabled-routes');

suite.use('localhost', 8002)
  .setHeader('Content-Type', 'application/json')
  .followRedirect(false)
    .next()
      resourceTest('Creature', null, suite)
    .next()
      resourceTest('Creature', '2', suite)
    .next()
      resourceTest('Creature', 'bob', suite)
    .export(module);