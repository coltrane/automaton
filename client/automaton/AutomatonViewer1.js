angular.module('automaton', [])


/**
 * AutomatonViewerDirective
 * directive automatonViewer
 *
 * Represents the automaton viewer ui control, which displays a browsable
 * view on the data contained in the AutomatonModel.  This component
 * ensures that only a small subset of the AutomatonModel is actually
 * rendered in the browser at any given time. This allows the AutomatonModel
 * to become very large without significantly impacting performance
 * and usability of the UI. This directive uses AutomatonViewerCtrl.
 */
.directive('automatonViewer', function AutomatonViewerDirective(
        $window,
        BrowserUtils) {

    /** The template used to create the component's internal elements */
    // var tpl = ' \
    //   <div class="atmn-grid-scroll"></div> \
    //   <table class="atmn-grid-content"> \
    //     <tr automaton-viewer-row ng-repeat="row in automatonViewer.rows track by automatonViewer.getRowUid(row)"></tr> \
    //   </table>';
    var tpl = ' \
      <div class="atmn-grid-scroll"></div> \
      <table class="atmn-grid-content"> \
      </table>';

    var rowTpl = '<tr></tr>';


    /** The initial scope returned by this directive */
    var scope = {};

    /** 
     * Tracks the number of times this component has been instantiated.
     * This is used to generate unique ids for the container element
     * if it arrived without one. 
     */
    var instanceCount = 0;

    /**
     * Called each time an element with this directive is placed into 
     * the DOM.  This creates all the necessary child elements, and
     * calls `doLayout()` 
     */
    function link ($scope, $element, $attrs, $controller) {
        // called once each time an element with this 
        // directive is placed into the DOM

        console.log("AutomatonViewerDirective.link")

        instanceCount += 1;


        var root = $element;
        var scroll = root;
        var scrollSpacer = $element.find('.atmn-grid-scroll');
        // var scrollSpacer = $element.find('.atmn-grid-scroll div');
        var tbl = $element.find('table.atmn-grid-content');

        var stylesheet = null;
        var rootId;
        var paddingMetrics;
        var layoutMetrics;

        var automatonSize;
        var lastVisibleIdx = 0;

        var liveRows = [];

        root.css({
            overflow: 'scroll'
        });

        tbl.css({
            position: 'absolute',
            overflow: 'hidden',
            top: 0,
        });
    
/*        scroll.css({
            position: 'absolute',
            top: 0, bottom: 0, right: 0,
            width: '1px',
            overflow: 'scroll',
        });
*/

        // root element must have an id.  if it doesn't, we'll add one
        // this is necessary because we later add a sylesheet which
        // needs to apply rules that are specific to this instance.
        rootId = root.attr('id');
        if (!rootId) {
            rootId = 'atmn-grid-'+instanceCount;
            root.attr('id', rootId);
        }

        paddingMetrics = BrowserUtils.getTablePaddingMetrics(tbl);


        $scope.$watch('automatonViewer.automatonSize', 
                function(newVal, oldVal) {

            // console.log("automatonSize: ", arguments);
            automatonSize = newVal;
            doLayout();
        });

        $($window).on('resize', BrowserUtils.debounce(function() {
            doLayout();
            updateScroll();
        }));

        $scope.$watch('automatonViewer.trackNewData', function(val) {
            // console.log("trackNewData: ", val);
            updateScroll();
        });

        $scope.$watch('automatonViewer.availableRowCount', function(val) {
            // console.log("ViewerDirective: availableRowCount: ", val);
            updateScroll();
        });

        var lastScroll = 0;
        var lastScrollDir = 1;
        scroll.on('scroll', function() {
            var thisScroll = scroll.scrollTop();
            if (thisScroll > lastScroll) {
                // down
                if (lastScrollDir < 0) {
                    console.log("scroll changed dir!", lastScroll, thisScroll);
                }
                lastScrollDir = 1;
            } else if (thisScroll < lastScroll) {
                if (lastScrollDir > 0) {
                    console.log("scroll changed dir!", lastScroll, thisScroll);
                }
                lastScrollDir = -1;
            } else {
                console.log("scroll is zero!");
            }
            lastScroll = thisScroll;
            //console.log(root.scrollTop());
            updateScroll();
        });

        function updateScroll() {
var _tmStart = BrowserUtils.now();
            var requestedScrollPos = scroll.scrollTop();
            console.log("updateScroll", requestedScrollPos);

            //_updateScroll(requestedScrollPos);
            //return;
///
            //console.log("requestedScrollPos: ", requestedScrollPos);
            var availableRowCount = $scope.automatonViewer.availableRowCount;
            // console.log("updateScroll: availableRowCount: ", availableRowCount);

            // adjust the scroll height if necessary
            var newScrollHeight = availableRowCount *
                    (layoutMetrics.cellOuterSize + paddingMetrics.spaceY) +
                    paddingMetrics.spaceY;
            if (newScrollHeight && scrollSpacer.height() !== newScrollHeight) {
                console.log("changed scroll height:", newScrollHeight);
                scrollSpacer.css('height', newScrollHeight + 'px');
                //content.css('height', newScrollHeight + 'px');
            }

tbl.detach();
            // fix up the scroll position if trackNewData is enabled
            var trackNewData = $scope.automatonViewer.trackNewData;
            var rootHeight = root.height();

            if (trackNewData) {
                requestedScrollPos = newScrollHeight - rootHeight;
                root.scrollTop(requestedScrollPos);
            }

            // figure out what rows should now be visible, and request
            // them if they're not visible.
            var rows = $scope.automatonViewer.rows;
            var neededTopIdx = Math.floor(requestedScrollPos / 
                    (layoutMetrics.cellOuterSize + paddingMetrics.spaceY)) - 1;
            var actualTopIdx = rows.length ? rows[0].id : 0;

            if (neededTopIdx != actualTopIdx) {
                console.log("needed: ", neededTopIdx, "actual: ", actualTopIdx);
                $controller.windowPosition(
                        neededTopIdx + layoutMetrics.maxRowCount - 1);
                rows = $scope.automatonViewer.rows;

                ///

                // var olStartIdx = min(oldLastIdx, lastIdx);
                // var olEndIdx = max(oldFirstIdx, firstIdx);
                // var olSize = Math.max(0, olEndIdx - olStartIdx + 1);

                function fixupTableRows(rows, liveRows) {

                    var liveBaseIdx = (liveRows.length) ? liveRows[0].row.id : 0;

                    tbl.empty();
                    var newRows = [];
                    for (var i = 0; i < rows.length; ++i) {
                        var row = setRow(i, rows[i]);
                        tbl.append(row.element);
                        newRows.push(row);
                    }

                    liveRows = newRows;

                    function setRow(idx, row) {
                        var rowId = row.id;
                        var existingIdx = rowId - liveBaseIdx;
                        if (existingIdx >= 0 && existingIdx < liveRows.length) {
                            row = liveRows[existingIdx];
                            if(row) {
                                liveRows[existingIdx] = null;
                                return row;
                            }
                        }
                        var elRow = '<tr>';
                        for (var j = 0; j < automatonSize; ++j) {
                            elRow += '<td>1</td>';
                        }
                        elRow += '</tr>';
                        elRow = $(elRow);
                        console.log("made new row: ", row);
                        return {
                            element: elRow,
                            row: row
                        };
                    }

                    return liveRows;
                }

               // liveRows = fixupTableRows(rows, liveRows);

                ///
                actualTopIdx = rows.length ? rows[0].id : 0;
            }

            // now, put the table where it should be within the scroll
            tblTopPx = actualTopIdx * 
                    (layoutMetrics.cellOuterSize + paddingMetrics.spaceY) + 
                    (scroll.scrollTop() - requestedScrollPos);

            // console.log("  actualTopIdx: ", actualTopIdx,
            //         "tblTopPx: ", tblTopPx);

            console.log("tblTopPx", tblTopPx, requestedScrollPos, scroll.scrollTop());
            if (tbl.css('top') !== tblTopPx) {
                //console.log("changed table position: ", tblTopPx);
                tbl.css('top', tblTopPx + 'px');
            }
tbl.appendTo(root);
console.log("  time: ", (BrowserUtils.now()-_tmStart).toFixed(2));
            return;
        }

        /**
         * Lays out the various internal elements of the viewer based on
         * the number of cells in the automaton, and the dimensions of
         * the root container.  Returns an object describing properties
         * of the resulting layout, including:  `cellOuterSize`, `tblWidth`, 
         * `maxRowCount`, and `maxTblHeight`.
         */
        function doLayout() {
            var cellCountX = automatonSize;
            var padding = paddingMetrics;

            var rootWidth = root.width();
            var rootHeight = root.height();
            var result = {};
            
            // compute cell-size based on the size of the root container
            // and the number of cells we have to display.  Cells are square.
            var cellOuterSize = (rootWidth - padding.spaceX) / cellCountX - 
                  padding.spaceX;
            cellOuterSize = Math.floor(cellOuterSize);

            var cellInnerSize = cellOuterSize - padding.cellX;
            cellInnerSize = Math.max(0, cellInnerSize);
            cellOuterSize = cellInnerSize + padding.cellX;

            result.cellOuterSize = cellOuterSize;

            // compute the table width based on the cell size and the number
            // of cells we have to display.
            var tblWidth = (cellOuterSize + padding.spaceX) * cellCountX +
                  padding.spaceX;
            
            result.tblWidth = tblWidth;

            // compute the maximum number of rows we can show based on the
            // size of the container, and the cell size.
            var maxRowCount = (rootHeight - padding.spaceY) /
                  (cellOuterSize + padding.spaceY);
            maxRowCount = Math.ceil(maxRowCount) + 20;

            result.maxRowCount = maxRowCount;

            // compute the maximum height of the table in pixels based on
            // the maxRowCount and the cell size
            var maxTblHeight = 
                (cellOuterSize + padding.spaceY) * maxRowCount + padding.spaceY;
            
            result.maxTblHeight = maxTblHeight;


            // set table dimensions, and center it
            tbl.css({
                width: tblWidth + 'px',
                left: Math.round((rootWidth - tblWidth) / 2) + 'px'
            });
            
            // set cell dimensions for all cells in this table
            if (stylesheet) stylesheet.remove();
            stylesheet = BrowserUtils.createStyleSheet([
                '#' + rootId + ' td', [
                    'width: ' + cellInnerSize + 'px',
                    'height: ' + cellInnerSize + 'px'
                ]
            ]);
            $(root.get(0).ownerDocument.head).append(stylesheet);
            
            

            // dump metrics
            console.log("Layout Metrics:", {
                "root.width (actual)": root.width(),
                "root.width (expected)": rootWidth,
                "padding": padding,
                "layout": result,
                "cellInnerSize": cellInnerSize
            });

            $controller.windowSize(result.maxRowCount);
            layoutMetrics = result;
            updateScroll();
        }


        // console.log('AutomatonViewer: ', $element[0]);
    }

    /**
     * return the directive's registration object
     */
    return {
        restrict: 'E',
        scope: scope,
        template: tpl,
        controller: 'AutomatonViewerCtrl',
        link: link,
    };
})
// end: AutomatonViewerDirective


