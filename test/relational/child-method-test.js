var assert = require('assert'),
    APIeasy = require('api-easy'),
    macros = require('../macros'),
    fixtures = require('../fixtures'),
    resourceful = require('resourceful');

var suite = APIeasy.describe('restful/relational/child-method');

// Methods unique to this test
fixtures.Album.albumid = function(_id, opts, callback) {
  callback(null, _id);
};
fixtures.Album.albumid.remote = true;

fixtures.Song.songid = function(_id, opts, callback) {
  callback(null, _id);
};
fixtures.Song.songid.remote = true;


macros.createServer([fixtures.Album]).listen(8003);

suite.use('localhost', 8003)
  .setHeader('Content-Type', 'application/json')
  .followRedirect(false)
  .next()
  
  .post('/album', {id: 'jingles', title: 'Mad Case of the Jingles'})
    .expect(201)
    .next()
  
  .get('/album/jingles')
    .expect(200)
    .expect("should return correct information", function(err, req, data) {
      var data = JSON.parse(data).album;
      assert.equal(data.id, 'jingles');
    })
    .next()

  .get('/album/jingles/albumid')
    .expect(200)
    .expect("whatnot", function(err, req, data) {
      assert.notEqual(typeof data, 'undefined');
      var data = JSON.parse(data).result;
      assert.equal(data, "jingles");
    })
    .next()

  .get('/album/jingles/songid')
    .expect(404)
    .next()

  .post('/album/jingles/song/1', {title: 'Mad Jingle Disease', bpm: 170})
    .expect(201)
    .next()

  .get('/album/jingles/song/1')
    .expect(200)
    .expect("should return the song", function(err, req, data) {
      data = JSON.parse(data).song;
      assert.equal(data.id, 'album/jingles/1');
      assert.equal(data.bpm, 170);
    })
    .next()

  .get('/album/jingles/song/1/albumid')
    .expect(404)
    .next()

  .get('/album/jingles/song/1/songid')
    .expect(200)
    .expect("should return the song id", function(err, req, data) {
      data = JSON.parse(data).result;
      assert.equal(data, "album/jingles/1");
    })

.export(module);