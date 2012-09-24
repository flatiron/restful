var assert = require('assert'),
    APIeasy = require('api-easy'),
    macros = require('../macros'),
    fixtures = require('../fixtures'),
    resourceful = require('resourceful');

var suite = APIeasy.describe('restful/relational/n-level-relationships');

var n = 3,
    resources = [],
    idSoFar,
    expectedId;

for (i = 1; i <= n; i++) {
  resources[i] = resourceful.define('resource' + i, function() {
    this.string('title' + i);
    
    this['method' + i] = function(_id, options, callback) {
      callback(null, _id);
    };
    this['method' + i].remote = true;
    
    if (i > 1)
      this.parent('resource' + (i - 1));
  });
}

macros.createServer([resources[1]], {prefix: 'whatnot'}).listen(8004);

suite.use('localhost', 8004)
  .setHeader('Content-Type', 'application/json')
  .followRedirect(false)
  .path('whatnot')
  .next();

resources.forEach(function(resource) {
  suite.path(resource.lowerResource + '/');
  
  var data = {},
      updated = {},
      number = resource.lowerResource.substr("resource".length),
      title = 'title' + number;

  data['id'] = resource.lowerResource + '_id-body';
  data[title] = number;
  updated[title] = 'updated-' + number;

  suite
    .get('')
      .expect(200)
      .expect("should return an empty array", function(err, req, data) {
        assert.notEqual(typeof data, 'undefined');
        data = JSON.parse(data)[resource.lowerResource];
        assert(Array.isArray(data));
      })
      .next()
    
    // ID provided by body.
    .post('', data)
      .expect(201)
      .next()

    .get(resource.lowerResource + '_id-body')
      .expect(200)
      .next()

    // Update
    // PATCH may seem more appropraite, but but rails uses PUT too.
    .put(resource.lowerResource + '_id-body', updated)
      .expect(204)
      .next()

    .get(resource.lowerResource + '_id-body#updated')
      .expect(200)
      .expect('should return the updated resource', function(err, req, data) {
        assert.notEqual(typeof data, 'undefined');
        data = JSON.parse(data)[resource.lowerResource];
        assert.notEqual(typeof data, 'undefined');
        assert.equal(data[title], updated[title]);
      })
      .next()

    // Delete
    .del(resource.lowerResource + '_id-body')
      .expect(204)
      .next()

    .get(resource.lowerResource + '_id-body#deleted')
      .expect(404)
      .next()

    // ID provided by url. This is the resource id we use from now on.
    .post(resource.lowerResource + '_id', data)
      .expect(201)

    .path(resource.lowerResource + '_id')
    .next()
    
    .get('')
      .expect(200)
      .expect("should be resource type " + resource.resource, function(err, req, data) {
        assert.notEqual(typeof data, 'undefined');
        data = JSON.parse(data)[resource.lowerResource];
        assert.notEqual(typeof data, 'undefined');
        assert.equal(data.resource, resource.resource);
      })
      .expect("should return the correct resource", function(err, req, data) {
        assert.notEqual(typeof data, 'undefined');
        data = JSON.parse(data)[resource.lowerResource];
        assert.notEqual(typeof data, 'undefined');
        // Resource IDs in relationships are strange.
        // For example, an id for resource3 looks like
        // resource2/resource1/:id_1/:id_2/:id_3
        
        var id = resource.lowerResource + '_id';
        if (!idSoFar) {
          expectedId = id;
        } else {
          expectedId = idSoFar + '/' + id;
        }
        idSoFar = resource.lowerResource + '/' + expectedId

        assert.equal(data.id, expectedId);
        assert.equal(data[title], number);
      })
      .next()
    
    .get('method' + number)
      .expect(200)
      .expect("should return the correct id", function(err, req, data) {
        assert.notEqual(typeof data, 'undefined');
        data = JSON.parse(data).result;
        assert.equal(data, expectedId);
      })
});

suite.export(module);