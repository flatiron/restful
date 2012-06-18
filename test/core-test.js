/*
 * core-test.js: Tests for `restful` core api
 *
 * (C) 2012, Nodejitsu Inc.
 *
 */

var assert = require('assert'),
    vows = require('vows'),
    restful = require('../'),
    helpers = require('./helpers');

vows.describe('restful/core').addBatch({
  'When using `restful`': {
    'creating a new router with one resource': {
      topic: function () {
        var router = restful.createRouter(helpers.Creature);
        this.callback(null, router);
      },
      'should return a routing map': function (err, router) {
        assert.isObject(router.routes);
      },
      'should contain the correct routes': function (err, router) {
        assert.isObject(router.routes.creatures);
      }
    }
  }
}).addBatch({
  'When using `restful`': {
    'creating a new router with multiple resources': {
      topic: function () {
        var router = restful.createRouter([helpers.Creature, helpers.User]);
        this.callback(null, router);
      },
      'should return a routing map': function (err, router) {
        assert.isObject(router.routes);
      },
      'should contain the correct routes': function (err, router) {
        assert.isObject(router.routes.creatures);
        assert.isObject(router.routes.users);
      }
    }
  }
}).export(module);