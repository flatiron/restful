# Restful

[![Build Status](https://secure.travis-ci.org/flatiron/restful.png)](http://travis-ci.org/flatiron/restful)

Creates [RESTful](http://en.wikipedia.org/wiki/Representational_state_transfer) [Director](http://github.com/flatiron/director) routers for [resourceful](http://github.com/flatiron/resourceful) models. Can be used as a stand-alone module or as a [Flatiron](http://github.com/flatiron/) plugin.

# Installation

     npm install restful


# Explanation

Restful removes the process of having to write boilerplate routing tables for resource.

# Usage

``` js
  var http        = require('http'),
      restful     = require('../lib/restful'),
      resourceful = require('resourceful');

  //
  // Create a new Creature resource using the Resourceful library
  //
  var Creature = resourceful.define('creature', function () {
    //
    // Specify a storage engine
    //
    this.use('memory');
    //
    // Specify some properties with validation
    //
    this.string('type');
    this.string('description');
  });

  //
  // Create a new Director routing map based on "Creature" resource
  //
  var router = restful.createRouter(Creature);

  //
  // Setup a very simple HTTP server to serve our routing map!
  //
  var server = http.createServer(function (req, res) {
    req.chunks = [];
    req.on('data', function (chunk) {
      req.chunks.push(chunk.toString());
    });

    router.dispatch(req, res, function (err) {
      if (err) {
        res.writeHead(404);
        res.end();
      }
      console.log('Served ' + req.url);
    });
  });
  console.log('server started on port 8000 - try visiting http://localhost:8000/explore')
  server.listen(8000);
```

### Core Mappings

  By default, `restful` will map the following `Resourceful` methods.

    POST    /creatures    => Creature.create()
    GET     /creatures    => Creature.all()
    GET     /creatures/1  => Creature.show()
    PUT     /creatures/1  => Creature.update()
    DELETE  /creatures/1  => Creature.destroy()

  The `Director` router will dispatch all incoming RESTFul urls to the Creature resource and respond back with the appropriate result.

### Non-strict Mappings

Since not all HTTP clients support PUT and DELETE verbs ( such as forms in web browsers ),
restful map also map the following browser friendly routes:

If you prefer to not use this option, set { strict: true }

    POST  /creatures/1/update  => Creature.update()
    POST  /creatures/1/destroy => Creature.destroy()

You might also want to consider using a rails-like approach which uses the convention of a reserved `<form>` input field called "_method" which contains either "PUT" or "DELETE"

   see: https://github.com/senchalabs/connect/blob/master/lib/middleware/methodOverride.js

### Exposing Arbitrary Resource Methods

In many cases, you'll want to expose additional `Resourceful` methods through your router outside of the included: `create`, `all`, `show`, `update`, `destroy`.

Restful has built in support for easily exposing arbitrary resource methods as `Director` routes.

Consider the example of a Creature. We've already defined all the restful routes required CRUD access, but a Creature also needs to eat! Simply create a new method on the resource, `feed`.

```js
    Creature.feed = function (_id, options, callback) {
      callback(null, 'I have been fed');
    }
```
Now this `feed` method is consider private by default. It will not be exposed to the web unless we set it as a `remote` function. To set a resource method to remote, simply:

```js
    Creature.feed.remote = true
```

It's easy as that! By setting the `feed` method to remote, you will have the following mappings in your `Director` router.

    POST    /creatures/1/feed    => Creature.feed()
    GET     /creatures/1/feed    => Creature.feed()


# Resource Security

There are several ways to provide security and authorization for accessing resource methods exposed with `restful`. The recommended choice of security is to use resourceful's ability for `before` and `after` hooks. In these hooks, you can add authorization. It's not recommended to place your authorization logic in the routing layer, as in an ideal world your router will be a reflected interface of your resource. In theory, the security of the router is irrelevant since the resource may have multiple reflected interfaces that all required the same authorization business logic. You should yse resourceful's `before` and `after` hooks.

# Tests

     npm test

# TODO

 - Full `resourceful` property type support ( numeric, boolean, array, object )
 - Full `resourceful` nested property schema support
 - Add ability to specify schemas for remote method argument payloas
 - Implement and document browser support
 - Improve Tests
 - Add better error support via `errs` library
