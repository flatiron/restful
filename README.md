# Restful

[![Build Status](https://secure.travis-ci.org/flatiron/restful.png)](http://travis-ci.org/flatiron/restful)

Creates [RESTful](http://en.wikipedia.org/wiki/Representational_state_transfer) [Director](http://github.com/flatiron/director) routers for [resourceful](http://github.com/flatiron/resourceful) resources. Can be used as a stand-alone module or as a [Flatiron](http://github.com/flatiron/) plugin.

# Explanation

The restful project removes the process of writing boilerplate routing code for interacting with  [resourceful](http://github.com/flatiron/resourceful) resources. Restful uses <a href="http://en.wikipedia.org/wiki/Reflection_(computer_programming)">reflection</a> to reflect an http router interface which maps all the restful routes needed to perform basic [CRUD](http://en.wikipedia.org/wiki/Create,_read,_update_and_delete) operations with [resourceful](http://github.com/flatiron/resourceful). restful also has the ability to expose additional arbitrary <a href="#remote">remote resource methods</a> through it's http router interface. Through the removal of this boilerplate code, restful creates a robust, standardized, and re-usable http interface for any [resourceful](http://github.com/flatiron/resourceful) resource.

# Installation

     npm install restful

# Usage

## As a Flatiron Plugin

```js
TODO
```

## As a stand-alone app

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

## Core Mappings

  By default, `restful` will map the following `Resourceful` methods.

    POST    /creatures    => Creature.create()
    GET     /creatures    => Creature.all()
    GET     /creatures/1  => Creature.show()
    PUT     /creatures/1  => Creature.update()
    DELETE  /creatures/1  => Creature.destroy()

  The `Director` router will dispatch all incoming RESTFul urls to the Creature resource and respond back with the appropriate result.

## Non-strict Mappings

Since not all HTTP clients support PUT and DELETE verbs ( such as forms in web browsers ),
restful will also map the following browser friendly routes:
    POST  /creatures/1/update  => Creature.update()
    POST  /creatures/1/destroy => Creature.destroy()

*If you prefer to not use this option, set `{ strict: true }`. You might also want to consider using a rails-like approach which uses the convention of a reserved `<form>` input field called "_method" which contains either "PUT" or "DELETE" see: https://github.com/senchalabs/connect/blob/master/lib/middleware/methodOverride.js*

<a name"remote"></a>
## Exposing Arbitrary Resource Methods

In many cases, you'll want to expose additional methods on a Resource through the router outside of the included CRUD operations: `create`, `all`, `show`, `update`, `destroy`.

Restful has built in support for easily exposing arbitrary remote resource methods as `Director` routes.

Consider the example of a `Creature`. We've already defined all the restful CRUD routes, but a Creature also needs to eat! Simply create a new method on the `Creature` resource called `feed`.

```js
Creature.feed = function (_id, options, callback) {
  callback(null, 'I have been fed');
}
```
This `feed` method is consider private by default, in that it will not be exposed to the web unless it's set to a `remote` function. To set a resource method to remote, simply:

```js
Creature.feed.remote = true
```

It's easy as that! By setting the `feed` method to remote, the following routes will exist in the `Director` router.

    POST    /creatures/1/feed    => Creature.feed()
    GET     /creatures/1/feed    => Creature.feed()


## Resource Security

There are several ways to provide security and authorization for accessing resource methods exposed with restful. The recommended pattern for authorization is to use resourceful's ability for `before` and `after` hooks. In these hooks, you can add additional business logic to restrict access to the resource's methods. 

It is **not** recommended to place authorization logic in the routing layer, as in an ideal world the router will be a reflected interface of your resource. In theory, the security of the router is somewhat irrelevant since the resource could have multiple reflected interfaces that all required the same business logic. 

**TL;DR; For security and authorization, you should use resourceful's `before` and `after` hooks.**

# Tests

     npm test

# TODO

 - Full `resourceful` property type support ( numeric, boolean, array, object )
 - Full `resourceful` nested property schema support
 - Add ability to specify schemas for remote method argument payloads
 - Implement and document browser support
 - Improve Tests
 - Add better error support via `errs` library
