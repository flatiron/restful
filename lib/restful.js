/*
 * restful.js: Restful routing using resourceful and director.
 *
 * (C) 2012, Nodejitsu Inc.
 *
 */

var director = require('director'),
    resourceful = require('resourceful'),
    de       = require('director-explorer'),
    util     = require('util'),
    utile    = require('utile'),
    http     = require('http');

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
// ### function createServer (resources)
// #### @resources {resourceful.Resource} Resource(s) to use for the router.
//
// Responds with an `http.Server` instance with a `RestfulRouter` for the
// specified `resources`.
//
exports.createServer = function (resources, options, handler) {
  var router = exports.createRouter(resources, options);

  return http.createServer(function (req, res) {
    req.chunks = [];
    req.on('data', function (chunk) {
      req.chunks.push(chunk.toString());
    });

    router.dispatch(req, res, function (err) {
      if (err) {
        //
        // TODO: Dont always respond with 404
        //
        res.writeHead(404);
        res.end();
      }
      console.log('Served ' + req.url);
    });
  });
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
      //     Resource.restful = { param: ':custom' };
      //
      if (app.resources[resource].restful) {
        exports.extendRouter(
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
// #### @options {Object} or {Boolean} Options for routes added.
// #### @respond {function} Function to write to the outgoing response
//
// Extends the `router` with routes for the `resources` supplied and the
// specified `options` and `respond` function to write to outgoing
// `http.ServerResponse` streams.
//
exports.extendRouter = function (router, resources, options, respond) {
  options = options || {};
  //
  // Remark: If resource.restful has been set to "true",
  // use default options
  //
  if(typeof options === "boolean" && options) {
    options = {};
  }

  options.prefix  = options.prefix || '';
  options.strict  = options.strict || false;
  options.exposeMethods = options.exposeMethods || true;

  if(typeof options.explore === "undefined") {
    options.explore = true;
  }

  respond = respond || respondWithResult;

  if (!Array.isArray(resources)){
    resources = [resources];
  }

  if (options.explore) {
    //
    // Bind GET / to a generic explorer view of routing map ( using `director-explorer` )
    //
    router.get('/', function () {
      var rsp = '';
      //
      // Output the basic routing map for every resource
      //
      rsp += de.table(router);
      //
      // Output schema for every resource
      //
      //rsp += prettyPrint(resources)
      this.res.end(rsp);
    });
  }
  _extend(router, resources, options, respond);
};


function _extend (router, resources, options, respond) {

  if (!Array.isArray(resources)){
    resources = [resources];
  }

  resources.forEach(function (resource) {
    var entity = resource._resource.toLowerCase(),
        param = options.param || ':id',
        pluralEntity = inflect(entity);

    //
    // Check if resource has any children
    // If a resource has children, we'll need to recursively
    // call the extendRouter method, prefixing the current resource
    // as the base path
    //
    if (resource._children && resource._children.length > 0) {
      var childResource = resourceful.resources[resource._children[0]],
          clonedOptions = utile.clone(options);
      //
      // Remark: Create a new instance of options since we don't want,
      // to modify the reference scope inside this extendRouter call
      //
      clonedOptions.parent = resource;
      //
      // Extend the router to expose child resource as base path
      //
      _extend(router, childResource, clonedOptions, respond);

      //
      // Also, extend the router to expose child resource as child of parent
      //
      clonedOptions.prefix = '/' + pluralEntity + '/:id/';
      _extend(router, childResource, clonedOptions, respond);
    }

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
    router.path(options.prefix + '/' + pluralEntity, function () {
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
        // If we are going to expose Resource methods to the router interface
        //
        if (options.exposeMethods) {
          //
          // Find every function on the resource,
          // which has the "remote" property set to "true"
          //
          for (var m in resource) {
            if(typeof resource[m] === "function" && resource[m].remote === true) {
              var self = this;

              //
              // For every function we intent to expose remotely,
              // bind a GET and POST route to the method
              //
              (function(m){
                self.path('/' + m.toLowerCase(), function(){
                   this.get(function (_id) {
                     var req = this.req,
                         res = this.res;
                    resource[m](_id, req.body, function(err, result){
                       return err
                         ? respond(req, res, 500, err)
                         : respond(req, res, 200, 'result', result);
                     });
                   });
                   this.post(function (_id) {
                     var req = this.req,
                         res = this.res;
                     resource[m](_id, req.body, function(err, result){
                       return err
                         ? respond(req, res, 500, err)
                         : respond(req, res, 200, 'result', result);
                     });
                   });
                });
              })(m)
            }
          }
        }

        //
        // Bind POST /:resource/:id to resource.create(_id)
        //
        this.post(function (_id, childID) {
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

          //
          // If the _id is "new", then check the req.body to see,
          // if there is a valid "_id" in the body
          //
          if (_id !== "new") {
            req.body.id = _id;
          }

          //
          // If a parent has been passed in and we have a child id,
          // we need to first fetch the parent, then create the child,
          // in the context of that parent
          //
          if (options.parent && typeof childID !== 'undefined') {
            req.body.id = childID;
            options.parent.get(_id, function(err, album) {
              album['create' + resource._resource](req.body, function (err, result) {
                return err
                  ? respond(req, res, 500, err)
                  : respond(req, res, 201, entity, result);
              });
            });
          } else {
            resource.create(req.body, function (err, result) {
              return err
                ? respond(req, res, 500, err)
                : respond(req, res, 201, entity, result);
            });
          }
        });

        //
        // Bind GET /:resource/:id to resource.get
        //
        this.get(function (_id, childID) {
          var req = this.req,
              res = this.res;

          // Remark: We need to reserve the id "new" in order to make resource-routing work properly.
          // I don't agree with this, but I'm not aware of a better solution solution.
          //
          // Based on research, both Rails and Express follow this same convention,
          // so we might as well try to conform to that unless there is a better solution.
          //
          if (_id === "new") {
            return respond(req, res, 404);
          }

          //
          // Remark: If a parent has been passed in and we have a child id,
          // append together the child resource, parent resource, parent id, and child id,
          // to create the unique key to fetch
          //
          if (options.parent && typeof childID !== 'undefined') {
            _id = options.parent._resource.toLowerCase() + '/' + _id + '/' + childID;
          }
          resource.get(_id, function (err, result) {
            if (err) {
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
        this.delete(function (_id, childID) {
          var req = this.req,
              res = this.res;

          if (options.parent && typeof childID !== 'undefined') {
            _id = options.parent._resource.toLowerCase() + '/' + _id + '/' + childID;
          }

          resource.destroy(_id, function (err, result) {
            return err
              ? respond(req, res, 500, err)
              : respond(req, res, 204);
          });
        });

        //
        // Bind PUT /:resource/:id to resource.update
        //
        this.put(function (_id, childID) {
          var req = this.req,
              res = this.res;
          if (!options.strict) {
            preprocessRequest(req, resource);
          }

          if (options.parent && typeof childID !== 'undefined') {
            _id = options.parent._resource.toLowerCase() + '/' + _id + '/' + childID;
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
function _extendWithNonStrictRoutes(router, resource, options, respond) {
  var entity = resource._resource.toLowerCase(),
      param = options.param || ':id',
      pluralEntity = inflect(entity);

  //
  // Bind POST /new to resource.create
  //
  router.post(options.prefix + '/' + pluralEntity + '/new', function (_id) {
    var res = this.res,
        req = this.req;

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
  router.path(options.prefix + '/' + pluralEntity + '/' + param, function () {
    //
    // Bind POST /:resource/:id/update to resource.update
    // Remark: Not all browsers support PUT verb, so we have to fake it
    //
    this.post('/update', function (_id) {
      var req = this.req,
          res = this.res;

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
          : respond(req, res, status, entity, result);
      });
    });


    //
    // Bind POST /:resource/:id/destroy to resource.destroy
    // Remark: Not all browsers support DELETE verb, so we have to fake it
    //
    this.post('/destroy', function (_id) {
      var req = this.req,
          res = this.res;
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
function respondWithResult(req, res, status, key, value) {
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

//
// ### function (req, resource)
// #### @req {http.ServerRequest} Server request to preprocess
// #### @resource {resourceful.Resource} Resource to preprocess against req
//
// Preprocesses "numbery" strings in the `req` body.
//
function preprocessRequest(req, resource) {
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
  // Number: Attempt to coerce any incoming properties know to be Numbers to a Number
  //
  for (var p in req.body) {
    if (resource.schema.properties[p] && resource.schema.properties[p].type === "number") {
      req.body[p] = Number(req.body[p]);
      if (req.body[p].toString() === "NaN") {
        req.body[p] = "";
      }
    }
  }

  //
  // Array: Attempt to coerce any incoming properties know to be Arrays to an Array
  //
  for (var p in req.body) {
    if (resource.schema.properties[p] && resource.schema.properties[p].type === "array") {
      //
      // TODO: Better array creation than eval
      //
      try {
        req.body[p] = eval(req.body[p]);
      } catch (err) {
      }
      if (!Array.isArray(req.body[p])) {
        req.body[p] = [];
      }
    }
  }

  //
  // TODO: If there is no in-coming ID, check to see if we have any attempted secondary keys
  //
      /*
      if (_id.length === 0) {
          ('check for alts');
        if(req.body.name) {
          _id = req.body.name;
        }
      }*/

  //
  // Remark: Not returning any values since "req" is referenced in parent scope.
  //
}

//
// ### function inflect (str)
// #### @str {string} String to inflect
//
// Responds with a properly pluralized string for `str`.
//
function inflect (str) {
  return utile.inflect.pluralize(str);
}

function prettyPrint (resources) {
  var str = '';
  resources.forEach(function(resource){
    str += '\n\n';
    str += '## ' + resource._resource + ' - schema \n\n';
    str += JSON.stringify(resource.schema.properties, true, 2) + '\n\n';
  });
  return str;
}
