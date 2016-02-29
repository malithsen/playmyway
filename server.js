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
    Socket = require('socket.io'),
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy;

passport.use(new LocalStrategy(
  function(username, password, done) {
    console.log(username, password)
    if (username === "admin" && password === "admin")
      return done(null, {name: "admin"});

    return done(null, false);
  }
));

// Serialized and deserialized methods when got from session
passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(user, cb) {
  cb(null, user);
});

var auth = function(req, res, next){
  if (!req.isAuthenticated())
    res.sendStatus(401);
  else
    next();
};

var PATH = ''; // When comitting keep this empty.
var player, currSong;
var playing = false;

player = new Player([]);

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var app = express();

var http = http.Server(app);

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
app.use(require('morgan')('combined'));
app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('express-session')({ secret: 'keyboard cat', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());


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
                io.emit('songChanged', song);
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

app.get('/play', auth, function(req, res) {
  console.log("playing");

  //stop an already plaing item
  if(typeof player != "undefined")
  {
    player.stop();
  }

  updatePlayList();

  res.redirect('/');
});

app.get('/next', auth, function(req, res){
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

app.get('/stop', auth, function(req, res){
  console.log('Stopping current song...')
  player.stop();
  playing = false;

  currSong = '';
  res.redirect('/');

});

app.get('/pause', auth, function(req, res){
  player.pause();
  playing = !playing;
  res.redirect('/');
});

app.get('/reload', auth, function(req, res) {
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

app.get('/save', auth, function(req, res){
  console.log("save song");
  mongocon.saveSong('test.mp3');
});

// route to test if the user is logged in or not
app.get('/loggedin', function(req, res) {
  res.send(req.isAuthenticated() ? req.user : '0');
});

// route to log in
app.post('/login', passport.authenticate('local'), function(req, res) {
  console.log(req);
  res.send(req.user);
});

// route to log out
app.post('/logout', function(req, res){
  req.logOut();
  res.send(200);
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