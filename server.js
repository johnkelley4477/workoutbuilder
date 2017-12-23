'use strict';

const Hapi = require('hapi'),
	MongoClient = require('mongodb').MongoClient,
	ObjectId = require('mongodb').ObjectId,
	url = "mongodb://192.168.1.23:12001/workoutsDB";

const server = new Hapi.Server();

function postWorkoutData(data){
	MongoClient.connect(url, function(err, db) {
	  if (err) throw err;

	  db.collection("workouts").insertOne(data, function(err, res) {
	    if (err) throw err;
	    db.close();
	  });
	});
}
function getWorkoutDataById(id){
	MongoClient.connect(url, function(err, db) {
	  if (err) throw err;
	  var query = { "_id": ObjectId(id)};
	  console.log(query);
	  db.collection("workouts").find(query).toArray(function(err, result) {
	    if (err) throw err;
	    console.log(result);
	    db.close();
	  });
	});
}

function showAll(){
	MongoClient.connect(url, function(err, db) {
	  if (err) throw err;
	  db.collection("workouts").find({}).toArray(function(err, result) {
	    if (err) throw err;
	    console.log(result);
	    db.close();
	  });
	});
}

function getUniqueRoutes(){
	var result = "failed"
	MongoClient.connect(url, function(err, db) {
	 	if (err) throw err;
	 	db.collection("workouts").distinct("route",{},(function(err, docs){
	        if(err){
	            console.log(err);
	        }
	        if(docs){  
	        	console.log("in func: " + docs);
	            result = docs;
	        }
   		}));
	});
	return result;
}

server.register(require('vision'), (err) => {

    server.views({
        engines: {
            html: require('handlebars')
        },
        path: './templates',
	    layoutPath: './templates/layout',
	    partialsPath: './templates/partials',
	    helpersPath: './templates/helpers',
	    layout: 'default'
    });
});

server.connection({ port: 3001, host: 'localhost' });

// server.route({  
//   method: 'GET',
//   path: '/main.css',
//   handler: function (request, reply) {
//     // reply.file() expects the file path as parameter
//     reply.file('./css/main.css')
//   }
// })

server.route({
	method:'GET',
	path:'/workout',
	handler: function (request, reply) {
		 var data = {
            message: 'What did you do?',
            workoutArray: 'test'//getUniqueRoutes()
        };
        //console.log(getUniqueRoutes());
        return reply.view('workout',data);
    }
});

server.route({
	method:'POST',
	path:'/workout',
	handler: function (request, reply) {
		console.log(request.payload);
		const route = request.payload.route,
			date = request.payload.date,
 			distance = request.payload.distance,
 			interval = request.payload.interval,
 			count = parseFloat(distance)/parseFloat(interval);
		var data = {
            message: 'How did it go?',
            route :route,
			date : date,
 			distance : distance,
 			interval : interval,
 			count : count
        };
        return reply.view('workout_details',data);
    }
});

server.route({
	method:'POST',
	path: '/workout/report',
	config:{
        handler:function(request,reply){
	 		const route = encodeURIComponent(request.payload.route).replace(/%20/g,' '),
	 			distance = request.payload.distance,
	 			interval = request.payload.interval,
	 			count = parseFloat(distance)/parseFloat(interval);

 			var index = [],
 				labels = '[',
 				chartData = '[',
 				payload = request.payload;
 				payload["timestamp"] = new Date();
 				postWorkoutData(payload);
			// build the index
			for (var x in request.payload) {
			   index.push(x);
			}
			var intervals = interval;
			for (var i = 1; i <= count; i++) {
				var comma = "";
				if(i !== count){
					comma  = ",";
				}
				labels = labels.concat(intervals  + comma);
				chartData = chartData.concat(request.payload[index[(i * 4) +1]] + comma);
				intervals = parseFloat(intervals) + parseFloat(interval);
			};
			labels = labels.concat(']');
			chartData = chartData.concat(']');
	 		var data = {
	            message: 'Here\'s how it went on your route ' + route,
	            label: labels,
	            data:chartData
	        };
	        return reply.view('report',data);
        },
        payload:{
            output: 'data',
            parse:true
        }
    }
});

server.start((err) => {
    if (err) {
        throw err;
    }
    console.log(`Server running at: ${server.info.uri}`);
});