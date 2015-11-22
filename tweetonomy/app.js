var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var fs = require('fs');
//MongoDB Connection
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var ObjectId = require('mongodb').ObjectID;
var url = 'mongodb://172.25.139.52:27017/local';
var topUsers,timeCount,sentiments,heatmap,popularWords;
//server creation
var http=require('http');

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

MongoClient.connect(url, function(err, db) {
  assert.equal(null, err);

  aggregateTimein24hours(db, function() {
    db.close();
  });
});
//var yesterday = new Date((new Date).setDate(new Date().getDate() - 1));

var aggregateTimein24hours = function(db, callback) {

    db.collection('users').aggregate(
        [
          { "$project": {

            "h":{"$hour":"$creation time"}
            }
          },
          { "$group":{
            "_id":  "$h",
            "count":{ "$sum": 1}
          }
          }
        ]
    ).toArray(function (err, result) {
      assert.equal(err, null);
      var count = result.length;
    // console.log(result[0]);
      var jsn = JSON.stringify(result);
      //console.log(jsn);
      timeCount = JSON.parse(jsn);
     // var jsn2 = (jsn1['count']);


      // console.log(count);
     // var jsonob = JSON.stringify(result[0]);
      // console.log(jsonob);

      // fs.writeFileSync("./dataobj.json",jsonob);
      //var json1 = JSON.parse(jsonob)
      //var json2 = json1['count'];
     // console.log(json2);

      callback(result);
    });

};

MongoClient.connect(url, function(err, db) {
  assert.equal(null, err);

  top10Users(db, function() {
    db.close();
  });
});
var top10Users = function(db, callback) {

  db.collection('users').aggregate(
      [
        { $match   : { "search term" : "#Samsung"} },
        { $group   : { "_id": "$search term"  ,

          "top users" : { $push  : { "username" : "$publishing user.username",
            "factor" :  { $add : [ "$retweet count" , "$favourite count" ] }
          }
          }
        }
        },
        { $unwind: "$top users" },
        { $sort: { 'top users.factor' : -1 } },
        { $group : { "_id" : "$_id",
          "top users" : { $push : { "username" : "$top users.username",
            "factor" :  "$top users.factor"
          }
          }

        }
        }
      ]
  ).toArray(function (err, result) {
    assert.equal(err, null);
    var count = result.length;
    var jsonob = JSON.stringify(result[0]);

    var jsonob1 = JSON.parse(jsonob);
    //console.log(jsonob1);
    topUsers = (jsonob1['top users']);
  //  console.log(jsonob1);
    //console.log(JSON.parse(jsonob1));

  // console.log(json2);
    // console.log(count);
    // var jsonob = JSON.stringify(result[0]);
    // console.log(jsonob);

    // fs.writeFileSync("./dataobj.json",json2);
  //  console.log(json2.length);
    //var json1 = JSON.parse(jsonob)
    //var json2 = json1['count'];
    // console.log(json2);

    callback(result);
  });

};

MongoClient.connect(url, function(err, db) {
  assert.equal(null, err);

  popularWords(db, function() {
    db.close();
  });
});
var popularWords = function(db, callback) {

  db.collection('users').aggregate(
      [
        { $match   : { "search term" : "#Apple"} },
        { $project : { "count" : {$literal: 1} , "popular words" : "$popular words", "search term" : "$search term", "_id" : 0 } },
        { $unwind : "$popular words" },
        { $group : {  "_id" : "$search term",
          "word cloud" : { $push : {
            "word"  : "$popular words",
            "count" : "$count"
          }
          }
        }
        }
      ]
  ).toArray(function (err, result) {
    assert.equal(err, null);
    var count = result.length;
    var jsonob = JSON.stringify(result[0]);

    var jsonob1 = JSON.parse(jsonob);
    //console.log(jsonob1);
    popularWords =
    (jsonob1['word cloud']);

    //  console.log(jsonob1);
    //console.log(JSON.parse(jsonob1));

    // console.log(json2);
    // console.log(count);
    // var jsonob = JSON.stringify(result[0]);
    // console.log(jsonob);

    // fs.writeFileSync("./dataobj.json",json2);
    //  console.log(json2.length);
    //var json1 = JSON.parse(jsonob)
    //var json2 = json1['count'];
    // console.log(json2);

    callback(result);
  });

};
MongoClient.connect(url, function(err, db) {
  assert.equal(null, err);
  findRestaurants(db, function() {
    db.close();
  });
});
var findRestaurants = function(db, callback) {
  var cursor =db.collection('users').find( );
  cursor.each(function(err, doc) {
    assert.equal(err, null);
    if (doc != null) {
      console.dir(doc);
    } else {
      callback();
    }
  });
};
app.get('/', function(req, res1) {
try {
  res1.json(topUsers);
  res1.send(200);
}
  catch(exception){
    response(404);
  }
});
app.get('/', function(req, res2) {

  try {
    res2.json(timeCount);
    res2.send(200);
  }
  catch(exception){
    response(404);
  }

});
app.get('/', function(req, res3) {

  try {
    res3.json(popularWords);
    res3.send(200);
  }
  catch(exception){
    response(404);
  }

});
app.listen(process.env.PORT || 3000);
module.exports = app;
