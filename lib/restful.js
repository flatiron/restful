var fs       = require('fs'),
    director = require('director');

exports.createRouter = function (resource) {
  //
  // Create a new routing map using Director
  //
  var router = new director.http.Router();
  
  //
  // Bind resource.all ( show all ) to GET /Resource
  //
  router.get('/' + resource._resource, function () {
    var res = this.res;
    resource.all(function(err, results){
      if (err) {
        return res.end(JSON.stringify(err));
      }
      res.end(JSON.stringify(results));
    });  
  });
  
  //
  // Bind POST /Resource to resource.create()
  //
  router.post('/' + resource._resource, function (params) {
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
  router.post('/' + resource._resource + '/:id', function (_id) {
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
  router.path('/' + resource._resource + '/:id', function(){
    
    //
    // Bind GET /Resource/:id to resource.get
    //
    this.get(function (_id) {
      var res    = this.res, 
          params = this.req.body;
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
          console.log(err);
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
    // Remark: Not all browsers support PUT verb, so we have to fake it
    //
    //
    // Bind POST /Resource/:id/update to resource.destroy
    //
    this.post('/update', function (_id) {
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
    this.post("/destroy", function (_id) {
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
  });
  return router;
}