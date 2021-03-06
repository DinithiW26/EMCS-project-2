/**
 * Module dependencies.
 */
var express = require('express'),
api = require('./routes/api');
var methodOverride = require('method-override')
var bodyParser = require('body-parser')
var app = express();
var http = require('http').Server(app);
var router = express.Router();  
var mqtt = require('mqtt');
var path = require('path');
var sys = require('util');
var net = require('net');
var mongoose = require('mongoose');
var date;
var schedule = require('node-schedule');

var t_p,h_p,s_p,l_p;
var t = '';
var h = '';
var s = '';
var l = '';
var count = 0;

var hum_ = [];


mongoose.Promise = global.Promise;

    var uristring = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/greenhouse';

      mongoose.connect(uristring, function (err, res) {
      if (err) { 
        console.log ('ERROR connecting to: ' + uristring + '. ' + err);
      } else {
        console.log ('Succeeded connected to: ' + uristring);
      }
    });
    // This is the schema.  Note the types, validation and trim 
    // statements.  They enforce useful constraints on the data.
    var userSchema = new mongoose.Schema({

      date : { type: String},
      rule_name : { type: String},
      actuator_type: { type: String},
      from: { type: String},
      to: { type: String}

    });
    var mqtt_status = new mongoose.Schema({

      time : { type: String},
      mqtt_topic : { type: String},
      status: { type: String}

    });
    var t_data = new mongoose.Schema({

      time : { type: String},
      val: { type: String}

    });
    var h_data = new mongoose.Schema({

      time : { type: String},
      val: { type: String}

    });
    var s_data = new mongoose.Schema({

      time : { type: String},
      val: { type: String}

    });
    var l_data = new mongoose.Schema({

      time : { type: String},
      val: { type: String}

    });



    // Compiles the schema into a model, opening (or creating, if
    // nonexistent) the 'PowerUsers' collection in the MongoDB database
    var PUser = mongoose.model('data_store', userSchema);
    var PUser2 = mongoose.model('mqtt_store', mqtt_status);
    var PUser3 = mongoose.model('temp_data', t_data);
    var PUser4 = mongoose.model('hum_data', h_data);
    var PUser5 = mongoose.model('soil_data', s_data);
    var PUser6  = mongoose.model('light_data', l_data);



// // create a socket object that listens on port 5000
var io = require('socket.io')(http);
 
// create an mqtt client object and connect to the mqtt broker
var client = mqtt.connect('mqtt://localhost');
 
     http.listen((process.env.PORT || 80), function(){
      // console.log(process.env.PORT);
      console.log('----------------------------------------------------------------------------');
      console.log('----------------------------------------------------------------------------');
      console.log('----------------------------------------------------------------------------');
      console.log('--------------------IOT Greenhouse Server Started---------------------------');
      console.log('----------------------------------------------------------------------------');
      console.log('----------------------------------------------------------------------------');
      console.log('----------------------------------------------------------------------------');
});
    




router.use("/public",function(req,res){

      res.sendFile(path + "index.html");

});

app.use("/public",router);

app.use(express.static(__dirname + '/public'));

    /*Create http server*/
app.get('/public', function(req, res){

    res.sendFile(__dirname + '/index.html');

});
// app.get('/sensor/:temp/:hmdt/:soil/:light', function(req, res) {
//      var t = req.params.temp;
//      var h = req.params.hmdt;
//      var s = req.params.soil;
//      var l = req.params.light;
//      // location = res.headers.location;
//      res.send("ok");
//      console.log(t);
//      console.log(h);
//      console.log(s);
//      console.log(l);
     
//      var anewrow = new PUser3 ({
//             time: date,
//             val: t
//      });
//      var bnewrow = new PUser4 ({
//             time: date,
//             val: h
//      });
//      var cnewrow = new PUser5 ({
//             time: date,
//             val: s
//      });
//      var dnewrow = new PUser6 ({
//             time: date,
//             val: l
//      });

//         anewrow.save(function (err) {if (err) console.log ('Error on save!')});
//         bnewrow.save(function (err) {if (err) console.log ('Error on save!')});     
//         cnewrow.save(function (err) {if (err) console.log ('Error on save!')});
//         dnewrow.save(function (err) {if (err) console.log ('Error on save!')});

//   });


// Configuration  

// ## CORS middleware
// 
// see: http://stackoverflow.com/questions/7067966/how-to-allow-cors-in-express-nodejs
var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      
    // intercept OPTIONS method
    //console.log(req.method);
    if ('OPTIONS' == req.method) {
      res.send(200);
    }
    else {
      next();
    }
};

app.use(methodOverride('X-HTTP-Method-Override'))
app.use(allowCrossDomain)
// parse various different custom JSON types as JSON
app.use(bodyParser.json({ type: 'application/*+json' }))

// parse some custom thing into a Buffer
app.use(bodyParser.raw({ type: 'application/vnd.custom-type' }))

