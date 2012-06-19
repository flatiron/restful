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

  exports.extendRouter(this, resource, options);
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
      //     Resource.restful = true;
      //
      //     Resource.restful = { param: ':custom' };
      //
      if (app.resources[resource].restful) {
        restful.extendRouter(
          app.router, 
          app.resources[resource],
          app.resources[resource].restful
        );
      }
    });
  }
  
  done();
};

//
// ### @public function extendRouter (router, resource, options, respond)
// #### @router {director.http.Router} Router to extend with routes
// #### @resources {resourceful.Resource} Resource(s) to use in routes.
// #### @options {Object} Options for routes added.
// #### @respond function

//
exports.extendRouter = function (router, resources, options, respond) {
  options = options || {};
  options.strict = options.strict || false;
  respond = respond || respondWithResult;

  if (!Array.isArray(resources)){
    resources = [resources];
  }

  resources.forEach(function (resource) {
    var entity = resource._resource.toLowerCase(),
        param = options.param || ':id',
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
    // If we are not in strict mode, then extend the router with,
    // some potentially helpful non-restful routes
    //
    if (!options.strict) {
      _extendWithNonStrictRoutes(router, resource, options, respond);
    }

    //
    // Scope all routes under /:resource
    //
    router.path('/' + pluralEntity, function () {
      //
      // Bind resource.all ( show all ) to GET /:resource
      //
      this.get(function () {
        var res = this.res,
            req = this.req;
        resource.all(function (err, results) {
          return err
            ? respond(req, res, 500, err)
            : respond(req, res, 200, pluralEntity, results);
        });
      });

      //
      // Bind POST /:resource to resource.create()
      //
      this.post(function () {
        var res    = this.res,
            req    = this.req;
        if (!options.strict) {
          preprocessRequest(req, resource);
        }
        resource.create(req.body, function (err, result) {
          var status = 201;
          if (err) {
            status = 500;
            if (typeof err === "object") { // && key.valid === false
              status = 422;
            }
          }
          return err
            ? respond(req, res, status, err)
            : respond(req, res, status, entity, result);
        });
      });

      //
      // Bind /:resource/:param path
      //
      this.path('/' + param, function () {
        //
        // Bind POST /:resource/:id to resource.create(_id)
        //
        this.post(function (_id) {
          var res    = this.res,
              req    = this.req;
          if (!options.strict) {
            preprocessRequest(req, resource);
          }

          //
          // Remark: We need to reserve the id "new" in order to make resource-routing work properly.
          // I don't agree with this, but I'm not aware of a better solution solution.
          //
          // Based on research, both Rails and Express follow this same convention,
          // so we might as well try to conform to that unless there is a better solution.
          //
          if (_id === "new") {
            return respond(req, res, 500)
          }
          req.body._id = _id;
          resource.create(req.body, function (err, result) {
            return err
              ? respond(req, res, 500, err)
              : respond(req, res, 201, entity, result);
          });
        });

        //
        // Bind GET /:resource/:id to resource.get
        //
        this.get(function (_id) {
          var res = this.res,
              req = this.req;
          //
          // Remark: We need to reserve the id "new" in order to make resource-routing work properly.
          // I don't agree with this, but I'm not aware of a better solution solution.
          //
          // Based on research, both Rails and Express follow this same convention,
          // so we might as well try to conform to that unless there is a better solution.
          //
          if (_id === "new") {
            return respond(req, res, 500)
          }
          resource.get(_id, function (err, result) {
            if (err) {
              //
              // TODO: Don't always respond with 404
              //
              res.writeHead(404);
              res.end();
              return;
            }
            respond(req, res, 200, entity, result);
          });
        });

        //
        // Bind DELETE /:resource/:id to resource.destroy
        //
        this.delete(function (_id) {
          var res = this.res,
              req = this.req;
          resource.destroy(_id, function (err, result) {
            return err
              ? respond(req, res, 500, err)
              : respond(req, res, 204);
          });
        });

        //
        // Bind PUT /:resource/:id to resource.update
        //
        this.put(function (_id) {
          var res = this.res,
              req = this.req;
          if (!options.strict) {
            preprocessRequest(req, resource);
          }
          resource.update(_id, req.body, function (err, result) {
            var status = 204;
            if (err) {
              status = 500;
              if (typeof err === "object") { // && key.valid === false
                status = 422;
              }
            }
            return err
              ? respond(req, res, status, err)
              : respond(req, res, status);
          });
        });

      });
    });
  });

}

