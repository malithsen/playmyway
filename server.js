'use strict';

var express = require('express'),
    config = require('./config'),
    MongoCon = require('./MongoCon'),
     _ = require('lodash'),
    async = require('async'),
    Player = require('player'),
    fs = require('fs'),
    path = require('path'),
    http = require('http'),
    Socket = require('socket.io');


var PATH = ''; // When comitting keep this empty.
var player, currSong;
var playing = false;

player = new Player([]);

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var app = express();

http = http.Server(app);

var io = Socket(http);

io.on('connection', function(socket){
  console.log("New connection...");

  socket.on('voteup', function(msg){
    console.log("Voted up!");
    io.emit('refreshList');
  });

});

app.set('views', __dirname + '/src/views');
app.set('view engine', 'jade');
app.locals.pretty = true;


app.use(express.static(__dirname + '/public'));

var mongocon = new MongoCon(config.mongo.uri);
mongocon.init();

var updatePlayList = function(){

  mongocon.playcur(function(err, res){
    var path = res.path;

    player = new Player(path)
              .on('playing', function(song){
              playing = true;
              console.log(song);
              io.emit('songChanged', song._name);
              mongocon.resetVotes(song.src);
              currSong = song;
              })
             .on('error', function(err){
               playing = false;
               console.log("Pfft!");
               console.log(err);
               updatePlayList();
              })
             .play();
  });
}

app.get('/api/playing', function(req, res) {
  return res.json({ playerState: playing});
});

app.get('/songs', function(req, res) {
  var cb = function(err, data) {
    if (err) {
      res.end(err);
    } else {
      res.json(data);
    }
  };
  mongocon.getSongs(cb);
});

app.get('/upvote/:id', function(req, res) {
  var songId = req.params.id;
  mongocon.upvote(songId, function(){res.json({'success':'upvoted '+ songId});});

});

app.get('/play', function(req, res) {
  console.log("playing");

  //stop an already plaing item
  if(typeof player != "undefined")
  {
    player.stop();
  }

  updatePlayList();

  res.redirect('/');
});

app.get('/next', function(req, res){
  console.log('Switching to the next song...');

  if(typeof player === "undefined")
  {
    res.send("No player instance detected!");
    return;
  }

  player.stop();
  player.next();

  res.redirect('/');

});

app.get('/stop', function(req, res){
  console.log('Stopping current song...')
  player.stop();
  playing = false;

  currSong = '';
  res.redirect('/');

});

app.get('/pause', function(req, res){
  player.pause();
  playing = !playing;
  res.redirect('/');
});

app.get('/reload', function(req, res) {
  console.log("Reload");
  fs.readdir(PATH, function(err, items) {
    res.json(items);

    for (var i=0; i<items.length; i++) {
      if (path.extname(items[i]) === '.mp3') {
        console.log(items[i]);
        var songpath = PATH+items[i];
        mongocon.saveSong(songpath, items[i], function(){console.log("callback fn");});
      };
    }
  });
});

app.get('/save', function(req, res){
  console.log("save song");
  mongocon.saveSong('test.mp3');
});

app.get('/views/:v', function(req, res) {
  res.render(req.params.v);
});

app.get('/', function(req, res) {
  console.log("calling layout");
  res.render('layout', {
    title: 'PlayMyWay',
    env: process.env.NODE_ENV
  });

});

var port = process.env.PORT || 8080;

http.listen(port, function(){
  console.log("Listening on port " + port);
});