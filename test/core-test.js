/*
 * core-test.js: Tests for `restful` core api
 *
 * (C) 2012, Nodejitsu Inc.
 *
 */

var assert = require('assert'),
    vows = require('vows'),
    restful = require('../'),
    fixtures = require('./fixtures');

vows.describe('restful/core').addBatch({
  'When using `restful`': {
    'creating a new router with one resource': {
      topic: function () {
        var router = restful.createRouter(fixtures.Creature);
        this.callback(null, router);
      },
      'should return a routing map': function (err, router) {
        assert.isObject(router.routes);
      },
      'should contain the correct routes': function (err, router) {
        assert.isObject(router.routes.creature);
      }
    }
  }
}).addBatch({
  'When using `restful`': {
    'creating a new router with multiple resources': {
      topic: function () {
        var router = restful.createRouter([fixtures.Creature, fixtures.User]);
        this.callback(null, router);
      },
      'should return a routing map': function (err, router) {
        assert.isObject(router.routes);
      },
      'should contain the correct routes': function (err, router) {
        assert.isObject(router.routes.creature);
        assert.isObject(router.routes.user);
      }
    }
  }
}).export(module);