// parse an HTML body into a string
app.use(bodyParser.text({ type: 'text/html' }))

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});

// JSON API
app.get('/switches', api.switches);
app.get('/switches/:id', api.switch);
app.post('/switches', api.addSwitch);
app.put('/switches/:id', api.editSwitch);
app.put('/switches', api.editAllSwitches);
app.delete('/switches/:id', api.deleteSwitch);




io.sockets.on('connection', function (socket) {
    // socket connection indicates what mqtt topic to subscribe to in data.topic
    // socket.on('subscribe', function (data) {
    //     console.log('Subscribing to '+data.topic);
    //     socket.join(data.topic);
    //     // client.subscribe(data.topic);
    // });
    // when socket connection publishes a message, forward that message
    // the the mqtt broker
    socket.on('publish', function (data) {
        console.log('Publishing to '+data.topic+' Status ' +data.payload);
        client.publish(data.topic,data.payload);

         var newrow1 = new PUser2 ({
            mqtt_topic: data.topic,
            status: data.payload,
         
        });
        newrow1.save(function (err) {if (err) console.log ('Error on save!')});
        // io.emit('mqtt',{'topic':String(data.topic),'payload':String(data.payload)});
    
        // PUser2.update({'mqtt_topic':'fan'},{$set:{'status':'1'}},{multi:true})
        // PUser2.update({ mqtt_topic: 'fan' }, { $set: { status: '1' }});


    });
    
    socket.on('rule_config_data', function (data) {
        // console.log(data.rulename,data.actuator,data.from,data.to);
        // client.publish(data.topic,data.payload);
             // send to database
        var newrow = new PUser ({
            time: date,
            rule_name: data.rulename,
            actuator_type: data.actuator,
            from: data.from,
            to: data.to
        });
        newrow.save(function (err) {if (err) console.log ('Error on save!')});
    });
});

// listen to messages coming from the mqtt broker


client.on('connect', function () {

    client.subscribe('temp');
    client.subscribe('hum');
    client.subscribe('light');
    client.subscribe('soil');


})
 

    // client.on('message', function (topic, payload, packet) {
       

  

client.on('message', function (topic, message) {
  // message is Buffer 
  // console.log(topic.toString())
  // console.log(message.toString())

  // count++;
  // console.log("data count "+ count);
  date = new Date();
  date.setHours(date.getHours() + 5);
  date.setMinutes(date.getMinutes() + 30);

         // console.log(message)

  if(topic.toString() == 'temp'){
       console.log(topic.toString() + ' ' +  message.toString());
       t = message.toString();
       var anewrow = new PUser3 ({
            time: date,
            val: t
        });
       // console.log(t + '\n');
       // console.log(t_p);
       if(t_p != t){
         io.emit('mqtt','temp ' + t);
         anewrow.save(function (err) {if (err) console.log ('Error on save!')});
         // console.log("Temperature changed");
       }
       t_p = t;
  }
  if(topic.toString() == 'hum'){
      console.log(topic.toString() + ' ' +  message.toString());
      h = message.toString();
        var bnewrow = new PUser4 ({
            time: date,
            val: h
        });

        if(h_p != h){
        io.emit('mqtt','hum ' + h);
        bnewrow.save(function (err) {if (err) console.log ('Error on save!')});     
        }
        h_p = h;
  }

  if(topic.toString() == 'soil'){
      console.log(topic.toString() + ' ' +  message.toString());
      s = message.toString();
        var cnewrow = new PUser5 ({
            time: date,
            val: s
        });

        if(s_p != s){
        io.emit('mqtt','soil ' + s);
        cnewrow.save(function (err) {if (err) console.log ('Error on save!')});
        }
        s_p = s;
  }

  if(topic.toString() == 'light'){
      console.log(topic.toString() + ' ' +  message.toString());
      l = message.toString();
             // console.log(l);

     var dnewrow = new PUser6 ({
            time: date,
            val: l

     });

        if(l_p != l){
        io.emit('mqtt','light ' + l);
        dnewrow.save(function (err) {if (err) console.log ('Error on save!')});
        }
        l_p = l;
  }
  // client.end()
       
});

  
// console.log(date);
    // setTimeout(1000);



// var j = schedule.scheduleJob('1 * * * * ', function(){
//   console.log('The answer to life, the universe, and everything!');
// });
 
// client.on('message', function(topic, message) {
//   console.log(message);
// });

setInterval(function () {


        PUser3.find({},'val', function(err, data){

            state_temp_time = data.toString().split(',');
            // console.log(data);
            for(var i = 0;i<=data.length-1;i++){
              hum_[i] = state_temp_time[2*i+1].substring(7,12);
              if( hum_[i] == "nan' "){

                 hum_[i] = "0.0";
              }
              
              // console.log(hum_[i]);

            }
              // console.log(hum_.length);
              io.emit('mqtt_data',hum_);

        });

}, 1000);

// setInterval(function () {
// io.emit('mqtt', 'hello'); 

// }, 1000);