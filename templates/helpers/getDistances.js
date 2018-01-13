var _ = require('lodash'),getDistances;

getDistances  = function(options, context){
	if(_.isEmpty(context)){
		return 0;
	}

	return parseFloat(options) * 2;
}

module.exports = getDistances;