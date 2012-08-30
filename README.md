# Restful

[![Build Status](https://secure.travis-ci.org/flatiron/restful.png)](http://travis-ci.org/flatiron/restful)

Reflects [RESTful](http://en.wikipedia.org/wiki/Representational_state_transfer) [Director](http://github.com/flatiron/director) routers from [resourceful](http://github.com/flatiron/resourceful) resources. Can be used as a stand-alone module or as a [Flatiron](http://github.com/flatiron/) plugin.

# Explanation

The restful project removes the process of writing boilerplate routing code for interacting with  [resourceful](http://github.com/flatiron/resourceful) resources. Restful uses <a href="http://en.wikipedia.org/wiki/Reflection_(computer_programming)">reflection</a> to reflect an http router interface which maps all the restful routes needed to perform basic [CRUD](http://en.wikipedia.org/wiki/Create,_read,_update_and_delete) operations with [resourceful](http://github.com/flatiron/resourceful). restful also has the ability to expose additional arbitrary <a href="#remote">remote resource methods</a> in it's http router interface. 

Through the removal of this boilerplate code, restful creates a robust, standardized, and re-usable http interface for any [resourceful](http://github.com/flatiron/resourceful) resource.

**Remark:** If you don't like REST and would prefer a socket, use the [socketful](http://github.com/flatiron/socketful) library!

# Installation

     npm install restful

# Usage

## Define resource(s)

```js
var resourceful = require('resourceful'),
    Creature    = resourceful.define('creature');

Creature.property('type', String, { default: "dragon" });
Creature.property('life', Number, { default: 10, minimum: 0, maximum: 20 });
```

*[additional API documentation for defining resources](http://github.com/flatiron/resourceful)*

## As a Flatiron plugin

To use restful as a <a href="http://github.com/flatiron/flatiron">Flatiron</a> plugin you will have to:

 - Define resource(s) in your Flatiron app
 - Use the restful plugin in your Flatiron app
 - Set `restful=true` on the resource to let Flatiron know to expose it

Here is a code example of using restful as a Flatiron plugin: <a href="https://github.com/flatiron/restful/blob/master/examples/app.js">https://github.com/flatiron/restful/blob/master/examples/app.js</a>

## As a stand-alone server

To use restful as a stand-alone server you will have to:

 - Define resource(s)
 - Create a new server based on the resource(s) using `restful.createServer`

Here is a code example of using restful as a stand-alone server: <a href="https://github.com/flatiron/restful/blob/master/examples/standalone-server.js">https://github.com/flatiron/restful/blob/master/examples/standalone-server.js</a>

## As a middleware / custom router

To use restful as a HTTP `req` `res` processing middleware you will have to:

  - Define resource(s)
  - Create a new router based on the resource(s) using `restful.createRouter`
  - Use the newly created router inside an existing HTTP server

Here is a code example of using restful in a server: <a href="https://github.com/flatiron/restful/blob/master/examples/server.js">https://github.com/flatiron/restful/blob/master/examples/server.js</a>

## Core HTTP REST Mappings

  By default, `restful` will map the following `Resourceful` methods.

    Verb    Path                    Action                 Notes

    GET     /creature           => Creature.all()
    POST    /creature           => Creature.create()      Create with no-id, id is auto-generated
    POST    /creature/1         => Creature.create()      Create with id "1"
    GET     /creature/1         => Creature.show()
    PUT     /creature/1         => Creature.update()
    DELETE  /creature/1         => Creature.destroy()
    POST    /creature/1/update  => Creature.update()
    POST    /creature/1/destroy => Creature.destroy()

  The `Director` router will dispatch all incoming RESTFul urls to the Creature resource and respond back with the appropriate result.

## Non-strict Mappings

You'll notice that some of the routes defined above are not 100% restful ( such as `POST /creature/1/update` ). 

Since not all HTTP clients support PUT and DELETE Verbs ( such as forms in web browsers ), restful maps additional "non-strict" rest mappings to make your life slightly easier.

If you prefer to not use this option, set `{ strict: true }`.

*You might also want to consider using a rails-like approach which uses the convention of a reserved `<form>` input field called "_method" which contains either "PUT" or "DELETE" see: https://github.com/senchalabs/connect/blob/master/lib/middleware/methodOverride.js*

## Relational Resources

To define relational data in restful you will have to:

 - Define the relationship in the resource itself using the resourceful `Resource.parent()` API
 - Create a new router based on the resource(s)

restful will then properly reflect the relational properties of your resources into the routing layer.

Here is a simple code example of using restful with `Albums` and `Songs`: <a href="https://github.com/flatiron/restful/blob/master/examples/server.js">https://github.com/flatiron/restful/blob/master/examples/server.js</a>


**Protip:** You'll want to browse the restful server using the HTML API explorer in order to see which routes will be created.

## Built-in HTML API Explorer

restful comes with a built-in HTML API explorer. If you wish to view the current routing map for the router as HTML, simply start the restful server and visit `http://localhost:8000/` in your browser. 

If you prefer to not use this option, set `{ explore: false }`.

**Note:** The API explorer is powered by <a href="https://github.com/flatiron/director-explorer">director-explorer</a>, which will work for ANY <a href="https://github.com/flatiron/director">director</a> router.


<a name"remote"></a>
## Exposing Arbitrary Resource Methods

In many cases, you'll want to expose additional methods on a Resource through the router outside of the included CRUD operations: `create`, `all`, `show`, `update`, `destroy`.

restful has built in support for easily exposing arbitrary remote resource methods.

Consider the example of a `Creature`. We've already defined all the restful CRUD routes, but a Creature also needs to eat! 

Simply create a new method on the `Creature` resource called `feed`.

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

    POST    /creature/1/feed    => Creature.feed()
    GET     /creature/1/feed    => Creature.feed()


## Resource Security

There are several ways to provide security and authorization for accessing resource methods exposed with restful. The recommended pattern for authorization is to use resourceful's ability for `before` and `after` hooks. In these hooks, you can add additional business logic to restrict access to the resource's methods. 

It is **not** recommended to place authorization logic in the routing layer, as in an ideal world the router will be a reflected interface of the resource. In theory, the security of the router itself should be somewhat irrelevant since the resource could have multiple reflected interfaces that all required the same business logic.

**TL;DR; For security and authorization, you should use resourceful's `before` and `after` hooks.**


## Router Customization

Restful provides access to a `Director.router` object. This router is created by the heavily used [Director](github.com/flatiron/director) library.

If you need to override a generated route, or create an ad-hoc route, or make any customization, the API is *exactly* the same as the Director API.

**customize a reflected router interface:**

```js
app.router.get('/', function(){
  this.res.end('home page');
});

//
// Overrides `/creature/larry` but won't override,
// any other `/creature/:id` captures.
//
app.router.get('/creature/larry', function(){
  this.res.end('larry is special!');
});

```

Like most of Flatiron's reflection libraries, [restful](http://github.com/flatiron/restful) is built to solve 90% of use-cases. If you hit a case where restful is causing a problem, you can simply drop into `Director`. 

Reflection is *highly* encouraged, but most definitely **optional**.

# Tests

     npm test

# TODO

 - Full `resourceful` property type support ( numeric, boolean, array, object )
 - Full `resourceful` nested property schema support
 - Add ability to specify schemas for remote method argument payloads
 - Implement and document browser support
 - Improve Tests
 - Add better error support via `errs` library
