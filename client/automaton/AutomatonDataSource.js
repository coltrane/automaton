angular.module('automaton')

.factory('AutomatonDataSource', function AutomatonDataSource(
		$timeout,
		BrowserUtils) {


	/**
	 * this is the public interface object, which will be
	 * returned from this factory function.
	 */
	var AutomatonDataSource = {
		start: start,
		stop: stop,
		speed: speed
	};

	// adds emitter/on/off functions
	var emitter = BrowserUtils.makeEmitter(AutomatonDataSource);


	/**
	 * the speed, in iterations-per-second, at which the simulation
	 * will attempt to run.
	 */
	var _speed = 1;
	function speed(val) {
		if (val !== undefined) {
			_speed = val;
		}
		return _speed;
	}

	var _stopFn = null;

	function start(initialStates, rule) {
	    
	    if (_stopFn) {
	    	throw new Error("AutomatonDataSource.start: already running");
	    }

	    var tmLastFrame = 0;
	    var tmStart = 0;
	    var ctFrame = 0, ctRows = 0;
	    var states = initialStates;  
	    var shouldKeepRunning = true;
	    var frameClock = null;

	    run(BrowserUtils.now());
	    
	    function run(tmThisFrame) {
	    	if (tmThisFrame == null) tmThisFrame = BrowserUtils.now();
	        if (!shouldKeepRunning) return;
	        
	        // compute elapsed time since last frame
	        if (tmStart === 0) tmStart = tmThisFrame;
	        var tmElapsed = Math.max(1, tmThisFrame - tmStart);
	        	        
	        // generate more rows if necessary, and render them
	        var ctRowsStart = ctRows;
	        var rows = [];
	        while (1000 * (ctRows/tmElapsed) < _speed) {
	            //console.log(states);
	            states = iterate(states, rule);
	            rows.push(states);
	            ctRows += 1;
	        }
	        
	        if (rows.length) emitter.emit('data', rows);

	        // dump some metrics
	        /*
	        console.log("rendered " + (ctRows - ctRowsStart) 
	                    + " rows in frame " + ctFrame + "."
	                    + " Frame Rate: " + frameRate 
	                    + " (avg: " + avgFrameRate + ")");
	        */
	        
	        // increment frame counter and schedule next frame rendering
	        ctFrame += 1;
	        var frameClock = $timeout(run, 20);
	    }
	    
	    function stop() {
	        shouldKeepRunning = false;
	        _stopFn = null;
	        if (frameClock) {
	            $timeout.cancel(frameClock);
	            frameClock = null;
	        }
	        return states;
	    }

	    _stopFn = stop;
	    return stop;
	}

	function stop() {
		if (!_stopFn) return;
		_stopFn();
	}


    function iterate(states, rule) {
        var nextStates = [];
        var size = states.length;
        for (var i = 0; i < size; ++i) {
            var left, ctr, right;
            left = states[(i - 1 + size) % size];
            right = states[(i + 1) % size];
            ctr = states[i];
            nextStates[i] = nextState(rule, left, ctr, right);
        }
        return nextStates;
    }

	function nextState(rule, left, self, right) {
	    var state = left << 2;
	    state |= self << 1;
	    state |= right;
	    return ((rule & (1 << state)) === 0) ? 0 : 1;
	}

	return AutomatonDataSource;
});