var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://192.168.1.23:12001/workoutsDB"; //75.176.17.194

MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  console.log("Database created!");
  db.close();
});