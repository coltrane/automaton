(function(angular) {
'use strict';

// Declare app level module which depends on views, and components
var app = angular.module('app', [
    'automaton']);


/**
 * Defaults and settings that configure the application
 */
app.value('defaults', {

    // default size, and seed function for the automaton
    size: 31,
    seed: function(size) {
        var seed = [];
        for (var i = 0; i < size; ++i) {
            seed[i] = 0;
        }
        if (size > 0) seed[Math.round(size / 2)-1] = 1;
        return seed;
    },

    // initial automaton rule to be used.
    rule: 30,

    // speed, in rows/sec, at which the generator will produce new rows.
    speed: 30,
    maxSpeed: 3000
});


/**
 * The main entry point for the app.
 */
app.run(function(
        $rootScope, $timeout, 
        AutomatonModel, AutomatonDataSource,
        defaults) {

    var $scope = $rootScope;

    var simState = {
        mode : 'reset',
        toggleRunMode: toggleRunMode,
        reset: reset, 
        rule: defaults.rule,
        speed: defaults.speed,
        size: defaults.size
    };
    $scope.simState = simState;
    $scope.settings = {
        visible : false,
        save : saveSettings
    };

    // setup our bindings to the scope
    $scope.$watch('simState.mode', _handleModeChanged);
    $scope.$watch('simState.rule', _handleRuleChanged);
    $scope.$watch('simState.speed', _handleSpeedChanged);

    $scope.$watch('settings.visible', _handleSettingsDialog);


    // setup the data source
    AutomatonDataSource.on('data', _handleNewAutomatonData);


    /**
     * starts and stops the automaton
     */
    function toggleRunMode() {
        var mode = simState.mode;
        simState.mode = 
                (mode === 'running') ? 'stopped' : 'running';
    }

    /**
     * returns the automaton to original state
     */
    function reset() {
        simState.mode = 'reset';
    }

    /**
     * saves the contents of $scope.settings into $scope.simState
     */
    function saveSettings() {
        /* jshint eqnull:true */

        var settings = $scope.settings;
        if (settings.rule != null) simState.rule = settings.rule;
        if (settings.speed != null) simState.speed = settings.speed;
        if (settings.size != null) simState.size = settings.size;

        reset();
    }


    function _handleSettingsDialog(isVisible) {
        if (isVisible) {
            var settings = $scope.settings;
            settings.rule = simState.rule;
            settings.speed = simState.speed;
            settings.size = simState.size;
        }
    }


    function _handleModeChanged(nextState, curState) {

        if (nextState === 'running') {

            var initialRow = AutomatonModel.getRow(
                    AutomatonModel.getRowCount() - 1);

            AutomatonDataSource.start(initialRow.data, simState.rule);

        } else if (nextState === 'stopped') {
            AutomatonDataSource.stop();

        } else {
            // reset
            AutomatonDataSource.stop();
            AutomatonModel.reset();

            var seedRow = defaults.seed(simState.size);

            // if this is not called in a separate digest, then
            // AutomatonViewer will fail to pick up the changes as it should.
            // the $timeout forces a separate digest.    
            $timeout(function() {
                AutomatonModel.appendRow(seedRow);
            });


            simState.mode = 'stopped';
        }
    }

    function _handleRuleChanged(val) {
        if (val < 0) simState.rule = val = 0;
        if (val > 255) simState.rule = val = 255; 
    }

    function _handleSpeedChanged(val) {
        if (val < 0) simState.speed = 0;
        if (val > 1000) simState.speed = 1000;

        AutomatonDataSource.speed(simState.speed);
    }

    function _handleNewAutomatonData(data) {
        AutomatonModel.appendRows(data);
    }
});


})(angular);