/**
 * AutomatonViewerCtrl
 * 
 * Connects the AutomatonViewer to the AutomatonData service, and
 * manages runtime-configurable aspects of the AutomatonViewer. 
 * This controller is attached by the AutomatonViewerDirective.
 */
.controller('AutomatonViewerCtrl', function AutomatonViewerCtrl(
      $scope,
      AutomatonModel,
      asyncDigest) {

    // a new controller instance is created for each new instance of
    // the component in the page.

    var _viewModel = {
        trackNewData: false,
        rows: [],
        automatonSize: 1,
        getRowUid: getRowUid
    };   
    $scope.automatonViewer = _viewModel;


    /**
     * get/set values within the view model, which is available on
     * the scope.
     */
    function viewModel(name, val) {
        if (!name) return _viewModel; 
        if (val !== undefined) {
            _viewModel[name] = val;
            asyncDigest($scope);
        }
        return _viewModel[name];
    }


    /** 
     * The number of rows requested by the viewer.  This controller will
     * populate the data set with no more than this number of rows.  This 
     * is called by the directive as the size of the container changes.
     */
    var _windowSize = 0;
    function windowSize(val) {
        if (val !== undefined && _windowSize !== val) {
            _windowSize = val;
            console.log("AutomatonViewerCtrl: set windowSize: ", _windowSize);
            _updateDataView();
        }
        return _windowSize;
    }
    this.windowSize = windowSize;

    /**
     * The index of the last row that should be placed in the data set.
     * The full extents of the dataset are given by:
     * 
     *     [windowPosition - windowSize + 1, windowPosition]
     *
     * Note that the range is inclusive.  This is called by the directive
     * as the view window is moved (eg. scrolled) up/down against the
     * master dataset.
     */
    var _windowPosition = 0;
    function windowPosition(val) {
        if (val !== undefined && _windowPosition !== val) {
            _windowPosition = val;
            console.log("AutomatonViewerCtrl: set windowPosition: ", _windowPosition);
            _updateDataView();
        }
        return _windowPosition;
    }
    this.windowPosition = windowPosition;

    /**
     * boolean : when true, the component will detect when new data
     * is added to the end of the model's list, and will update the view
     * to ensure that the new data is immediately visible without the user
     * having to manually scroll it into view.
     */
    function trackNewData(val) {
        if (val !== undefined) {
            viewModel('trackNewData', !!val);
        }
        return viewModel('trackNewData');
    }

    /**
     * array : an list of row objects that should be currently rendered
     * within this component.  This is maintained as a subset of the full
     * row list as contained in the AutomatonModel.
     */
    function rows(val) {
        if (val !== undefined) {
            viewModel('rows', val);
        }
        return viewModel('rows');
    }

    /**
     * the number of cells in the automaton data that will be rendered
     */
    function automatonSize(val) {
        if (val !== undefined) {
            viewModel('automatonSize', val);
        }
        return viewModel('automatonSize');
    }


    /**
     * the number of rows available in the master model
     */
    function availableRowCount(val) {
        var curval = viewModel('availableRowCount');
        if (val !== undefined && val !== curval) {
            curval = val;
            viewModel('availableRowCount', val);
        }
        return curval;
    }


    /**
     * gets a unique identifier for the given row object.  this identifier
     * is a composition of `row.id`, and `row.version`, which ensures that
     * it will change when the row object is updated.  This is used by
     * ng-repeat to prevent re-rendering unchanged elements unnecessarily. 
     */
    function getRowUid(row) {
        return row.id + ':' + row.version;
    }




    /**
     * Returns a list of row objects from `rows` where each has `id` matching
     * one of the provided `rowIds`.  `rowIds` is an array of numeric
     * row id values.
     */
    function _findRowsById(ids, rows) {

        var result = [];

        // the values in `ids` will always be numeric, so sorting
        // them makes sense.  We also know that `rows` will already
        // be sorted by id.
        ids = ids.sort();

        // short circuit for simple cases
        if (rows.length === 0 || ids.length === 0) return result;
        if (ids[ids.length-1] < rows[0]) return result;
        if (ids[0] > rows[rows.length-1]) return result;

        // all other cases compare item-by-item.
        for (var i = 0, j = 0; i < ids.length; ++i) {
            var chgId = ids[i];
            while (chgId > rows[j].id) {
                ++j;
                if (j >= rows.length) return result;
            }
        }

        return result;
    }

    /**
     * fetches a dataset ending at `lastRowId` (or before that, if
     * `lastRowId` does not exist in AutomationModel.  Fetches at most
     * `windowSize()` elements.  Fetched data is stored into `rows()`,
     * and other necessary scope state is updated as well.
     */
    function _fetchData(lastRowId) {
        // console.log("fetchData", lastRowId);
        var availableRowCount = AutomatonModel.getRowCount();
        lastRowId = Math.min(availableRowCount, lastRowId);
        var startId = Math.max(0, lastRowId - windowSize() + 1);
        var fetchedRows = AutomatonModel.getRange(startId, startId+windowSize());

        // increase the automaton size if necessary
        //   TODO: (JLC) should atmn size be fixed? maybe set it on
        //   the model, and pull it from there on reset?
        if (fetchedRows.length && fetchedRows[0].data.length > automatonSize()) {
            automatonSize(fetchedRows[0].data.length);
        }

        // set the row data
        rows(fetchedRows);
        // console.log("rows: ", JSON.stringify(fetchedRows, null, '  '));
    }

    /**
     * updates the subset of data in the viewmodel based on the available
     * data in the master model, the _windowSize, and whether or not 
     * _trackNewData is set.  If no updates are necessary, then none are
     * applied.  Returns `true` if updates were applied, `false` otherwise.
     */
    function _updateDataView() {
        var _rows = rows();
        var _trackNewData = trackNewData();
        var _windowSize = windowSize();

        console.log('updateDataView: windowPos: ', windowPosition(),
            "windowSize: ", windowSize());

        availableRowCount(AutomatonModel.getRowCount());
        _fetchData(windowPosition());

        return;

        if (_trackNewData || _rows.length < _windowSize) {
            // console.log("updateDataView");
            var lastAvailableRow = AutomatonModel.getRow(
                    AutomatonModel.getRowCount() - 1);
            if (!lastAvailableRow) return false;

            var lastVisibleRow = _rows[_rows.length - 1];

            // console.log("  lastVisibleRow:", lastVisibleRow,
            //         "lastAvailableRow: ", lastAvailableRow,
            //         "_rows.length: ", _rows.length,
            //         "_windowSize: ", _windowSize);

            if (!lastVisibleRow || 
                    lastAvailableRow.id > lastVisibleRow.id ||
                    _rows.length != _windowSize) {

                _fetchData(lastAvailableRow.id);
                return true;
            }
        } else if (_rows.length > _windowSize) {
            _fetchData(_rows[_windowSize - 1].id);
        }
    }

    // listen to the model, and respond when it changes
    AutomatonModel.on('changed', function(ids) {
        // `ids` is a list of ids that have changed.

        // if _updateDataView modified the dataset then
        // short circuit here, as no further processing is needed.
        if (_updateDataView()) return;

        if (! ids) return;

        var _rows = rows();
        var changedRows = _findRowsById(ids, _rows);
        if (changedRows.length) {
            // `$scope.rows` contains references to the
            // actual model objects that changed, so no need to
            // copy changes. Just tell angular to digest and 
            // it will update everything for us.
            asyncDigest($scope);
        }
    });

})
// end: AutomatonViewerCtrl


