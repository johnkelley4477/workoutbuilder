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
	    	callback(res.result)
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

	callback(null,payload);
	// postWorkoutData(payload,function(err,msg){
	// 	if(err){
	// 		callback(err);
	// 	}else{
	// 		callback(null,msg[0]);
	// 	}
	// });
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
	 			interval : interval
	 		}
			
			data["past"] = JSON.stringify(msg[0]); 
		    
		    return reply.view('workout_details',data);
	    });
    }
});

server.route({
	method:'POST',
	path: '/workout/report',
	config:{
        handler:function(request,reply){
	 		const route = request.payload.route,
	 			distance = request.payload.distance,
	 			interval = request.payload.interval;

 			var index = [],
 				labels = [],
 				chartData = {},
 				workouts = [],
 				reps = [],
 				payload = request.payload,
 				exeIndex = 0;

 				dataNomilizer(payload,function(err,msg){
 					if(err){
 						console.log(err);
 					}else{
 						/*
						contract for charData:
							{
								"burpies":[5,null,5],
								"monkey bars":[null,20,null]
							}
 						*/
 						msg.exercises.forEach(function(exercise){
 							let isUnique = false,
 								kill = false,
 								reps = [];
							workouts.forEach(function(item){
								if(item === exercise.workout){
									isUnique = false;
									chartData[exercise.workout].splice( exeIndex, 0, exercise.quantity);
									kill = true;
								}else{

									isUnique = true;
								}
							});
							if(isUnique && !kill){
								workouts.push(exercise.workout);
								chartData[exercise.workout] = [];
								chartData[exercise.workout].splice( exeIndex, 0, exercise.quantity);
							}else if(workouts.length < 1){
								workouts.push(exercise.workout);
								chartData[exercise.workout] = [];
								chartData[exercise.workout].push(exercise.quantity);
							}


 							labels.push(exercise.miles);
 							//chartData.push(exercise.quantity);
 							++exeIndex;
 						});
 						console.log(chartData);
 					}
 					var data = {
			            message: 'Here\'s how it went on your route ' + route,
			            label: JSON.stringify(labels),
			            workouts: JSON.stringify(workouts),
			            data: JSON.stringify(chartData)
			        };
			        return reply.view('report',data);
 				});
			// build the index
			// for (var x in request.payload) {
			//    index.push(x);
			// }
			// var intervals = interval;
			// for (var i = 1; i <= count; i++) {
			// 	var comma = "";
			// 	if(i !== count - 1){
			// 		comma  = ",";
			// 	}
			// 	labels = labels.concat(intervals  + comma);
			// 	chartData = chartData.concat(request.payload[index[(i * 4) +1]] + comma);
			// 	intervals = parseFloat(intervals) + parseFloat(interval);
			// };
			// labels = labels.concat(']');
			// chartData = chartData.concat(']');
	 		
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