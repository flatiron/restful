/*
 * restful.js: Restful routing using resourceful and director.
 *
 * (C) 2012, Nodejitsu Inc.
 *
 */

var director = require('director'),
    resourceful = require('resourceful'),
    de       = require('director-explorer'),
    controller = require('./restful/controller'),
    url      = require('url'),
    qs       = require('qs'),
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
  var router = exports.createRouter(resources, options),
  server = http.createServer(function (req, res) {
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

  server.router = router;
  return server;

};

//
// ### function ResourcefulRouter (resource, options)
// #### @resource {resourceful.Resource} Resource to use for the router.
// #### @options {Object} Options to use when attaching routes
//
// "ResourcefulRouter" Constructor function that will dispatch RESTFul urls
// for specified resource
//
// POST    /creature    => Creature.create()
// GET     /creature    => Creature.all()
// GET     /creature/1  => Creature.show()
// PUT     /creature/1  => Creature.update()
// DELETE  /creature/1  => Creature.destroy()
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
  done();
};

exports.attach = function (options) {
  var app = this;
  if (app.resources) {
    Object.keys(app.resources).forEach(function (resource) {
      resourceful.register(resource, app.resources[resource]);
    });
    Object.keys(app.resources).forEach(function (resource) {
      var _options = options || app.resources[resource].restful || {};
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
          _options
        );
      }
    });
  }
}

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
      // Remark: Output the basic routing map for every resource using https://github.com/flatiron/director-reflector
      //
      rsp += de.table(router);
      this.res.end(rsp);
    });
  } else {
    router.get('/', function (_id) {
      var res = this.res,
          req = this.req;
      if (!options.strict) {
        preprocessRequest(req, resources, 'index');
      }
      respond(req, res, 200, '', resources);
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
        param = options.param || ':id';
    //
    // Check to see if resource has any children
    //
    if (resource._children && resource._children.length > 0) {
      //
      // For every child the resource has,
      // recursively call the extendRouter method,
      // prefixing the current resource as the base path
      //
      resource._children.forEach(function(child){
        var childResource = resourceful.resources[child],
            clonedOptions = utile.clone(options);
        //
        // Remark: Create a new instance of options since we don't want,
        // to modify the reference scope inside this extendRouter call
        //
        clonedOptions.parent = resource;

        //
        // Also, extend the router to expose child resource as child of parent
        //
        if(resource._parents.length === 0) {
          clonedOptions.prefix = clonedOptions.prefix + '/' + entity + '/:id/';
        } else {
          clonedOptions.prefix = '/' + entity + '/:id/';
        }
        _extend(router, childResource, clonedOptions, respond);
      });
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
    router.path(options.prefix + '/' + entity, function () {
      //
      // Bind resource.all ( show all ) to GET /:resource
      //
      this.get(function () {
        var res = this.res,
            req = this.req;
          resource.all(function (err, results) {
            if (!options.strict) {
              preprocessRequest(req, resource, 'list', results);
            }
            return err
              ? respond(req, res, 500, err)
              : respond(req, res, 200, entity, results);
        });
      });

      //
      // Bind POST /:resource to resource.create()
      //
      this.post(function (_id) {
        var res    = this.res,
            req    = this.req;
        if (!options.strict) {
          preprocessRequest(req, resource);
        }
        var cloned = utile.clone(options);
        cloned.parentID = _id;
        controller.create(req, res, resource, cloned, respond);
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

          var cloned = utile.clone(options);
          cloned._id = _id;
          cloned.childID = childID;
          controller.create(req, res, resource, cloned, respond);

        });

        //
        // Bind GET /:resource/:id to resource.get
        //
        this.get(function (_id, childID) {
          var req = this.req,
              res = this.res;
            if (!options.strict) {
              preprocessRequest(req, resource, 'show');
            }
            var cloned = utile.clone(options);
            cloned._id = _id;
            cloned.childID = childID;
            controller.get(req, res, resource, cloned, respond);
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
// POST  /creature/1/update  => Creature.update()
// POST  /creature/1/destroy => Creature.destroy()
//
// You might also want to consider using a rails-like approach which uses
// the convention of a reserved <form> input field called "_method" which contains either
// "PUT" or "DELETE"
//
// see: https://github.com/senchalabs/connect/blob/master/lib/middleware/methodOverride.js
//
function _extendWithNonStrictRoutes(router, resource, options, respond) {
  var entity = resource._resource.toLowerCase(),
      param = options.param || ':id';
  //
  // Bind POST /new to resource.create
  //
  router.post(options.prefix + '/' + entity + '/new', function (_id) {
    var res = this.res,
        req = this.req;

    if(typeof _id !== 'undefined') {
      _id = _id.toString();
    }

    var action = "show";
    preprocessRequest(req, resource, action);
    resource.create(req.restful.data, function (err, result) {
      var status = 201;
      if (err) {
        status = 500;
        action = "create";
        if (typeof err === "object") { // && key.valid === false
          status = 422;
        }
      }
      preprocessRequest(req, resource, action, result, err);
      return err
        ? respond(req, res, status, err)
        : respond(req, res, status, entity, result);
    });
  });


  router.get(options.prefix + '/' + entity + '/find', function () {
    var res = this.res,
        req = this.req;
    preprocessRequest(req, resource, 'find');
    resource.find(req.restful.data, function(err, result){
      respond(req, res, 200, entity, result);
    });
  });

  router.post(options.prefix + '/' + entity + '/find', function () {
    var res = this.res,
        req = this.req;
    preprocessRequest(req, resource, 'find');
    resource.find(req.restful.data, function(err, result){
      respond(req, res, 200, entity, result);
    });
  });

  router.get(options.prefix + '/' + entity + '/new', function (_id) {
    var res = this.res,
        req = this.req;
    preprocessRequest(req, resource, 'create');
    respond(req, res, 200, '', {});
  });

  //
  // Bind /:resource/:param path
  //
  router.path(options.prefix + '/' + entity + '/' + param, function () {

    this.get('/update', function (_id) {
      var res = this.res,
          req = this.req;
      preprocessRequest(req, resource, 'update');
      resource.get(_id, function(err, result){
        preprocessRequest(req, resource, 'update', result, err);
        return err
          ? respond(req, res, 500, err)
          : respond(req, res, 200, entity, result);
      })
    });

    this.get('/destroy', function (_id) {
      var res = this.res,
          req = this.req;
      preprocessRequest(req, resource, 'destroy');
      resource.get(_id, function(err, result){
        preprocessRequest(req, resource, 'destroy', result, err);
        if(err) {
          req.restful.data = _id;
        }
        return err
          ? respond(req, res, 500, err)
          : respond(req, res, 200, entity, result);
      })
    });

    //
    // Bind POST /:resource/:id/destroy to resource.destroy
    // Remark: Not all browsers support DELETE verb, so we have to fake it
    //
    this.post('/destroy', function (_id) {
      var req = this.req,
          res = this.res;
      if (!options.strict) {
        preprocessRequest(req, resource, 'destroy');
      }
      resource.destroy(_id, function (err, result) {
        req.restful.data = _id;
        return err
          ? respond(req, res, 500, err)
          : respond(req, res, 204);
      });
    });

    //
    // Bind POST /:resource/:id/update to resource.update
    // Remark: Not all browsers support PUT verb, so we have to fake it
    //
    this.post('/update', function (_id) {
      var req = this.req,
          res = this.res;

      if (!options.strict) {
        preprocessRequest(req, resource, 'update');
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
function preprocessRequest(req, resource, action, data, error) {

  data = data || {};
  error = error || null;
  req.body = req.body || {};

  //
  // Remark: `restful` generates a REST interface for a Resource.
  // Since Resources inheritently has more functionality then HTTP can provide out of the box,
  // we are required to perform some type cohersions for non-strict mode.
  //
  // For instance: If we know a property type to be Number and we are using a,
  // HTML4 input to submit it's value...it will always come in as a "numbery" String.
  //
  // This will cause the Number validation in Resourceful to fail since 50 !== "50"

  for (var p in req.body) {

    //
    // Number: Attempt to coerce any incoming properties know to be Numbers to a Number
    //
    if (resource.schema.properties[p] && resource.schema.properties[p].type === "number") {
      req.body[p] = Number(req.body[p]);
      if (req.body[p].toString() === "NaN") {
        req.body[p] = "";
      }
    }

    //
    // Array: Attempt to coerce any incoming properties know to be Arrays to an Array
    //
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

    //
    // Boolean: Attempt to coerce any incoming properties know to be boolean to an boolean
    //
    if (resource.schema.properties[p] && resource.schema.properties[p].type === "boolean") {
      if(typeof req.body[p] !== 'undefined') {
        data[p] = true;
      } else {
        data[p] = false;
      }
    }
  }

  var query = url.parse(req.url),
      params = qs.parse(query.query);

  //
  // Merge query and form data
  //
  for(var p in req.body) {
    if(typeof data[p] === 'undefined') {
      data[p] = req.body[p];
    }
  }

  for(var p in params) {
    if(typeof data[p] === 'undefined') {
      data[p] = params[p];
    }
  }

  //
  // Remark: Append a new object to the req for additional processing down the middleware chain
  //
  req.restful = {
    action: action,
    resource: resource,
    data: data,
    error: error
  };

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
