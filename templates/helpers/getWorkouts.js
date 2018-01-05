var _ = require('lodash'),getWorkouts;

getWorkouts  = function(distance, interval, context){
	if(_.isEmpty(context)){
		return 0;
	}

	var dis = parseFloat(distance),
		inter = parseFloat(interval);

	return dis/inter;
}

module.exports = getWorkouts;