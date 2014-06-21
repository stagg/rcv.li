var express = require('express');
var bodyParser = require('body-parser')
var short = require('short');
var mongoose = require('mongoose');
var app = express();

// Setup
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(bodyParser.json());
app.use('/public', express.static(__dirname + '/public'));

mongoose.connect('mongodb://localhost/receiverlink');

var Share = mongoose.model('Share', {
  pod: String,
  ep: String,
  pos: String,
  src: String,
  video: Boolean,
  color: String,
  image: String
});


// /share?p=[podcast]&e=[episode]&t=[0h00m00s]&v=[video]&c=[color]&i=[image]&f=[file]
// DEMO:
// curl --data '{"p":"This American Life","e":"527: 180 Degrees","v":"false",
// "t":"0h04m00s","f":"http://feeds.thisamericanlife.org/~r/talpodcast/~5/NoHdV_K8jdY/527.mp3",
// "c":"e2422c","i":"http://mediad.publicbroadcasting.net/p/kmuw/files/201307/this-american-life.jpg"}'
// -H "Content-Type: application/json" http://localhost:3000/share

app.get('/share', function(req, res) {
  var q = req.query;
  res.render('index', {
    pod: q.p,
    ep: q.e,
    pos: q.t,
    src: q.f,
    video: q.v === 'true',
    color: q.c ? q.c : "#ffa700",
    image: q.i ? q.i : "/public/img/hat_dark.png"
  });
});

app.post('/share', function(req, res) {
  var q = req.body;
  var share = new Share({
    pod: q.p,
    ep: q.e,
    pos: q.t,
    src: q.f,
    video: q.v === 'true',
    color: q.c ? q.c : "#ffa700",
    image: q.i ? q.i : "/public/img/hat_dark.png"
  });
  share.save(function (err, save) {
    if (err) // ...
      console.log(save);
    res.json({url: save.url});
  });
});

app.get('/:id', function(req, res) {
  if (req.params.id) {
    Share.findById(req.params.id, function (err, share) {
      if (err) return console.error(err);
      res.render('index', share);
    });
  } else {
    res.redirect('https://play.google.com/store/apps/details?id=ca.joshstagg.receiver');
  }
});

app.listen(3000);
console.log("Server is running.");

