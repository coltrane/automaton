angular.module('automaton')

/**
 * AutomatonModel
 *
 * Manages the local store of automaton result data, and makes it available
 * to other components of the system.  The model stores a sequence of "rows"
 * where each row represents the state vector produced by a successive 
 * iteration of a 1-dimensional celular automaton.  Rows can be added only
 * at the end of the list, and the list can not be re-ordered.  Once a row
 * is added, it can not be removed, but rows can be modified in place.  When
 * a row is added, it is assigned an id and a version number.  The id
 * reflects the rows permanent position (`0` based) in the sequence of rows.
 * the version starts at `0`, and is incremented each time the row is
 * modified.  Though rows are added as simple vectors (arrays) of raw data,
 * they are stored, and returned, as objects with the following structure:
 *
 *     { id: <id>, version: <ver>, data: [<raw-data>] }
 *
 * The model supports addition of event listeners (via the `on()` method),
 * and will dispatch the `'changed'` event each time an element is changed,
 * or a batch of elements is added.
 *
 */
.factory('AutomatonModel', function AutomatonModel(
		BrowserUtils) {

	var data;

	/**
	 * Clears the stored data, and resets to initial state.
	 * Dispatches the `changed` event.
	 */
	function reset() {
		data = [];
		_changed();
	}

    /** 
     * Add a single row of data to the component.  `rowData` is an array
     * of numbers representing each of the values in the row to be added.
     */
    function appendRow(rowData) {
    	var newIdx = data.length;
        var row = _makeRow(newIdx, rowData);
        data.push(row);
        _changed([newIdx]);
    }

    function appendRows(batch) {
    	var nextIdx = data.length;
    	var changedIds = [];
    	for(var i = 0; i < batch.length; ++i) {
    		var row = _makeRow(nextIdx, batch[i]);
    		data.push(row);
    		changedIds.push(nextIdx);
    		nextIdx += 1;
    	}
    	_changed(changedIds);
    }
    
    /** Sets the data in the row at the indicated index **/
    function setRow(idx, rowData) {
        if (idx < 0 || idx > data.length - 1) {
            throw new RangeError("Index out of bounds.");
        }
        var row = data[idx].data = rowData;
        row.version += 1;
        data[idx] = { id: row.id, version: row.version, data: row.data };
        _changed([idx]);
    }
    
    /** Gets the data in the indicated row. **/
    function getRow(idx) {
        return data[idx];
    }

    /**
     * fetches an array of rows beginning with the row at `rowStartIdx`
     * and ending with the row at `(rowIdxEnd-1)`.  Works exactly like
     * `Array.slice`.
     */
    function getRange(rowIdxStart, rowIdxEnd) {
    	return data.slice(rowIdxStart, rowIdxEnd);
    }
    
    /** Sets the data in the indicated cell of the indicated row **/
    function setCell(rowIdx, cellIdx, value) {
        if (rowIdx < 0 || rowIdx > data.length-1) {
            throw new RangeError("Row index out of bounds.");
        }
        var row = data[rowIdx];
        if (cellIdx < 0 || cellIdx > row.length-1) {
            throw new RangeError("Cell index out of bounds.");
        }
        row.data[cellIdx] = value;
        row.version += 1;

        // this seems to be necessary in order to get ng-repeat to
        // recognize the change.
        data[rowIdx] = { id: row.id, version: row.version, data: row.data };

        _changed([rowIdx]);
    }
    
    /** Gets the data in the indicated cell of the indicated row **/
    function getCell(rowIdx, cellIdx) {
        var row = data[rowIdx];       
        if (!row) return undefined;
        return row.data[cellIdx];
    }

    /** Gets the number of rows present in the dataset **/
    function getRowCount() {
        return data.length;
    }


    function _makeRow(id, data) {
    	return { 
    		id: id,
    		version: 0,
    		data: data
    	};
    }

    /** emits the `'changed'` event **/
    function _changed(ids) {
    	emitter.emit('changed', ids);
    }


    /** public interface **/
	var AutomatonModel = {
		reset: reset,
		appendRow: appendRow,
		appendRows: appendRows,
		setRow: setRow,
		getRow: getRow,
		getRange: getRange,
		setCell: setCell,
		getCell: getCell,
		getRowCount: getRowCount,
	};
	var emitter = BrowserUtils.makeEmitter(AutomatonModel);

	reset();
	return AutomatonModel;
});