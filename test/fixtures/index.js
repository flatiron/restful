var fixtures = exports,
assert = require('assert');

var restful = require('../../lib/restful');
var resourceful = require('resourceful');
var http = require('http');

//
// Create a new Creature resource using the Resourceful library
//
fixtures.Creature = resourceful.define('creature', function () {

  var self = this;

  this.restful = true;
  //
  // Specify a storage engine
  //
  this.use('memory');
  //this.use('couchdb', {database: "test3" })

  //
  // Specify some properties with validation
  //
  this.string('type');
  this.string('description');

  //
  // Specify timestamp properties
  //
  this.timestamps();
  this.number('life');

  this.feed = function (_id, options, callback) {
    self.get(_id, function(err, creature){
      if(err) {
        return callback(err);
      }
      var life = creature.life + 1;
      self.update(_id, { life: life }, function(err, result){
        callback(null, 'I have been fed my life is: ' + result.life);
      });
    });
  }
  this.feed.remote = true;

  this.hit = function (_id, options, callback) {
    self.get(_id, function(err, creature){
      if(err) {
        return callback(err);
      }
      var life = creature.life - 1;
      self.update(_id, { life: life }, function(err, result){
        callback(null, 'I have been hit my life is: ' + result.life);
      });
    });
  }
  this.hit.remote = true;


  this._die = function (food) {
    //
    // Remark: We'll consider the _die function "private",
    // in the sense that restful will not expose it
    //
    console.log('creature died.');
  }
  //
  // _die is not set to remote, so it won't be exposed
  //
});

//
// Create a new Creature resource using the Resourceful library
//
fixtures.User = resourceful.define('user', function () {
  //
  // Specify a storage engine
  //
  this.use('memory');
  this.string('name');

  //
  // Specify some properties with validation
  //
  this.string('email', { format: 'email', required: true })

  //
  // Specify a Number type
  //
  this.number('age', { message: 'is not a valid age' });

  //
  // Specify timestamp properties
  //
  this.timestamps();
});

fixtures.Album = resourceful.define('album', function () {
  //this.use('couchdb', {database: "test3" })
  this.restful = true;

  this.use('memory');
  this.string('title');
});

fixtures.Song = resourceful.define('song', function () {
  this.restful = true;

  //this.use('couchdb', {database: "test3" })
  this.use('memory');
  this.number('bpm');
  this.string('description');
  this.string('title');
  this.bool('playing', { default: false });
});

fixtures.Song.play = function () {
  this.playing = true;
};
fixtures.Song.play.remote = true;

fixtures.Song.pause = function () {
  this.playing = false;
};
fixtures.Song.pause.remote = true;

fixtures.Song._encode = function () {
  //
  // Consider this a "private" method,
  // in that it won't be exposed through restful
  //
};



fixtures.Song.parent('album');
