(function(angular) {
'use strict';

var automaton = angular.module('automaton', []);


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
automaton.directive('automatonViewer', function AutomatonViewerDirective(
        $window,
        BrowserUtils) {

    /** The template used to create the component's internal elements */
    var tpl = ' \
      <div class="atmn-grid-scroll"></div> \
      <table class="atmn-grid-content"> \
        <tr automaton-viewer-row ng-repeat="row in automatonViewer.rows track by automatonViewer.getRowUid(row)"></tr> \
      </table>';    

    /** The initial scope returned by this directive */
    var scope = {
        captureScroll: '&',
        automatonSize: '&'
    };

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

        instanceCount += 1;


        var root = $element;
        var scroll = root;
        var scrollSpacer = $element.find('.atmn-grid-scroll');
        // var scrollSpacer = $element.find('.atmn-grid-scroll div');
        var tbl = $element.find('table.atmn-grid-content');

        var stylesheet = null;
        var rootId;
        var paddingMetrics = {
            spaceX: 0, spaceY: 0,
            cellX: 0, cellY: 0
        };
        var layoutMetrics = {
            cellOuterSize: 0,
            maxRowCount: 0,
            maxTblHeight: 0,
            rowsPerScreen: 0,
            tblWidth: 0,
        };


        // one-time css setup

        root.css({
            overflow: 'scroll'
        });

        tbl.css({
            position: 'absolute',
            overflow: 'hidden',
            top: 0,
        });
    

        // root element must have an id.  if it doesn't, we'll add one
        // this is necessary because we later add a sylesheet which
        // needs to apply rules that are specific to this instance.
        rootId = root.attr('id');
        if (!rootId) {
            rootId = 'atmn-grid-'+instanceCount;
            root.attr('id', rootId);
        }

        // compute padding metrics only once when component is created
        paddingMetrics = BrowserUtils.getTablePaddingMetrics(tbl);


        // scope setup
        $scope.$watch($scope.captureScroll, function(val) {
            $controller.trackNewData(val);
        });

        $scope.$watch($scope.automatonSize, function(val) {
            $controller.automatonSize(val);
        })

        $scope.$watch('automatonViewer.automatonSize', function(val) {
            doLayout();
            updateScroll();
        });

        $scope.$watch('automatonViewer.trackNewData', function(val) {
            updateScroll();
        });

        $scope.$watch('automatonViewer.availableRowCount', function(val) {
            updateScroll();
        });


        // We need a few handlers directly on DOM events
        $($window).on('resize', BrowserUtils.debounce(function() {
            $scope.$apply(function() {
                doLayout();
                updateScroll();
            });
        }));

        root.on('click', 'td', function() {
            var row = $(this);
            var evt = {
                rowId : row.scope().row.id,
                colId : row.index()
            };
            $scope.$emit('automatonViewer.cellClicked', evt);
        })

        scroll.on('scroll', function() {
            $scope.$apply(updateScroll());
        });


        /**
         * updateScroll is called at runtime to adjust the component's
         * DOM elements based on the current state of the scroll, and
         * and changes that have occurred in the dataset, or related 
         * settings.
         */
        function updateScroll() {

            var _tmStart = BrowserUtils.now();
            var requestedScrollPos = scroll.scrollTop();
            var availableRowCount = $controller.availableRowCount();


            // adjust the scroll height if necessary
            var newScrollHeight = availableRowCount *
                    (layoutMetrics.cellOuterSize + paddingMetrics.spaceY) +
                    paddingMetrics.spaceY;
            if (newScrollHeight && scrollSpacer.height() !== newScrollHeight) {
                scrollSpacer.css('height', newScrollHeight + 'px');
            }


            // fix up the scroll position if trackNewData is enabled
            var trackNewData = $controller.trackNewData();
            var rootHeight = root.height();
            var rows = $controller.rows();


                var neededTopIdx = Math.floor(requestedScrollPos / 
                        (layoutMetrics.cellOuterSize + paddingMetrics.spaceY)) - 1;
                var actualTopIdx = rows.length ? rows[0].id : 0;


            if (trackNewData && rows.length > layoutMetrics.rowsPerScreen) {
                requestedScrollPos = newScrollHeight - rootHeight;
                scroll.scrollTop(requestedScrollPos);               
                // for tracking, the table always stays at the bottom
                tblTopPx = newScrollHeight - tbl.height();
            } else {

                // figure out what rows should now be visible, and request
                // them if they're not visible.

                if (neededTopIdx != actualTopIdx) {

                    $controller.windowPosition(
                            neededTopIdx + layoutMetrics.maxRowCount - 1);
                    rows = $scope.automatonViewer.rows;
                    actualTopIdx = rows.length ? rows[0].id : 0;
                }

                // now, put the table where it should be within the scroll
                var tblTopPx = actualTopIdx * 
                        (layoutMetrics.cellOuterSize + paddingMetrics.spaceY) + 
                        (scroll.scrollTop() - requestedScrollPos);
            } 

            if (tbl.css('top') !== tblTopPx) {
                tbl.css('top', tblTopPx + 'px');
            }

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

            var cellCountX = $controller.automatonSize();
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
            var rowsPerScreen = (rootHeight - padding.spaceY) /
                  (cellOuterSize + padding.spaceY);
            var maxRowCount = Math.ceil(rowsPerScreen) + 20;

            result.rowsPerScreen = rowsPerScreen;
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

            $controller.windowSize(result.maxRowCount);

            layoutMetrics = result;
        }
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
});
// end: AutomatonViewerDirective


/**
 * AutomatonViewerCtrl
 * 
 * Connects the AutomatonViewer to the AutomatonData service, and
 * manages runtime-configurable aspects of the AutomatonViewer. 
 * This controller is attached by the AutomatonViewerDirective.
 */
automaton.controller('AutomatonViewerCtrl', function AutomatonViewerCtrl(
      $scope,
      AutomatonModel) {

    // a new controller instance is created for each new instance of
    // the component in the page.

    var _viewModel = {
        trackNewData: true,
        rows: [],
        automatonSize: 0,
        getRowUid: getRowUid
    };   
    $scope.automatonViewer = _viewModel;


    // listen to the model, and respond when it changes
    AutomatonModel.on('changed', _handleModelChanged);

    $scope.$on('automatonViewer.cellClicked', function(evt, info) {
        var val = AutomatonModel.getCell(info.rowId, info.colId);
        val = (val) ? 0 : 1;
        AutomatonModel.setCell(info.rowId, info.colId, val);
        $scope.$apply();
    })


    /**
     * get/set values within the view model, which is available on
     * the scope.
     */
    function viewModel(name, val) {
        if (!name) return _viewModel; 
        if (val !== undefined) {
            _viewModel[name] = val;
        }
        return _viewModel[name];
    }

    /** 
     * get/set number of rows requested by the viewer.  This controller will
     * populate the data set with no more than this number of rows.  This 
     * is called by the directive as the size of the container changes.
     */
    var _windowSize = 0;
    function windowSize(val) {
        if (val !== undefined && _windowSize !== val) {
            _windowSize = val;
            _fetchData();
        }
        return _windowSize;
    }
    this.windowSize = windowSize;

    /**
     * get/set the index of the last row that should be placed in the 
     * data set. The full extents of the dataset are given by:
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
            _fetchData();
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
        val = viewModel('trackNewData');
        return val;
    }
    this.trackNewData = trackNewData;

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
    this.rows = rows;

    /**
     * the number of cells in the automaton data that will be rendered
     */
    function automatonSize(val) {
        if (val !== undefined) {
            viewModel('automatonSize', val);
        }
        return viewModel('automatonSize');
    }
    this.automatonSize = automatonSize;


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
    this.availableRowCount = availableRowCount;


    /**
     * gets a unique identifier for the given row object.  this identifier
     * is a composition of `row.id`, and `row.version`, which ensures that
     * it will change when the row object is updated.  This is used by
     * ng-repeat to prevent re-rendering unchanged elements unnecessarily. 
     */
    function getRowUid(row) {
        return row.id + ':' + row.version;
    }


    function _handleModelChanged(ids) {

        // `ids` is a list of ids that have changed.

        // first update the availableRowCount
        var hasNewRows = false;
        var _availableRowCount = availableRowCount();
        availableRowCount(AutomatonModel.getRowCount());
        if (availableRowCount() !== _availableRowCount) hasNewRows = true;
        _availableRowCount = availableRowCount();


        var _windowPosition = windowPosition();
        var _trackNewData = trackNewData();

        if (hasNewRows && _trackNewData) {

            if (_availableRowCount > _windowPosition) {
                // setting the window position will produce a fetch
                windowPosition(_availableRowCount);
                return;
            }
        }
        _fetchData();
    }

    /**
     * fetches a window-full of data based on the current state of the
     * control, and the model.  The data is populated into the `rows`
     * element of the viewmodel.
     */
    function _fetchData() {
        var _rows = rows();
        var _windowSize = windowSize();
        var _windowPosition = windowPosition();
        var availableRowCount = AutomatonModel.getRowCount();

        // figure out the range we need to fetch, and fetch it.
        var end = Math.min(_windowPosition, availableRowCount);
        var start = Math.max(0, end - _windowSize);
        var fetchedRows = AutomatonModel.getRange(start, end);

        // adjust the automaton size if it looks like that has changed
        var _size = 0;
        if (fetchedRows.length) {
            _size = fetchedRows[0].data.length;
        }
        if (_size > automatonSize() || _size === 0) {
            automatonSize(_size);
        }

        // store the fetched rows in the viewModel.
        rows(fetchedRows);
    }

});
// end: AutomatonViewerCtrl


/**
 * AutomatonViewerRowDirective
 * directive: automatonViewerRow
 * 
 * Represents a single row within the automaton grid viewer.
 */
automaton.directive('automatonViewerRow', function AutomatonViewerRowDirective() {

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
                attrs = 'class="atmn-grid-cell on"';
            } else {
                attrs = 'class="atmn-grid-cell"';
            }
            html += '<td ' + attrs + '></td>';
        }
        $element.empty().append(html);
    }

    return {
        restrict: 'A',
        link: link
    }
})
// end: AutomatonViewerRowDirective


})(angular);
