/*
 * one-many-test.js: Tests for one-many relational `restful` routes 
 *
 * (C) 2012, Nodejitsu Inc.
 *
 */

var vows = require('vows'),
    assert = require('assert'),
    APIeasy = require('api-easy'),
    fixtures = require('../fixtures'),
    macros = require('../macros');

var suite = APIeasy.describe('restful/relational/one-many');

macros.createServer(fixtures.Album, { strict: false }).listen(8003);

suite.use('localhost', 8003)
  .setHeader('Content-Type', 'application/json')
  .followRedirect(false)
    .get('/albums')
      .expect(200)
  .next()
    .get('/songs')
      .expect(404)
  .next()
    .post('/albums/ill-communication')
      .expect(201)
  .next()
    .post('/songs/random-no-album-track')
      .expect(404)
  .next()
    .post('/songs', { id: 'random-no-album-track'})
      .expect(404)
  .next()
    .post('albums/ill-communication/songs/get-it-together')
      .expect(201)
  .next()
    .post('/songs', { id: "sure-shot" })
      .expect(404)
  .next()
    .post('/albums/ill-communication/songs', { id: "sure-shot" })
      .expect(201)
      .expect('should return correct song', function (err, res, body) {
         var result = JSON.parse(body);
         assert.isObject(result.song);
         //
         // TODO: Shouldn't this be song.key, 'sure-shot' ??
         //
         assert.equal(result.song.id, 'album/ill-communication/sure-shot');
      })
  .next()
    .get('/albums/ill-communication/songs/sure-shot')
      .expect(200)
  .next()
    .get('/albums/ill-communication')
      .expect(200)
      .expect('should return correct album with new songs', function (err, res, body) {
         var result = JSON.parse(body);
         assert.isArray(result.album.song_ids);
         assert.equal(result.album.song_ids.length, 2);
      })
  .next()
    .get('/albums/ill-communication/songs/get-it-together')
      .expect(200)
      .expect('should return correct song', function (err, res, body) {
         var result = JSON.parse(body);
         assert.isObject(result.song)
         assert.equal(result.song.album_id, 'ill-communication');
      })
  .next()
    .get('/albums/ill-communication')
      .expect(200)
      .expect('should return correct album', function (err, res, body) {
         var result = JSON.parse(body);
         assert.isObject(result.album)
         assert.equal(result.album.resource, 'Album');
      })
  .next()
    .post('/albums/ill-communication/songs/root-down')
      .expect(201)
      .expect('should return correct song', function (err, res, body) {
         var result = JSON.parse(body);
         assert.isObject(result.song)
         assert.equal(result.song.resource, 'Song');
      })
  .next()
    .get('/albums/ill-communication/songs/root-down')
      .expect(200)
  .next()
    .post('/albums/ill-communication/songs/sabotage')
      .expect(201)
  .next()
    .get('/albums/ill-communication/songs/sabotage')
      .expect(200)
      .expect('should return correct song', function (err, res, body) {
        var result = JSON.parse(body)
        assert.equal(result.song.resource, 'Song');
        assert.equal(result.song.album_id, 'ill-communication');
      })
  .next()
    .get('/albums/ill-communication')
      .expect(200)
      .expect('should return correct songs', function (err, res, body) {
         var result = JSON.parse(body);
         assert.isObject(result.album)
         assert.isArray(result.album.song_ids)
         assert.equal(result.album.song_ids.length, 4);
         assert.equal(result.album.song_ids[0], 'get-it-together');
         assert.equal(result.album.song_ids[1], 'sure-shot');
         assert.equal(result.album.song_ids[2], 'root-down');
         assert.equal(result.album.song_ids[3], 'sabotage')

      })
  .next()
    .put('/albums/ill-communication/songs/sabotage', { "description": "uses real instruments played by beastie boys"})
      .expect(204)
      .expect('should not error', function (err, res, body) {
        assert.isNull(err);
      })
  .next()
    .get('/albums/ill-communication/songs/sabotage')
    .expect(200)
    .expect('should return correct description', function (err, res, body) {
       var result = JSON.parse(body);
       assert.isObject(result.song)
       assert.equal(result.song.resource, 'Song');
       assert.equal(result.song.description, "uses real instruments played by beastie boys")
    })
  .next()
    .del('/albums/ill-communication/songs/sabotage')
    .expect(204)
  .next()
    .get('/albums/ill-communication/songs/sabotage')
    .expect(404)
.export(module);