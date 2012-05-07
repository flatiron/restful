var director = require('director'),
    util     = require('util');

exports.createRouter = function (resource, options) {

  var resourcefulRouter = new ResourcefulRouter(resource, options);

  return resourcefulRouter;

}

/*

    Creates a new "ResourcefulRouter" instance that will dispatch RESTFul urls for specified resource

    POST    /Creature    => Creature.create()
    GET     /Creature    => Creature.all()
    GET     /Creature/1  => Creature.show()
    PUT     /Creature/1  => Creature.update()
    DELETE  /Creature/1  => Creature.destroy()
*/

var ResourcefulRouter = exports.ResourcefulRouter = function (resource, options) {

  options = options || {};

  //
  // ResourcefulRouter inherits from director.http.Router
  //
  director.http.Router.call(this, options);

  this.resource = resource;

  this.strict = options.strict || false;

  //
  // Bind resource.all ( show all ) to GET /Resource
  //
  this.get('/' + resource._resource, function () {
    var res = this.res;
    resource.all(function(err, results){
      if (err) {
        res.writeHead(500);
        return res.end(JSON.stringify(err));
      }
      res.end(JSON.stringify(results));
    });
  });

  //
  // Bind POST /Resource to resource.create()
  //
  this.post('/' + resource._resource, function () {
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
  this.post('/' + resource._resource + '/:id', function (_id) {
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

  //
  // Bind /Resource/:id path
  //
  this.path('/' + resource._resource + '/:id', function(){
    
    //
    // Bind GET /Resource/:id to resource.get
    //
    this.get(function (_id) {
      var res    = this.res;
      resource.get(_id, function(err, record){
        if (err) {
          res.writeHead(404);
          res.end();
        }
        res.end(JSON.stringify(record));
      });
    });

    //
    // Bind DELETE /Resource/:id to resource.destroy
    //
    this.delete(function (_id) {
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

    //
    // Bind PUT /Resource/:id to resource.update
    //
    this.put(function (_id) {
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
    // If we are not in strict mode, then extend the router with,
    // some potentially helpful non-restful routes ( see below )
    //
    if (!this.strict) {
      this._extendWithNonStrictRoutes();
    }
  });

}

//
// Inherit from `director.http.Router`.
//
util.inherits(ResourcefulRouter, director.http.Router);

ResourcefulRouter.prototype._extendWithNonStrictRoutes = function () {

  /*

    Since not all HTTP clients support PUT and DELETE verbs ( such as forms in web browsers ),
    restful will also map the following browser friendly routes:

    If you prefer to not use this option, set { strict: true }

      POST  /Creature/1/update  => Creature.update()
      POST  /Creature/1/destroy => Creature.destroy()


    You might also want to consider using a rails-like approach which uses
    the convention of a reserved <form> input field called "_method" which contains either "PUT" or "DELETE"

      see: https://github.com/senchalabs/connect/blob/master/lib/middleware/methodOverride.js

  */

  var router   = this,
      resource = this.resource;

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
