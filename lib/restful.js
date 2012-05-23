/*
 * restful.js: Restful routing using resourceful and director.
 *
 * (C) 2012, Nodejitsu Inc.
 *
 */

var director = require('director'),
    util     = require('util'),
    resourceful = require('resourceful');

//
// ### function createRouter (resource, options)
// #### @resource {resourceful.Resource} Resource to use for the router.
// #### @options {Object} Options to use when attaching routes
//
// Creates a new "ResourcefulRouter" instance that will dispatch RESTFul urls
// for specified resource
//
exports.createRouter = function (resource, options) {
  return new ResourcefulRouter(resource, options);
};

//
// ### function ResourcefulRouter (resource, options)
// #### @resource {resourceful.Resource} Resource to use for the router.
// #### @options {Object} Options to use when attaching routes
//
// "ResourcefulRouter" Constructor function that will dispatch RESTFul urls
// for specified resource
//
// POST    /creatures    => Creature.create()
// GET     /creatures    => Creature.all()
// GET     /creatures/1  => Creature.show()
// PUT     /creatures/1  => Creature.update()
// DELETE  /creatures/1  => Creature.destroy()
//
var ResourcefulRouter = exports.ResourcefulRouter = function (resource, options) {
  options = options || {};

  //
  // ResourcefulRouter inherits from director.http.Router
  //
  director.http.Router.call(this, options);

  this.resource = resource;
  this.strict = options.strict || false;

  _extendWithRoutes(this, resource);
};

//
// Inherit from `director.http.Router`.
//
util.inherits(ResourcefulRouter, director.http.Router);

//
// Name this `broadway` plugin.
//
exports.name = 'restful';

//
// ### function init ()
// Initializes the `restful` plugin with the App.
//
exports.init = function (done) {
  var app = this;

  if (app.resources) {
    Object.keys(app.resources).forEach(function (resource) {
      //
      // Only exposes resources as restful if they have set:
      //
      //     Resource.restful = true
      //
      if (app.resources[resource].restful) {
        _extendWithRoutes(app.router, app.resources[resource]);
      }
    });
  }
  
  done();
};

//
// ### @private function _extendWithNonStrictRoutes (router, resource)
// #### @router {director.http.Router} Router to extend with non-strict routes
// #### @resource {resourceful.Resource} Resource to use in routes.
//
// Since not all HTTP clients support PUT and DELETE verbs ( such as forms in web browsers ),
// restful will also map the following browser friendly routes:
//
// If you prefer to not use this option, set { strict: true }
//
// POST  /creatures/1/update  => Creature.update()
// POST  /creatures/1/destroy => Creature.destroy()
//
// You might also want to consider using a rails-like approach which uses
// the convention of a reserved <form> input field called "_method" which contains either
// "PUT" or "DELETE"
//
// see: https://github.com/senchalabs/connect/blob/master/lib/middleware/methodOverride.js
//
function _extendWithNonStrictRoutes(router, resource) {
  //
  // Bind POST /:resource/:id/update to resource.destroy
  // Remark: Not all browsers support PUT verb, so we have to fake it
  //
  router.post('/update', function (_id) {
    var res = this.res;
    resource.update(_id, this.req.body, function (err, result) {
      return err
        ? respondWithResult(res, 500, err)
        : respondWithResult(res, 204);
    });
  });

  //
  // Bind POST /:resource/:id/destroy to resource.destroy
  // Remark: Not all browsers support DELETE verb, so we have to fake it
  //
  router.post('/destroy', function (_id) {
    var res = this.res;
    resource.destroy(_id, function (err, result) {
      return err
        ? respondWithResult(res, 500, err)
        : respondWithResult(res, 200);
    });
  });
}

//
// ### @private function _extendWithRoutes (router, resource)
// #### @router {director.http.Router} Router to extend with routes
// #### @resource {resourceful.Resource} Resource to use in routes.
//
function _extendWithRoutes (router, resource) {
  var entity = resource._resource.toLowerCase(),
      pluralEntity;

  //
  // Remark: I would have prefered to use singular entity names,
  // but the pre-existing APIs were already using plural names :-(
  //

  //
  // TODO: replace with proper inflection / pluralization library
  //
  pluralEntity = (entity + 's');

  //
  // Scope all routes under /:resource
  //
  router.path('/' + pluralEntity, function () {
    //
    // Bind resource.all ( show all ) to GET /:resource
    //
    this.get(function () {
      var res = this.res;
      resource.all(function (err, results) {
        return err
          ? respondWithResult(res, 500, err)
          : respondWithResult(res, 200, pluralEntity, results);
      });
    });

    //
    // Bind POST /:resource to resource.create()
    //
    this.post(function () {
      var object = this.req.body,
          res    = this.res;

      resource.create(object, function (err, result) {
        return err
          ? respondWithResult(res, 500, err)
          : respondWithResult(res, 201, entity, result);
      });
    });

    //
    // Bind /:resource/:id path
    //
    this.path('/:id', function () {
      //
      // Bind POST /:resource/:id to resource.create(_id)
      //
      router.post(function (_id) {
        var object = this.req.body,
            res    = this.res;

        object._id = _id;

        resource.create(object, function (err, result) {
          return err
            ? respondWithResult(res, 500, err)
            : respondWithResult(res, 201, entity, result);
        });
      });

      //
      // Bind GET /:resource/:id to resource.get
      //
      router.get(function (_id) {
        var res = this.res;

        resource.get(_id, function (err, result) {
          if (err) {
            //
            // TODO: Don't always respond with 404
            //
            res.writeHead(404);
            res.end();
            return;
          }

          respondWithResult(res, 200, entity, result);
        });
      });

      //
      // Bind DELETE /:resource/:id to resource.destroy
      //
      router.delete(function (_id) {
        var res = this.res;

        resource.destroy(_id, function (err, result) {
          return err
            ? respondWithResult(res, 500, err)
            : respondWithResult(res, 200);
        });
      });

      //
      // Bind PUT /:resource/:id to resource.update
      //
      router.put(function (_id) {
        var res = this.res;

        resource.update(_id, this.req.body, function (err, result) {
          return err
            ? respondWithResult(res, 500, err)
            : respondWithResult(res, 204);
        });
      });

      //
      // If we are not in strict mode, then extend the router with,
      // some potentially helpful non-restful routes ( see below )
      //
      if (!router.strict) {
        _extendWithNonStrictRoutes(this, resource);
      }
    });
  });
}

//
// ### @private function respondWithResult (res, status, options, value)
// #### @res {http.ServerResponse} Server respond to write to
// #### @status {number} Status code to respond with
// #### @key {Object|string} Object to respond with or key to set for `value`
// #### @value {Object} **Optional** Value to set in the result for the specified `key`
//
// Helper function for responding from `restful` routes:
//
//    respondWithResult(res, 200);
//    respondWithResult(res, 500, err);
//    respondWithResult(res, 200, 'users', [{...}, {...}, ...]);
//
function respondWithResult(res, status, key, value) {
  res.setHeader('content-type', 'application/json');
  res.writeHead(status);

  var result;

  if (arguments.length === 4) {
    result = {};
    result[key] = value;
  }
  else {
    result = key;
  }

  res.end(result ? JSON.stringify(result) : '');
}