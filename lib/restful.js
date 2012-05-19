var director = require('director'),
    util     = require('util'),
    resourceful = require('resourceful');

exports.name = 'restful';

exports.createRouter = function (resource, options) {
  var resourcefulRouter = new ResourcefulRouter(resource, options);
  return resourcefulRouter;
}

/*

    Creates a new "ResourcefulRouter" instance that will dispatch RESTFul urls for specified resource

    POST    /creatures    => Creature.create()
    GET     /creatures    => Creature.all()
    GET     /creatures/1  => Creature.show()
    PUT     /creatures/1  => Creature.update()
    DELETE  /creatures/1  => Creature.destroy()
*/

var ResourcefulRouter = exports.ResourcefulRouter = function (resource, options) {

  options = options || {};
  
  //
  // If options.disable is defined, avoid polluting options and save it
  //
  if(options.disable) {
    this.disable = options;
    delete options.disable;
  }

  //
  // ResourcefulRouter inherits from director.http.Router
  //
  director.http.Router.call(this, options);

  this.resource = resource;

  this.strict = options.strict || false;

  _extendWithRoutes(this, resource);

}

//
// Inherit from `director.http.Router`.
//
util.inherits(ResourcefulRouter, director.http.Router);

function _extendWithNonStrictRoutes(router, resource) {

  /*

    Since not all HTTP clients support PUT and DELETE verbs ( such as forms in web browsers ),
    restful will also map the following browser friendly routes:

    If you prefer to not use this option, set { strict: true }

      POST  /creatures/1/update  => Creature.update()
      POST  /creatures/1/destroy => Creature.destroy()


    You might also want to consider using a rails-like approach which uses
    the convention of a reserved <form> input field called "_method" which contains either "PUT" or "DELETE"

      see: https://github.com/senchalabs/connect/blob/master/lib/middleware/methodOverride.js

  */

  //
  // Remark: Not all browsers support PUT verb, so we have to fake it
  //
  //
  // Bind POST /Resource/:id/update to resource.destroy
  //
  router.post('/update', function (_id) {
    var res = this.res;
    resource.update(_id, this.req.body, function(err, result){
      if (err) {
        res.writeHead(500);
        return res.end(JSON.stringify(err, true, 2));
      }
      res.writeHead(204);
      res.end();
    });
  });

  //
  // Remark: Not all browsers support DELETE verb, so we have to fake it
  //
  //
  // Bind POST /Resource/:id/destroy to resource.destroy
  //
  router.post("/destroy", function (_id) {
    var res = this.res;
    resource.destroy(_id, function(err, result){
      if (err) {
        res.writeHead(500);
        return res.end(JSON.stringify(err, true, 2));
      }
      res.writeHead(204);
      res.end();
    });
  });

}

function _extendWithRoutes (router, resource) {

  var entity = resource._resource.toLowerCase(),
      self   = this,
      pluralEntity;

  //
  // I would have prefered to use singular entity names,
  // but the pre-existing APIs were already using plural names :-(
  //

  //
  // TODO: replace with proper inflection / pluralization library
  //
  pluralEntity = (entity + "s");

  //
  // Bind resource.all ( show all ) to GET /Resource
  //
  if(!self.disable || Array.isArray(self.disable) && ~self.disable.indexOf('all')) {
    router.get('/' + pluralEntity, function () {
      var res = this.res;
      resource.all(function(err, results){
        if (err) {
          res.writeHead(500);
          return res.end(JSON.stringify(err));
        }
        res.end(JSON.stringify({ results: results }));
      });
    });
  }

  if(!self.disable || Array.isArray(self.disable) && ~self.disable.indexOf('create')) {
    //
    // Bind POST /Resource to resource.create()
    //
    router.post('/' + pluralEntity, function () {
      var object = this.req.body;
      var res = this.res;

      resource.create(object, function(err, result){
        if (err) {
          res.writeHead(500);
          return res.end(JSON.stringify(err, true, 2));
        } 
        res.writeHead(201);
        res.end(JSON.stringify(result));
      });
    });
    //
    // Bind POST /Resource/:id to resource.create(_id)
    //
    router.post('/' + pluralEntity + '/:id', function (_id) {
      var object = this.req.body;
      var res = this.res;
      object._id = _id;
      resource.create(object, function(err, result){
        if (err) {
          res.writeHead(500);
          return res.end(JSON.stringify(err, true, 2));
        }
        res.writeHead(201);
        res.end(JSON.stringify(result));
      });
    });
  }


  //
  // Bind /Resource/:id path
  //
  router.path('/' + pluralEntity + '/:id', function(){
    
    if(!self.disable || Array.isArray(self.disable) && ~self.disable.indexOf('get')) {
      //
      // Bind GET /Resource/:id to resource.get
      //
      router.get(function (_id) {
        var res    = this.res;
        resource.get(_id, function(err, result){
          if (err) {
            res.writeHead(404);
            res.end();
          }
          var json = {};
          json[entity] = result;
          res.end(JSON.stringify(json));
        });
      });
    }
    
    if(!self.disable || Array.isArray(self.disable) && ~self.disable.indexOf('destroy')) {
      //
      // Bind DELETE /Resource/:id to resource.destroy
      //
      router.delete(function (_id) {
        var res = this.res;
        resource.destroy(_id, function(err, result){
          if (err) {
            res.writeHead(500);
            return res.end(JSON.stringify(err, true, 2));
          }
          res.writeHead(204);
          res.end();
        });
      });
    }
    if(!self.disable || Array.isArray(self.disable) && ~self.disable.indexOf('update')) {
      //
      // Bind PUT /Resource/:id to resource.update
      //
      router.put(function (_id) {
        var res = this.res;
        resource.update(_id, this.req.body, function(err, result){
          if (err) {
            res.writeHead(500);
            return res.end(JSON.stringify(err, true, 2));
          } 
          res.writeHead(204);
          res.end();
        });
      });
    }
    //
    // If we are not in strict mode, then extend the router with,
    // some potentially helpful non-restful routes ( see below )
    //
    if (!router.strict) {
      _extendWithNonStrictRoutes(router, resource);
    }
  });

}

exports.attach = function () {
  var app = this;
  Object.keys(app.resources).forEach(function(resource) {
    //
    // Only exposes resources as restful if they have set:
    //
    //     Resource.restful = true
    //
    if (app.resources[resource].restful) {
      _extendWithRoutes(app.router, app.resources[resource]);
    }
  });


};

exports.init = function (cb) {
  cb(null);
};
