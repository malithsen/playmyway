'use strict';

var express = require('express'),    
    config = require('./config'),
    MongoCon = require('./MongoCon'),
     _ = require('lodash'),
    async = require('async'),
    Player = require('player'),
    // lame = require('lame'),
    fs = require('fs');
    // Speaker = require('speaker'),
    // volume = require("pcm-volume");

// var audioOptions = {
//     channels: 2,
//     bitDepth: 16,
//     sampleRate: 44100,
//     mode: lame.STEREO
// };

var PATH = '/home/hasa93/Songs/';
var player;

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var app = express();

app.set('views', __dirname + '/src/views');
app.set('view engine', 'jade');
app.locals.pretty = true;


app.use(express.static(__dirname + '/public'));

var mongocon = new MongoCon(config.mongo.uri);
mongocon.init();


// function playStream(input, options) {
//   var decoder = lame.Decoder();
//   options = options || {};
//   var v = new volume();
//   if (options.volume) {
//     v.setVolume(options.volume);
//   }
//   var speaker = new Speaker(audioOptions);
//   speaker.on('finish', function() {
//     if (options.loop) {
//       console.log('loop');
//       start();
//     }
//   });
//   function start() {
//     console.dir(input);
//     v.pipe(speaker);
//     decoder.pipe(v);
//     input.pipe(decoder);
//   }
//   start();
// }

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

  mongocon.getSongs(function(err, songs){
      if(err) console.log(err);
    
      var paths = []

      for(var i = 0; i < songs.length; i++){
        paths.push(songs[i].name)
      }
      
      console.log(paths);

      player = new Player(paths)
               .on('playing', function(song){
                 console.log('Playing ' + song._name);                                 
                })
               .on('playend', function(song){
                 console.log('Finished playlist!')
                })
               .on('error', function(err){
                 console.log(err);
                })
               .play();    
  });
  
}); 

app.get('/next', function(req, res){
  console.log('Switching to the next song...');

  if(typeof player === "undefined") 
  {
    res.send("No player instance detected!");
    return;
  }

  player.next();
});

app.get('/reload', function(req, res) {
  console.log("Reload");
  fs.readdir(PATH, function(err, items) {
    res.json(items);
 
    for (var i=0; i<items.length; i++) {
        console.log(items[i]);        
        mongocon.saveSong(PATH + items[i], function(){console.log("callback fn");});
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

