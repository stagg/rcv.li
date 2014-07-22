var express = require('express'),
  bodyParser = require('body-parser'),
  mongoose = require('mongoose'),
  Promise = require("promise"),
  app = express(),
  favicon = require('serve-favicon'),
  path = require('path'),
  config = require('./config');

// Setup
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(bodyParser.json());
app.use('/public', express.static(__dirname + '/public'));
app.use(favicon(path.join(__dirname,'public','img','favicon.ico')));

mongoose.connect('mongodb://localhost/receiverlink');

var Share = mongoose.model('Share', {
  pod: String,
  ep: String,
  pos: String,
  src: String,
  video: Boolean,
  color: String,
  image: String,
  feed: String,
  urlHash: String,
  guid: String
});


var linkHash = function() {
  var rhash = function (num) {
    var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJLKMNOPQRSTUVWXYZ1234567890-_.~";
    var hash = '';
    for (var i = num; i > 0; i--) {
      hash = hash.concat(chars[Math.round(Math.random() * 65)]);
    }
    return hash;
  };
  var findHash = function () {
    return new Promise(function (resolve, reject) {
      var hash = rhash(config.hashlen);
      console.log("New hash: "+hash);
      Share.find({urlHash: hash}, function (err, share) {
        if (err) {
          console.log(err);
          resolve(hash);
        } else if (share === undefined || share.length === 0) {
          console.log(share);
          resolve(hash);
        } else {
          reject("Hash already used: "+hash);
        }
      });
    });
  };

  return new Promise(function (resolve) {
    var find = function() {
      findHash().then(function(result){
          resolve(result);
        },
        function(error) {
          console.log(error);
          find();
        });
    };
    setTimeout(find, 1);
  });
};




// /share?p=[podcast]&e=[episode]&t=[0h00m00s]&v=[video]&c=[color]&i=[image]&s=[feedurl]&f=[file]&g=[GUID]
// DEMO:
//curl --data '{"p":"This American Life","e":"527: 180 Degrees","v":"false",
//"t":"0h04m00s","f":"http://feeds.thisamericanlife.org/~r/talpodcast/~5/NoHdV_K8jdY/527.mp3",
//"c":"e2422c","i":"http://mediad.publicbroadcasting.net/p/kmuw/files/201307/this-american-life.jpg", "g":"GUIDSTRINGHERE"}'
//-H "Content-Type: application/json" http://localhost:3000/share

app.get('/share', function(req, res) {
  var q = req.query;
  res.render('index', {
    pod: q.p,
    ep: q.e,
    pos: q.t,
    src: q.f,
    video: q.v === 'true',
    color: q.c ? q.c : "#ffa700",
    feed: q.s,
    image: q.i ? q.i : "/public/img/hat_dark.png",
    guid: q.g
  });
});

app.post('/share', function(req, res) {
  var q = req.body;
  linkHash().then(function(result){
    var share = new Share({
      pod: q.p,
      ep: q.e,
      pos: q.t,
      src: q.f,
      video: q.v === 'true',
      color: q.c ? q.c : "#ffa700",
      image: q.i ? q.i : "/public/img/hat_dark.png",
      feed: q.s,
      guid: q.g,
      urlHash: result
    });
    share.save(function (err, save) {
      if (err) {console.error(err); res.send(503);}
      console.log(save);
      res.json({url: config.host+'/p/'+save.urlHash});
    });
  });
});

app.get('/p/:id', function(req, res) {
  if (req.params.id) {
    var q = req.query;
    Share.findOne({urlHash: req.params.id}, function (err, share) {
      console.log(share);
      if (err) {console.error(err); res.send(503);}
      if (share === undefined || share === null || share.length === 0) {
        res.send(404)
      } else {
        // Remove leaky data.
        delete share.__v;
        delete share._id;
        // Format specifi return.
        if (q.format === 'json') {
          res.json(share);
        } else {
          res.render('index', share);
        }
      }
    });
  } else {
    res.send(404);
  }
});
app.get('/', function (req, res) {
  res.redirect('https://play.google.com/store/apps/details?id=ca.joshstagg.receiver');
});

app.listen(config.port);
console.log("Server is running on: "+config.url);

