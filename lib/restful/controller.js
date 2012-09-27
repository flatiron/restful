//
// This "controller" module exists only to help keep some of the route handling code DRY
//                      It doesn't do anything fancy.
//

var controller = exports,
    utile = require('utile');

//
// "create" handler for all incoming routes which are intended to create resources
// There is only one way to make 
//     .parent - the parent resource constructor.
//     .parentID - ID of the parent resource
//
controller.create = function (req, res, resource, optionsRef, respond) {

  var options = utile.clone(optionsRef);

  //
  // Remark: We need to reserve the id "new" in order to make resource-routing work properly.
  // I don't agree with this, but I'm not aware of a better solution solution.
  //
  // Based on research, both Rails and Express follow this same convention,
  // so we might as well try to conform to that unless there is a better solution.
  //

  var createHandler = function (err, result) {
      var status = 201;
      if (err) {
        status = 500;
        if (typeof err === "object") { // && key.valid === false
          status = 422;
        }
      }
      req.restful = {
        error: err,
        action: 'show',
        data: result,
        resource: resource
      };
      return err
        ? respond(req, res, status, err)
        : respond(req, res, status, resource.lowerResource, result);
    }

  if (options.parent) {

    if (!options.parentID) {
      status = 500;
      req.restful.error = { validate: { valid : false }};
      return respond(req, res, status, { validate: { valid : false }});
    }

    options.parent.get(options.parentID, function(err, album) {
      if (typeof album == 'undefined')
        return respond(req, res, 404, "Could not find " + options.parent.lowerResource + " with id " + options.parentID);

      album['create' + resource._resource](req.body, createHandler);
    });
  } else {
    //
    // Else, there is no parent resource
    //
    resource.create(req.body, createHandler);
  }
};


controller.get = function (req, res, resource, optionsRef, respond) {
  var options = utile.clone(optionsRef),
      getter;

  req.restful = {};
  req.restful.action = "show";
  req.restful.resource = resource;
  if (options._id === "new") {
    req.restful.action = "create";
    return respond(req, res, 200)
  }

  var id = options._id.toString();
  resource.get(id, function (err, result) {
    if (err) {
      req.restful.data = id;
      return respond(req, res, 404, resource.lowerResource, id);;
    }
    req.restful.data = result;
    respond(req, res, 200, resource.lowerResource, result);
  });
}