//
// ### @private function _extendWithNonStrictRoutes (router, resource, options, respond)
// #### @router {director.http.Router} Router to extend with non-strict routes
// #### @resource {resourceful.Resource} Resource to use in routes.
// #### @options {Object} Options for routes added.
// #### @respond function
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
function _extendWithNonStrictRoutes (router, resource, options, respond) {

  var entity = resource._resource.toLowerCase(),
      param = options.param || ':id',
      pluralEntity;

  //
  // TODO: replace with proper inflection / pluralization library
  //
  pluralEntity = (entity + 's');

  //
  // Bind POST /new to resource.create
  //
  router.post('/' + pluralEntity + '/new', function (_id) {
    var res    = this.res,
        req    = this.req;
    if (!options.strict) {
      preprocessRequest(req, resource);
    }
    resource.create(req.body, function (err, result) {
      var status = 201;
      if (err) {
        status = 500;
        if (typeof err === "object") { // && key.valid === false
          status = 422;
        }
      }
      return err
        ? respond(req, res, status, err)
        : respond(req, res, status, entity, result);
    });
  });

  //
  // Bind /:resource/:param path
  //
  router.path('/' + pluralEntity + '/' + param, function () {
    //
    // Bind POST /:resource/:id/update to resource.destroy
    // Remark: Not all browsers support PUT verb, so we have to fake it
    //
    this.post('/update', function (_id) {
      var res = this.res,
          req = this.req;
      if (!options.strict) {
        preprocessRequest(req, resource);
      }
      resource.update(_id, this.req.body, function (err, result) {
        var status = 204;
        if (err) {
          status = 500;
          if (typeof err === "object") { // && key.valid === false
            status = 422;
          }
        }
        return err
          ? respond(req, res, status, err)
          : respond(req, res, status);
      });
    });

    //
    // Bind POST /:resource/:id/destroy to resource.destroy
    // Remark: Not all browsers support DELETE verb, so we have to fake it
    //
    this.post('/destroy', function (_id) {
      var res = this.res,
          req = this.req;
      resource.destroy(_id, function (err, result) {
        return err
          ? respond(req, res, 500, err)
          : respond(req, res, 204);
      });
    });
  });

}

//
// ### @private function respondWithResult (req, res, status, options, value)
// #### @req {http.ServerRequest} Incoming Server request
// #### @res {http.ServerResponse} Server respond to write to
// #### @status {number} Status code to respond with
// #### @key {Object|string} Object to respond with or key to set for `value`
// #### @value {Object} **Optional** Value to set in the result for the specified `key`
//
// Helper function for responding from `restful` routes:
//
//    respond(req, res, 200);
//    respond(req, res, 500, err);
//    respond(req, res, 200, 'users', [{...}, {...}, ...]);
//
function respondWithResult (req, res, status, key, value) {

  var result;

  res.writeHead(status);

  if (arguments.length === 5) {
    result = {};
    result[key] = value;
  }
  else {
    result = key;
  }

  res.end(result ? JSON.stringify(result) : '');
}

function preprocessRequest (req, resource) {
  //
  // Remark: `restful` generates a REST interface for a Resource.
  // Since Resources inheritently has more functionality then HTTP can provide out of the box,
  // we are required to perform some type cohersions for non-strict mode.
  //
  // For instance: If we know a property type to be Number and we are using a,
  // HTML4 input to submit it's value...it will always come in as a "numbery" String.
  //
  // This will cause the Number validation in Resourceful to fail since 50 !== "50"
  //
  // Attempt to coerce any incoming properties know to be Numbers to a Number
  //
  for(var p in req.body) {
    if (resource.schema.properties[p] && resource.schema.properties[p].type === "number") {
      req.body[p] = Number(req.body[p]);
      if(req.body[p].toString() === "NaN") {
        req.body[p] = "";
      }
    }
  }
  //
  // Not returning any values since "req" is referenced in parent scope.
  //
}