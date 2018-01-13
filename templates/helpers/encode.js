var _ = require('lodash'),getDistances;

getDistances  = function(options, context){
	if(_.isEmpty(context)){
		return 0;
	}
	console.log(options);
	return JSON.stringify(options);
}

module.exports = getDistances;