var _ = require('lodash'),forLoop;

forLoop  = function(from, to, incr, distance, context){
	if(_.isEmpty(context)){
		return 0;
	}

	var accum = '',
		mileageStep = parseFloat(distance)/parseFloat(to);
        mileage = mileageStep;
    for(var i = from; i < to; i += incr){
    	if(i%2==0){
    		context.data.flip = "even";
    	}else{
    		context.data.flip = "odd";
    	}
    	context.data.mileage = mileage;
    	context.data.index = i;
        accum += context.fn(this);
        mileage = mileage + mileageStep;
    }
    return accum;
}

module.exports = forLoop;