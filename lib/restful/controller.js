//
// This "controller" module exists only to help keep some of the route handling code DRY
//                      It doesn't do anything fancy.
//

var controller = exports,
    utile = require('utile');

//
// TODO: document the various cases / routes that "controller.create" handles
//
  /*
    POST /:resource                               with or without parent
    POST /:resource/:id                           with or without parent
    POST /:resource/:id/:childResource            with childID in req.body
    POST /:resource/:id/:childResource/:childID 
  */

//
// "create" handler for all incoming routes which are intended to create resources
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

  //
  // If the _id is "new", then check the req.body to see,
  // if there is a valid "_id" in the body
  //
  if (options._id && options._id !== "new") {
    req.body.id = options._id.toString();
  }
  
  if (options.parent) {

    //
    // TODO: Clean up this block of code
    //

    var parentField = options.parent.lowerResource + '_id';
    var parentID = 0;
    
    // either has id in the body, or sent in the route as the _id
    if(typeof options._id !== 'undefined') {
      parentID = options._id.toString();
    }

    if (typeof options.parentID !== 'undefined') {
      parentID = options.parentID;
    }

    if(typeof req.body[parentField] === 'undefined' && typeof options._id === 'undefined' && typeof options.parentID === 'undefined') {
      status = 500;
      req.restful.error = { validate: { valid : false }};
      return respond(req, res, status, { validate: { valid : false }});
    }

    if (typeof req.body.id !== 'undefined' && options.childID === 'undefined') {
      options._id = req.body.id;
    } 

    if (typeof options.childID !== 'undefined') {
      req.body.id = options.childID;
    }
    
    if(typeof req.body[parentField] !== 'undefined') {
      parentID = req.body[parentField];
    }
    
    options.parent.get(parentID, function(err, album) {
      album['create' + resource._resource](req.body, function (err, result) {
        req.restful.error = err;
        return err
          ? respond(req, res, 500, err)
          : respond(req, res, 201, resource._resource.toLowerCase(), result);
      });
    });
  } else {
    //
    // Else, there is no parent resource
    //
    resource.create(req.body, function (err, result) {
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
        data: result
      };
      return err
        ? respond(req, res, status, err)
        : respond(req, res, status, resource._resource.toLowerCase(), result);
    });
  }
};


controller.get = function (req, res, resource, optionsRef, respond) {
  req.restful = {};
  req.restful.action = "show";
  req.restful.resource = resource;
  var options = utile.clone(optionsRef);
  if (options._id === "new") {
    req.restful.action = "create";
    return respond(req, res, 200)
  }
  options._id = options._id.toString();

  //
  // Remark: If a parent has been passed in and we have a child id,
  // append together the child resource, parent resource, parent id, and child id,
  // to create the unique key to fetch
  //

  if (options.parent) {
    if (typeof options.childID !== 'undefined') {
      options._id = options.parent._resource.toLowerCase() + '/' + options._id + '/' + options.childID;
      resource.get(options._id, function(err, result) {
          return err
            ? respond(req, res, 404, err)
            : respond(req, res, 200, resource._resource.toLowerCase(), result);
      });
    } else {
      respond(req, res, 404);
    }
  } else {
    resource.get(options._id, function (err, result) {
      if (err) {
        req.restful.data = options._id;
        return respond(req, res, 404, resource._resource.toLowerCase(), options._id);;
      }
      req.restful.data = result;
      respond(req, res, 200, resource._resource.toLowerCase(), result);
    });
  }
}