/**
 * AutomatonViewerRowDirective
 * directive: automatonViewerRow
 * 
 * Represents a single row within the automaton grid viewer.
 */
.directive('automatonViewerRow', function AutomatonViewerRowDirective() {

    function AutomatonViewerRowCtrl($scope) {
        // instantiated before link is called
        //console.log("AutomationViewerRow.ctrl", $scope.row);
    }

    function link($scope, $element, $attrs) {
        
        // Note: we don't use binding here for performance reasons.
        // Instead, the model maintains versioning on each row, and the 
        // parent component ensures that each row's version is included 
        // as part of the id value that is used by ng-repeat's "track by" 
        // feature. This ensures that rows will only be re-rendered when 
        // their version number has changed.  Since this will happen 
        // infrequently, it's sufficient to just re-render the entire row.

        var rowdata = $scope.row.data;
        var html = '';
        for (var i = 0; i < rowdata.length; ++i) {
            var attrs = '';
            if (rowdata[i]) {
                attrs = 'class="on"';
            }
            html += '<td ' + attrs + '></td>';
        }
        $element.empty().append(html);
    }

    return {
        restrict: 'A',
        controller: AutomatonViewerRowCtrl,
        link: link
    }
})
// end: AutomatonViewerRowDirective

/**
 * BrowserUtils
 *
 * A singleton class comprising various utilities related to the browser
 * environment.  
 */
.factory('BrowserUtils', function($window) {
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
                console.log("emit", arguments, handlerList);
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


