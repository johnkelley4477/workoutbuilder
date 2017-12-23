var _ = require('lodash'),forLoop;

forLoop  = function(from, to, incr, interval, context){
	if(_.isEmpty(context)){
		return 0;
	}
	var accum = '',
		intervalTotal = interval;
    for(var i = from; i < to; i += incr){
    	if(i%2==0){
    		context.data.flip = "even";
    	}else{
    		context.data.flip = "odd";
    	}
    	context.data.mileage = intervalTotal;
    	context.data.index = i;
        accum += context.fn(this);
        intervalTotal = parseFloat(intervalTotal) + parseFloat(interval);
    }
    return accum;
}

module.exports = forLoop;