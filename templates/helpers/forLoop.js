var _ = require('lodash'),forLoop;

forLoop  = function(from, to, incr, distance, past, context){
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
        if (past === null){
            context.data.mileage = mileage;
        }else{
            context.data.mileage = past[i].miles;
            context.data.workout = past[i].workout;
            context.data.quantity = past[i].quantity;
        }
    	
        context.data.index = i;
        accum += context.fn(this);
        mileage = mileage + mileageStep;
    }
    return accum;
}

module.exports = forLoop;