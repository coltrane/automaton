(function(angular) {
'use strict';

var automaton = angular.module('automaton');


automaton.factory('AutomatonDataSource', function AutomatonDataSourceFactory(
		$timeout,
		BrowserUtils) {

	/** the public interface object **/
	var AutomatonDataSource = {
		start: start,
		stop: stop,
		speed: speed
	};
	var emitter = BrowserUtils.makeEmitter(AutomatonDataSource);


	/** stores the stop function while a simulation is running **/
	var _stopFn = null;


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

	/**
	 * begins running successive iterations of the given automaton
	 * until _stopFn is called
	 */
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
	    	if (tmThisFrame === undefined) tmThisFrame = BrowserUtils.now();
	        if (!shouldKeepRunning) return;
	        
	        // compute elapsed time since last frame
	        if (tmStart === 0) tmStart = tmThisFrame;
	        var tmElapsed = Math.max(1, tmThisFrame - tmStart);
	        	        
	        // generate more rows if necessary, and render them
	        var ctRowsStart = ctRows;
	        var rows = [];
	        while (1000 * (ctRows/tmElapsed) < _speed) {
	            states = iterate(states, rule);
	            rows.push(states);
	            ctRows += 1;
	        }
	        
	        if (rows.length) emitter.emit('data', rows);
	        
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

	/**
	 * stops the running automaton.
	 */
	function stop() {
		if (!_stopFn) return;
		_stopFn();
	}

	/**
	 * compute a complete iteration of an automaton vector.
	 */
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

    /**
     * given all the info for a single cell, compute the
     * next state for that cell
     */
	function nextState(rule, left, self, right) {
	    var state = left << 2;
	    state |= self << 1;
	    state |= right;
	    return ((rule & (1 << state)) === 0) ? 0 : 1;
	}

	return AutomatonDataSource;
});
})(angular);
