(function(angular) {

var automaton = angular.module('automaton');

/**
 * BrowserUtils
 *
 * A singleton class comprising various utilities related to the browser
 * environment.  
 */
automaton.factory('BrowserUtils', function($window) {
    var $ = angular.element;

    var BrowserUtils;
    var _start = Date.now();

    return BrowserUtils = {
    
        /**
         * Sniffs cell padding and spacing from a given table in-context.
         * This function allows us to rely on plain css for styling the
         * table and cells in the automaton grid view.
         */
        getTablePaddingMetrics: function getTablePaddingMetrics(aTbl) {
            var tbl = aTbl.clone();
            var padding = {};
            var tmpCell = angular.element('<td/>').css({
                width: "10px", height: "10px"
            }).wrap('<tr/>');
        
            // temporarily substitute our sniffer table for the original
            tbl.empty().append(tmpCell.parent());
            aTbl.before(tbl).detach();
            
            // measure cell spacing
            padding.spaceX = (tbl.width() - tmpCell.outerWidth())/2;
            padding.spaceY = (tbl.height() - tmpCell.outerHeight())/2;

            // measure aggregate cell padding
            padding.cellX = tmpCell.outerWidth()-10;
            padding.cellY = tmpCell.outerWidth()-10;
            
            // now put back the original table, and destroy our tmp table
            tbl.before(aTbl).remove();
            return padding;
        },
        
        /**
         * Creates a stylesheet element that is ready to be added to the
         * document.
         */
        createStyleSheet: function createStyleSheet(rules) {
            var css = '';
            var selector = '';
            for (var i = 0; i < rules.length; ++i) {
                var item = rules[i];
                if (Array.isArray(item)) {
                    if (!selector) throw 'ruleset has no selectors at index '+i;
                    var ruleset = item;
                    css += ' {\n';
                    for (j = 0; j < ruleset.length; ++j) {
                        css += ruleset[j] + ';\n';
                    }
                    css += '}\n';
                } else {
                    if (selector) selector += ', ';
                    selector += rules[i];
                    css += selector;
                }
            }
            var style = $('<style type="text/css">'+css+'</style>');
            return style;
        },

        
        now: function() {
            if ($window.performance) {
                return $window.performance.now();
            }
            return Date.now() - _start;
        },

        debounce: function(fn) {
            var tmr = 0;
            return function() {
                if (tmr) clearTimeout(tmr);
                tmr = setTimeout(fn, 200);
            };
        },

        makeEmitter: function makeEmitter(self) {
            /** 
             * internal list of event handlers used by `on()`, `off()`, and `emit()` 
             **/
            var _handlers = {};

            /** 
             * add a listener for the indicated event. returns a function that,
             * when called, will remove the listener.
             */
            function on(evtName, handlerFn) {
                var handlerList = _handlers[evtName];
                if (!handlerList) {
                    handlerList = _handlers[evtName] = [];
                }
                handlerList.push(handlerFn);
                return function() {
                    off(evtName, handlerFn);
                }
            }

            /**
             * remove the indicated listener
             */
            function off(evtName, handlerFn) {
                var handlerList = _handlers[evtName];
                if (!handlerList) return;
                var i = handlerList.length;
                while (i--) {
                    if (handlerList[i] === handlerFn) {
                        handlerList.splice(i, 1);
                    }
                }
            }

            /**
             * emit the event, `evtName`.  additional arguments are passed
             * along to the event handlers.
             */
            function emit(evtName) {
                var handlerList = _handlers[evtName];
                if (!handlerList) return;
                var args = Array.prototype.slice.call(arguments, 1);
                var i = handlerList.length;
                while (i--) {
                    handlerList[i].apply(self, args);
                }
            }

            if (! self.on) self.on = on;
            if (! self.off) self.off = off;

            return {
                on: on,
                off: off,
                emit: emit
            };
        }
    };
});
// end: BrowserUtils

})(angular);