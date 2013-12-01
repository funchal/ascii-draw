/* jshint bitwise:true, browser:true, strict:true, undef:true, unused:true */
/* jshint curly:true, indent:4, forin:true, latedef:true, quotmark:single */
/* jshint trailing:true, maxlen:80, devel:true */

var Mode = {Selection: 0, Rectangle: 1};


var ascii_draw = (function() {
    'use strict';

    var me = {};

    var mode = Mode.Selection;
    var start_selection = [0, 0];  // [row, col]
    var end_selection = [0, 0];  // [row, col]
    var selecting = false;

    // saved content of the drawing area.
    var committed_table = [];

    var getCellAt = function(coord) {
        var drawingarea = document.getElementById('drawingarea');
        return drawingarea.rows[coord[0]].cells[coord[1]];
    };

    var removeClass = function(elem, old_class) {
        var re = new RegExp('(?:^|\\s)' + old_class + '(?!\\S)', 'g');
        elem.className = elem.className.replace(re, '');
    };

    var addClass = function(elem, new_class) {
        elem.className = elem.className + ' ' + new_class;
    };

    /* find the index of a given element in its parent */
    var indexInParent = function(element) {
        var children = element.parentElement.children;
        for (var i = 0; i < children.length; i++) {
            if (children[i] == element) {
                return i;
            }
        }
        return -1;
    };

    /* resize the table by adding or removing rows and columns */
    var resizeTable = function(new_nrows, new_ncols, grow_only) {
        var drawingarea = document.getElementById('drawingarea');

        var nrows = drawingarea.rows.length;

        if (grow_only) {
            new_nrows = Math.max(new_nrows, nrows);
        }

        var i;
        if (new_nrows < nrows) {
            for (i = nrows - new_nrows; i > 0; i--) {
                drawingarea.deleteRow(i);
            }
        } else if (new_nrows > nrows) {
            for (i = 0; i < (new_nrows - nrows); i++) {
                drawingarea.insertRow();
            }
        }

        if (grow_only) {
            new_ncols = Math.max(new_ncols, drawingarea.rows[0].cells.length);
        }

        for (i = 0; i < new_nrows; i++) {
            var row = drawingarea.rows[i];
            var ncols = row.cells.length;
            var j;
            if (new_ncols < ncols) {
                for (j = ncols - new_ncols; j > 0; j--) {
                    row.deleteCell(i);
                }
            } else {
                for (j = 0; j < (new_ncols - ncols); j++) {
                    var cell = row.insertCell();
                    cell.appendChild(document.createTextNode(' '));
                }
            }
        }

        // also resize the committed table
        // I am not sure what we want to do if the table is shrinked.
        // Let's not delete data for now.
        nrows = committed_table.length;
        if (nrows > 0) {
            ncols = committed_table[0].length;
        } else {
            ncols = 0;
        }

        // add columns to existing rows
        if (new_ncols > ncols) {
            for (var r = 0; r < nrows; r++) {
                committed_table[r][new_ncols - 1] = undefined;
            }
        }
        // add rows
        for (var r = nrows; r < new_nrows; r++) {
            committed_table[r] = [];
            committed_table[r][new_ncols - 1] = undefined;
        }
    };

    var commitRectangle = function() {

    }

    /* return the selection content for copy */
    var getSelectionContent = function() {
        return 'content\ncontent\ncontent\ncontent\ncontent\ncontent\n' +
               'content\ncontent\ncontent\ncontent\ncontent\ncontent\n' +
               'content\ncontent\ncontent\ncontent\ncontent\ncontent\n' +
               'content\ncontent\ncontent\ncontent\ncontent\ncontent\n' +
               'content\ncontent\ncontent\ncontent\ncontent\ncontent\n';
    };

    var copyAction = function() {
        if (window.getSelection && document.createRange) {
            var copypastearea = document.getElementById('copypastearea');
            copypastearea.textContent = getSelectionContent();
            var sel = window.getSelection();
            var range = document.createRange();
            range.selectNodeContents(copypastearea);
            sel.removeAllRanges();
            sel.addRange(range);
        } else {
            console.log('fail to copy');
        }
    };

    var initiatePasteAction = function() {
        var copypastearea = document.getElementById('copypastearea');
        copypastearea.value = '';
        copypastearea.focus();
    };

    var completePasteAction = function() {
        var copypastearea = document.getElementById('copypastearea');
        console.log('paste: ' + copypastearea.value);
    };

    var onKeyUp = function(event) {
        var e = event || window.event;

        console.log('onKeyUp: ' + e.keyCode);
        if (e.ctrlKey && !e.altKey && !e.shiftKey) {
            switch (e.keyCode) {
                case 86: /*CTRL+V*/
                    completePasteAction();
                    break;
            }
        }
    };

    var onKeyDown = function(event) {
        var e = event || window.event;
        console.log('onKeyDown: ' + e.keyCode);

        var shift = null;
        switch (e.keyCode) {
            case 37: // left arrow
                shift = [0, -1];
                break;
            case 38: // up arrow
                shift = [-1, 0];
                break;
            case 39: // right arrow
                shift = [0, 1];
                break;
            case 40: // down arrow
                shift = [1, 0];
                break;
        }

        if (shift) {
            selecting = false;
            var new_selection = [end_selection[0] + shift[0],
                                 end_selection[1] + shift[1]];
            changeSelectedArea(new_selection, new_selection);
        }

        /* user pressed CTRL, prepare for copy/paste action */
        if (e.ctrlKey && !e.altKey && !e.shiftKey) {
            switch (e.keyCode) {
                case 67: /*CTRL+C*/
                    copyAction();
                    break;
                case 86: /*CTRL+V*/
                    initiatePasteAction();
                    break;
            }
        }
    };

    var onKeyPress = function(event) {
        var e = event || window.event;

        console.log('onKeyPress: ' + e.keyCode);
        if (e.keyCode == 13) {  // 'enter' key
            // TODO: move the selected cell to the cell immediately below the
            // first cell we entered text in.
            return;
        }

        var printable = isPrintableKeyPress(e);
        if (printable && mode == Mode.Selection) {
            var writeIntoCell = function(cell) {
                cell.textContent = String.fromCharCode(e.charCode);
            };
            applyToArea(start_selection, end_selection, writeIntoCell);
            commitCurrentSelection();

            // Move selected cell to the right if only one cell is selected.
            if (start_selection[0] == end_selection[0] &&
                    start_selection[1] == end_selection[1]) {
                var new_selection = [start_selection[0],
                                     start_selection[1] + 1];
                changeSelectedArea(new_selection, new_selection);
            }
        }
    };

    var init = function() {
        var drawingarea = document.getElementById('drawingarea');

        me.changeFontAction();

        // create cells in the drawing area table
        resizeTable(25, 80, false);

        // hightlight selected cell
        var cell = getCellAt(start_selection);
        addClass(cell, 'highlight');

        drawingarea.addEventListener('mousedown', onMouseDown, false);
        drawingarea.addEventListener('mouseup', onMouseUp, false);
        drawingarea.addEventListener('mouseover', onMouseOver, false);

        // keydown: A key is pressed down. Gives scan-code.
        window.addEventListener('keydown', onKeyDown, false);
        // keypress: A character key is pressed. Gives char-code.
        window.addEventListener('keypress', onKeyPress, false);
        window.addEventListener('keyup', onKeyUp, false);

        var rectangle_button = document.getElementById('rectangle-button');
        rectangle_button.addEventListener(
            'click', switchToRectangleMode, false);

        var selection_button = document.getElementById('selection-button');
        selection_button.addEventListener(
            'click', switchToSelectionMode, false);

    };

    var switchToRectangleMode = function() {
        if (mode == Mode.Selection) {
            var selection_button = document.getElementById('selection-button');
            removeClass(selection_button, 'pressed');
        }
        mode = Mode.Rectangle;
        var rectangle_button = document.getElementById('rectangle-button');
        addClass(rectangle_button, 'pressed');
    };

    var switchToSelectionMode = function() {
        if (mode == Mode.Rectangle) {
            var rectangle_button = document.getElementById('rectangle-button');
            removeClass(rectangle_button, 'pressed');
        }
        mode = Mode.Selection;
        var selection_button = document.getElementById('selection-button');
        addClass(selection_button, 'pressed');
    };

    var isPrintableKeyPress = function(evt) {
        if (typeof evt.which == 'undefined') {
            // This is IE, which only fires keypress events for printable keys
            return true;
        } else if (typeof evt.which == 'number' && evt.which > 0) {
            // In other browsers except old versions of WebKit, evt.which is
            // only greater than zero if the keypress is a printable key.
            // We need to filter out backspace and ctrl/alt/meta keys
            return !evt.ctrlKey && !evt.metaKey &&
                   !evt.altKey && evt.which != 8;
        }
        return false;
    };

    var drawRectangle = function(start_area, end_area) {
        var drawingarea = document.getElementById('drawingarea');
        var min_row = Math.min(start_area[0], end_area[0]);
        var max_row = Math.max(start_area[0], end_area[0]);
        var min_col = Math.min(start_area[1], end_area[1]);
        var max_col = Math.max(start_area[1], end_area[1]);

        // print first row: +---+
        var first_row = drawingarea.rows[min_row];
        first_row.cells[min_col].textContent = '+';
        for (var col = min_col + 1; col <= max_col - 1; col++) {
            first_row.cells[col].textContent = '-';
        }
        first_row.cells[max_col].textContent = '+';

        // print intermediate rows: |   |
        for (var row = min_row + 1; row <= max_row - 1; row++) {
            var current_row = drawingarea.rows[row];
            current_row.cells[min_col].textContent = '|';
            current_row.cells[max_col].textContent = '|';
        }

        // print last row
        var last_row = drawingarea.rows[max_row];
        last_row.cells[min_col].textContent = '+';
        for (var col = min_col + 1; col <= max_col - 1; col++) {
            last_row.cells[col].textContent = '-';
        }
        last_row.cells[max_col].textContent = '+';

    };

    var applyToArea = function(start_area, end_area, fun) {
        var drawingarea = document.getElementById('drawingarea');
        var min_row = Math.min(start_area[0], end_area[0]);
        var max_row = Math.max(start_area[0], end_area[0]);
        var min_col = Math.min(start_area[1], end_area[1]);
        var max_col = Math.max(start_area[1], end_area[1]);
        for (var r = min_row; r <= max_row; r++) {
            var row = drawingarea.rows[r];
            for (var c = min_col; c <= max_col; c++) {
                var cell = row.cells[c];
                fun(cell);
            }
        }
    };

    var commitCurrentSelection = function() {
        var drawingarea = document.getElementById('drawingarea');
        var min_row = Math.min(start_selection[0], end_selection[0]);
        var max_row = Math.max(start_selection[0], end_selection[0]);
        var min_col = Math.min(start_selection[1], end_selection[1]);
        var max_col = Math.max(start_selection[1], end_selection[1]);
        for (var r = min_row; r <= max_row; r++) {
            var row = drawingarea.rows[r];
            for (var c = min_col; c <= max_col; c++) {
                var cell = row.cells[c];
                committed_table[r][c] = cell.textContent;
            }
        }
    }

    var restoreArea = function(start_area, end_area) {

        console.log('restore ' + start_area + ' ' + end_area);
        var drawingarea = document.getElementById('drawingarea');
        var min_row = Math.min(start_area[0], end_area[0]);
        var max_row = Math.max(start_area[0], end_area[0]);
        var min_col = Math.min(start_area[1], end_area[1]);
        var max_col = Math.max(start_area[1], end_area[1]);

        for (var r = min_row; r <= max_row; r++) {
            var row = drawingarea.rows[r];
            for (var c = min_col; c <= max_col; c++) {
                var cell = row.cells[c];
                cell.textContent = committed_table[r][c];
            }
        }

    }

    var removeHighlight = function(cell) {
        removeClass(cell, 'highlight');
    };

    var addHighlight = function(cell) {
        addClass(cell, 'highlight');
    };

    var changeSelectedArea = function(new_start, new_end) {
        /*
         * update start_selection and end_selection and update cell highlight
         * If new_sart is undefined, does not update start_selection.
         */
        // un-highlight previous selection
        applyToArea(start_selection, end_selection, removeHighlight);

        // update start_selection and end_selection with the cell under cursor.
        start_selection = new_start || start_selection;
        end_selection = new_end;

        // highlight new selection
        applyToArea(start_selection, end_selection, addHighlight);
    };

    var changeRectangleArea = function(new_start, new_end) {
        // restore previous area
        restoreArea(start_selection, end_selection);
        applyToArea(start_selection, end_selection, removeHighlight);

        // update start_selection and end_selection with the cell under cursor.
        start_selection = new_start || start_selection;
        end_selection = new_end;

        // draw a rectangle on the new area
        applyToArea(start_selection, end_selection, addHighlight);
        drawRectangle(start_selection, end_selection);
    };

    var onMouseDown = function(element) {
        var cell = element.target;
        var col = indexInParent(cell);
        var row = indexInParent(cell.parentElement);

        switch (mode) {
            case Mode.Selection:
                selecting = true;
                changeSelectedArea([row, col], [row, col]);
                break;
            case Mode.Rectangle:
                selecting = true;
                changeSelectedArea([row, col], [row, col]);
                var drawingarea = document.getElementById('drawingarea');
                drawingarea.rows[row].cells[col].textContent = '+'; // angle
                break;
            default:
                console.log('Mouse down is not handled in this mode: ' + mode);
        }

    };

    var onMouseOver = function(element) {
        if (selecting) {
            var cell = element.target;
            var col = indexInParent(cell);
            var row = indexInParent(cell.parentElement);

            switch (mode) {
                case Mode.Selection:
                    changeSelectedArea(undefined, [row, col]);
                    break;
                case Mode.Rectangle:
                    changeRectangleArea(undefined, [row, col]);
                    break;
                default:
                    console.log('Mouse down is not handled in mode: ' + mode);
            }

            /* scroll to the selected cell */
            // FIXME this is bugged
            // drawingarea.rows[new_y].cells[new_x].scrollIntoView(false);
        }
    };

    var onMouseUp = function() {
        selecting = false;
        if (mode == Mode.Rectangle) {
            commitCurrentSelection();
        }
    };

    var changeStyleRule = function (selector, style, value) {
        var rules = document.styleSheets[0].cssRules ||
                    document.styleSheets[0].rules;

        var match = null;
        for (var i = 0; i != rules.length; i++) {
            if (rules[i].type === CSSRule.STYLE_RULE &&
                rules[i].selectorText == selector) {
                match = rules[i].style;
                break;
            }
        }

        if (match === null) {
            if (document.styleSheets[0].insertRule) {
                 document.styleSheets[0].insertRule(selector + ' {' + style +
                                                    ':' + value + "}",
                                                    rules.length);
            } else {
                document.styleSheets[0].addRule(selector, style + ':' + value);
            }
        } else {
            match[style] = value;
            console.log(value);
        }
    };

    me.changeFontAction = function() {
        changeStyleRule('td', 'width', 'auto');
        changeStyleRule('td', 'height', 'auto');

        var t = document.createElement('table');
        var row = t.insertRow();
        var cell = row.insertCell();
        cell.appendChild(document.createTextNode('M'));
        document.body.appendChild(t);

        changeStyleRule('td', 'width', cell.clientWidth + 'px');
        changeStyleRule('td', 'height', cell.clientHeight + 'px');

        document.body.removeChild(t);
    };

    window.addEventListener('load', init, false);

    return me;
})();
