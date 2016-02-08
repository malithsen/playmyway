'use strict';

var express = require('express'),
    lessMiddleware = require('less-middleware'),
    config = require('./config'),
    MongoCon = require('./MongoCon'),
    cache = require('memory-cache'),
    _ = require('lodash'),
    async = require('async'),
    lame = require('lame'),
    fs = require('fs'),
    Speaker = require('speaker'),
    volume = require("pcm-volume");

var audioOptions = {
    channels: 2,
    bitDepth: 16,
    sampleRate: 44100,
    mode: lame.STEREO
};

var PATH = '/media/stuff/songs';

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var app = express();

app.set('views', __dirname + '/src/views');
app.set('view engine', 'jade');
app.locals.pretty = true;


app.use(express.static(__dirname + '/public'));

var mongocon = new MongoCon(config.mongo.uri);
mongocon.init();

function playStream(input, options) {
  var decoder = lame.Decoder();
  options = options || {};
  var v = new volume();
  if (options.volume) {
    v.setVolume(options.volume);
  }
  var speaker = new Speaker(audioOptions);
  speaker.on('finish', function() {
    if (options.loop) {
      console.log('loop');
        // i want to restart here
      start();
    }
  });
  function start() {
    //input.pos = 0;
    console.dir(input);
    v.pipe(speaker);
    decoder.pipe(v);
    input.pipe(decoder);
  }
  start();
}

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
  console.log("play");

  var cb = function(err, song) {
    console.log(song[0].name);
    var inputStream = fs.createReadStream(PATH + song[0].name);

    console.log(inputStream);
    playStream(inputStream, {
        volume: 0.5,
        loop: true
    });
  };

  mongocon.playcur(cb);

});

app.get('/reload', function(req, res) {
  console.log("Reload");
  fs.readdir(PATH, function(err, items) {
    // console.log(items);
    res.json(items);
 
    for (var i=0; i<items.length; i++) {
        console.log(items[i]);
        mongocon.saveSong(items[i], function(){console.log("callback fn");});
    }
  });
});

app.get('/save', function(req, res){
  console.log("save song");
  mongocon.saveSong('test.mp3', function(){console.log("callback fn");});
});

app.get('/views/:v', function(req, res) {
  res.render(req.params.v);
});

app.get('*', function(req, res) {
  console.log("calling layout");
  res.render('layout', {
    title: 'Quaker',
    env: process.env.NODE_ENV
  });
});

var port = process.env.PORT || 8080;
app.listen(port, function() {
  console.log("Listening on port " + port);
});

