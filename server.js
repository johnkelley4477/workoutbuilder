'use strict';

const Hapi = require('hapi'),
	MongoClient = require('mongodb').MongoClient,
	ObjectId = require('mongodb').ObjectId,
	url = "mongodb://192.168.1.23:12001/workoutsDB";

const server = new Hapi.Server();

function postWorkoutData(data,callback){
	MongoClient.connect(url, function(err, db) {
	  if (err) throw err;

	  db.collection("workouts").insertOne(data, function(err, res) {
	    if (err) throw err;
	    if(res.result.ok === 1){
	    	
	    	callback(null,res.ops[0]);
	    }
	    db.close();
	  });
	});
}
function getWorkoutDataById(id,callback){
	MongoClient.connect(url, function(err, db) {
	  if (err) throw err;
	  var query = { "_id": ObjectId(id)};
	  db.collection("workouts").find(query).toArray(function(err, result) {
	    if (err) {
	    	callback(err);
	    }else{
	    	callback(null,result);
	    }
	    db.close();
	  });
	});
}
function getWorkoutDataByRoute(route,distance,interval,callback){
	MongoClient.connect(url, function(err, db) {
	  if (err) throw err;
	  var query = { "route": route, "distance": distance, "interval":interval};
	  db.collection("workouts").find(query).sort({timestamp:-1}).toArray(function(err, result) {
	    if (err) {
	    	callback(err);
	    }else{
	    	callback(null,result);
	    }
	    db.close();
	  });
	});
}
function getLastWorkoutDataByRoute(route,callback){
	MongoClient.connect(url, function(err, db) {
	  if (err) throw err;
	  var query = { "route": route};
	  db.collection("workouts").find(query).sort({timestamp:-1}).toArray(function(err, result) {
	    if (err) {
	    	callback(err);
	    }else{
	    	callback(null,result);
	    }
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

function getUniqueRoutes(callback){
	var result = "failed"
	MongoClient.connect(url, function(err, db) {
	 	if (err) throw err;
	 	
	 	db.collection("workouts").distinct("route",{},(function(err, docs){
	        if(err){
	            callback(err);
	        }
	        if(docs){  
	        	callback(null,docs);
	        }
   		}));
	});
}

function dataNomilizer(data,callback){
	var index = [],				
		payload = {},
		exercises = [];
	
	payload["route"] = data.route;
	payload["distance"] = data.distance;
	payload["interval"] = data.interval;
	payload["comments"] = data.comments;
	payload["timestamp"] = new Date();

	// build the index
	for (var x in data) {
	   index.push(x);
	}
	var intervals = parseFloat(data.interval);
	for (var i = 1; i <= data.interval; i++) {
		var exercise = {};
		exercise["miles"] = data[index[(i * 4) ]];
		exercise["workout"] = data[index[(i * 4) +1]];
		exercise["quantity"] = data[index[(i * 4) +2]];
		exercise["comment"] = data[index[(i * 4) +3]];
		exercises[i-1] = exercise;
		intervals = parseFloat(intervals) + parseFloat(data.interval);
	};
	payload["exercises"] = exercises;
	// callback(null,payload);
	postWorkoutData(payload,function(err,msg){
		if(err){
			callback(err);
		}else{
			callback(null,msg);
		}
	});
}

function pushUnique(array,value){
	let isUnique = false;
	array.forEach(function(item){
		if(item === value){
			return false;
		}else{
			isUnique = true;
		}
	});
	console.log(isUnique);
	if(isUnique || array.length < 1){
		return true;
	}
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

server.connection({ port: 3000, host: '0.0.0.0' });

server.route({
	method:'GET',
	path:'/workout',
	handler: function (request, reply) {
		getUniqueRoutes(function(err,msg){
			var data = {
	        	message: 'What did you do?'
	    	};
	       
	    	if(!err){
	        	data["workoutArray"] = msg.toString();
	        }
	        
	       return reply.view('workout',data);
      });
    }
});

server.route({
	method:'GET',
	path:'/workout/{route}',
	handler: function (request, reply) {
       getLastWorkoutDataByRoute(request.params.route,function(err,msg){
	        const route = request.params.route;
	    	
	    	let	distance = "",
	    		interval = "";
			var data = {
		            message: 'What did you do?',
		            route: route
		        }
	    	if(msg[0]){
	    		data["distance"] = msg[0].distance;
	    		data["interval"] = msg[0].interval;
	    	}
	        
			return reply.view('workout',data);
		});
    }
});

server.route({
	method:'GET',
	path:'/workout/{route}/{date}/{distance}/{interval}',
	handler: function (request, reply) {
		const route = request.params.route,
			date = request.params.date,
 			distance = request.params.distance,
 			interval = request.params.interval;
		getWorkoutDataByRoute(route,distance,interval,function(err,msg){
			let data = {
	            message: 'How did it go?',
	            route :route,
				date : date,
	 			distance : distance,
	 			interval : interval,
	 			past : msg[0].exercises
	 		}
		    
		    return reply.view('workout_details',data);
	   });
    }
});

server.route({
	method:'POST',
	path: '/workout/report',
	config:{
        handler:function(request,reply){
			const route = request.payload.route;
				dataNomilizer(request.payload,function(err,msg){
					var data = {
			            message: 'Here\'s how it went on your route ' + route
			        };
					if(err){
						console.log("Error: " + JSON.stringify(err));
					}else{
						let x = 0;
						let exercises = msg.exercises;
						getWorkoutDataByRoute(msg.route,msg.distance,msg.interval,function(err,wrk){
							exercises.forEach(function(exercises){
								if(x % 2 == 0){
									exercises["class"] = "even";
								}else{
									exercises["class"] = "odd";
								}
								console.log(wrk.length);
								if(wrk[1]){
									exercises["past"] = wrk[1].exercises[x].quantity;
								}
								++x;
							});
							data["workouts"] = exercises;
			        		return reply.view('report',data);
			        	});
					}
					
				});
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