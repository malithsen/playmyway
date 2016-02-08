'use strict';

var mongoose = require('mongoose');

var MongoCon = function(uri) {
  this.uri = uri;
  this.connected = false;
};

MongoCon.prototype.init = function() {
  mongoose.connect(this.uri);
  var mongocon = this;

  var db = mongoose.connection;

  db.on('error', function(err) {console.log('ERROR: ' + err);});
  db.once('open', function callback() {
    mongocon.connected = true;
    console.log('Successfully connected to DB');

    var songSchema = new mongoose.Schema({
      votes: Number,
      name: String,
      voters: Array,
    });

    mongocon.Song = mongoose.model('colx', songSchema, 'colx');
  });

};

MongoCon.prototype.getSongs = function(cb) {
  this.Song.find({}, {}, {sort: {'votes': -1}}, function(err, res) {
    if (err){
      cb(err);
    } else {
      cb(null, res);
    }
  });
};

MongoCon.prototype.upvote = function(id, cb) {
  this.Song.update({'_id': id}, { $inc: { votes: 1}}, {}, function(err){
    if (err) throw err;
    console.log("Upvoted", id);
    cb();
  });
};

MongoCon.prototype.playcur = function(cb) {
  this.Song.find({}, {'name': true}, {sort: {'votes': -1, 'limit': 1}}, function(err, res) {
    if (err){
      cb(err);
    } else {
      // console.log(res);
      cb(null, res);
    }
  });
}

MongoCon.prototype.saveSong = function(name){

  var newSong = new this.Song({
    votes: 0,
    name: name,
    voters: []
  });
  console.log(name, newSong);
  this.Song.findOneAndUpdate({'name': name}, {}, {upsert: true}, function(err){
    if (err) throw err;
    console.log("New song saved", name);
  })
};
module.exports = MongoCon;

