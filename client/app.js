'use strict';
(function(angular) {

// Declare app level module which depends on views, and components
var app = angular.module('app', [
    'automaton']);


/**
 * Defaults and settings that configure the application
 */
app.value('defaults', {

    // default size, and seed data for the automaton
    seed: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    size: 31,

    // initial automaton rule to be used.
    rule: 30,

    // speed, in rows/sec, at which the generator will produce new rows.
    speed: 30,
    maxSpeed: 3000
});


/**
 * The main entry point for the app.
 */
app.run(function($rootScope, $timeout, AutomatonModel, AutomatonDataSource,
        asyncDigest, defaults) {

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


    function toggleRunMode() {
        var mode = simState.mode;
        simState.mode = 
                (mode === 'running') ? 'stopped' : 'running';
    };

    function reset() {
        simState.mode = 'reset';
    }

    function saveSettings() {
        var settings = $scope.settings;
        console.log("saveSettings", settings);
        if (settings.rule != null) simState.rule = settings.rule;
        if (settings.speed != null) simState.speed = settings.speed;
        if (settings.size != null) simState.size = settings.size;

        reset();
        console.log("simState: ", simState);
    }

    function _handleSettingsDialog(isVisible) {
        if (isVisible) {
            var settings = $scope.settings;
            settings.rule = simState.rule,
            settings.speed = simState.speed,
            settings.size = simState.size        
            console.log("settingsVisible...", settings);
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
            AutomatonModel.reset()

            var seedRow = defaults.seed.slice(0, simState.size);
            while(seedRow.length < simState.size) seedRow.push(0);     
            console.log("size: ", simState.size, "seedRow.length", seedRow.length)      
            AutomatonModel.appendRow(seedRow);

            simState.mode = 'stopped';
            console.log('reset done');
        }
    }

    function _handleRuleChanged(val) {
        console.log('rule changed', val);
        if (val < 0) simState.rule = val = 0;
        if (val > 255) simState.rule = val = 255; 
    }

    function _handleSpeedChanged(val) {
        console.log('speed changed', val);
        if (val < 0) simState.speed = 0;
        if (val > 1000) simState.speed = 1000;

        AutomatonDataSource.speed(simState.speed);
    }

    function _handleNewAutomatonData(data) {
        AutomatonModel.appendRows(data);
        asyncDigest($scope);
    }


});


app.factory('asyncDigest', function($rootScope, $timeout) {

    
    function asyncDigest(scope) {
        if (!scope) scope = $rootScope;
        if (scope.$$phase) return;
        if (scope._pendingAsyncDigest) return;

        scope._pendingAsyncDigest = requestAnimationFrame(function() {
            console.log("digest");
            scope.$apply();
            scope._pendingAsyncDigest = false;
        });
    }

    return asyncDigest;
});

})(angular);

