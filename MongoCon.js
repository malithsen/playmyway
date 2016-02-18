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
      votes: { type: Number, default: 0},
      name: String,
      path: String,
      voters: Array,
      lastPlayed: { type: Number, default: 0 }
    });

    mongocon.Song = mongoose.model('colx', songSchema, 'colx');
  });

};

MongoCon.prototype.getSongs = function(cb) {
  this.Song.find({}, {"name" : true, "lastPlayed" : true, "votes" : true}, {sort : {"votes" : -1, "lastPlayed" : 1}},function(err, res) {
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

// MongoCon.prototype.playcur = function(cb) {

//   this.Song.find({}, {'name': true}, {sort: {'votes': -1, 'lastPlayed': -1}}, function(err, res) {
//     if (err){
//       cb(err);
//     } else {
//       // console.log(res);
//       cb(null, res);
//     }
//   });
// }

MongoCon.prototype.playcur = function(cb) {

  this.Song.findOneAndUpdate({}, {'lastPlayed': Date.now()}, {sort: {'votes': -1, 'lastPlayed' : 1}}, function(err, res) {
    if (err){
      cb(err);
    } else {
      console.log(res);
      cb(null, res);
    }
  });
}

MongoCon.prototype.saveSong = function(path, name){

  this.Song.findOneAndUpdate({'name': name, 'path': path, 'votes': 0, 'lastPlayed': 0}, {}, {upsert: true}, function(err){
    if (err) throw err;
    console.log("New song saved", name);
  })
};

MongoCon.prototype.resetVotes = function(name){
  this.Song.update({'name' : name}, {$set: {'votes': 0}}, function(err,res){
    if (err) throw err;
    console.log("Vote reset");
  });
}

module.exports = MongoCon;

