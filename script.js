/* jshint bitwise:true, browser:true, strict:true, undef:true, unused:true */
/* jshint curly:true, indent:4, forin:true, latedef:true, quotmark:single */
/* jshint trailing:true, maxlen:80, devel:true */

var ascii_draw = (function() {
    'use strict';

    var me = {};

    var font_dimensions;

    var start_selection = [0, 0];
    var end_selection = [0, 0];
    var selecting = false;

    var getCellAt = function(coord) {
        var drawingarea = document.getElementById('drawingarea');
        return drawingarea.rows[coord[1]].cells[coord[0]];
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
    var resizeTable = function(new_rows, new_cols, grow_only) {
        var drawingarea = document.getElementById('drawingarea');

        var rows = drawingarea.rows.length;

        if (grow_only) {
            new_rows = Math.max(new_rows, rows);
        }

        var i;
        if (new_rows < rows) {
            for (i = rows - new_rows; i > 0; i--) {
                drawingarea.deleteRow(i);
            }
        } else if (new_rows > rows) {
            for (i = 0; i < (new_rows - rows); i++) {
                drawingarea.insertRow();
            }
        }

        if (grow_only) {
            new_cols = Math.max(new_cols, drawingarea.rows[0].cells.length);
        }

        for (i = 0; i < new_rows; i++) {
            var row = drawingarea.rows[i];
            var cols = row.cells.length;
            var j;
            if (new_cols < cols) {
                for (j = cols - new_cols; j > 0; j--) {
                    row.deleteCell(i);
                }
            } else {
                for (j = 0; j < (new_cols - cols); j++) {
                    var cell = row.insertCell();
                    cell.style.width = font_dimensions[0]+'px';
                    cell.style.height = font_dimensions[1]+'px';
                    cell.appendChild(document.createTextNode(' '));
                }
            }
        }
    };

    var keyboardCopyAction = function() {
        if (window.getSelection && document.createRange) {
            var div = document.getElementById('copyarea');
            div.textContent = 'content';
            var sel = window.getSelection();
            var range = document.createRange();
            range.selectNodeContents(div);
            sel.removeAllRanges();
            sel.addRange(range);
        } else {
            console.log("keyboardCopyAction failed");
        }
    };

    var mouseCopyAction = function() {
        console.log("mouseCopyAction failed");
    };

    var initClipboard = function() {
        /* load flash SWF */
        ZeroClipboard.setDefaults({moviePath: 'lib/ZeroClipboard.swf'});

        /* put the hidden SWF on top of the copy button */
        var copy_button = document.getElementById('copy-button');
        var clipboard = new ZeroClipboard();

        /* if the copy button is clicked, its because the SWF failed to load */
        copy_button.addEventListener('click', mouseCopyAction, false);

        /* when the SWF loads, enable the button */
        clipboard.on('load', function() {
            clipboard.glue(copy_button);
            removeClass(copy_button, 'disabled');
        });

        /* copy when the SWF requests data (because it has been clicked) */
        clipboard.on('dataRequested', function() {
            clipboard.setText('content');
        });
    };

    var onWindowLoad = function() {
        var drawingarea = document.getElementById('drawingarea');

        font_dimensions = getFontDimensions();

        // create cells in the drawing area table
        resizeTable(25, 80, false);

        // hightlight selected cell
        var cell = getCellAt(start_selection);
        addClass(cell, 'highlight');

        initClipboard();

        drawingarea.addEventListener('mousedown', onMouseDown, false);
        drawingarea.addEventListener('mouseup', onMouseUp, false);
        drawingarea.addEventListener('mouseover', onMouseOver, false);
    };

    var onKeyDown = function(event) {
        var e = event || window.event;
        var shift;
        switch (e.keyCode) {
            case 37: // left arrow
                shift = [-1, 0];
                break;
            case 38: // up arrow
                shift = [0, -1];
                break;
            case 39: // right arrow
                shift = [1, 0];
                break;
            case 40: // down arrow
                shift = [0, 1];
                break;
            default:
                // do nothing if the key is not an arrow
                return;
        }
        selecting = false;
        var new_selection = [end_selection[0] + shift[0],
                             end_selection[1] + shift[1]];
        changeSelectedArea(new_selection, new_selection);
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

    var onKeyPress = function(event) {
        var e = event || window.event;

        if (e.keyCode == 13) {  // 'enter' key
            // TODO: move the selected cell to the cell immediately below the
            // first cell we entered text in.
            return;
        }

        var printable = isPrintableKeyPress(e);
        if (printable) {
            var writeIntoCell = function(cell) {
                cell.innerHTML = String.fromCharCode(e.charCode);
            };
            applyToArea(start_selection, end_selection, writeIntoCell);

            // Move selected cell to the right if only one cell is selected.
            if (start_selection[0] == end_selection[0] &&
                    start_selection[1] == end_selection[1]) {
                var new_selection = [start_selection[0] + 1,
                                     start_selection[1]];
                changeSelectedArea(new_selection, new_selection);
            }
        }

        /* user pressed CTRL, prepare for copy/paste action */
        if (e.ctrlKey && !e.altKey && !e.shiftKey) {
            switch (e.keyCode) {
                case 67: /*CTRL+C*/
                    copyAction(true /*is_keyboard*/);
                    break;
                case 86: /*CTRL+V*/
                    pasteText(function(text) {
                        alert('pasted: ' + text);
                    });
                    break;
            }
        }
        return true;
    };

    var applyToArea = function(start_area, end_area, fun) {
        var min_x = Math.min(start_area[0], end_area[0]);
        var max_x = Math.max(start_area[0], end_area[0]);
        var min_y = Math.min(start_area[1], end_area[1]);
        var max_y = Math.max(start_area[1], end_area[1]);
        for (var x = min_x; x <= max_x; x++) {
            for (var y = min_y; y <= max_y; y++) {
                var cell = getCellAt([x, y]);
                fun(cell);
            }
        }
    };

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

    var onMouseDown = function(element) {
        var cell = element.target;
        var col = indexInParent(cell);
        var row = indexInParent(cell.parentElement);

        selecting = true;
        changeSelectedArea([col, row], [col, row]);
    };

    var onMouseOver = function(element) {
        if (selecting) {
            var cell = element.target;
            var col = indexInParent(cell);
            var row = indexInParent(cell.parentElement);

            changeSelectedArea(undefined, [col, row]);

            /* scroll to the selected cell */
            // FIXME this is bugged
            // drawingarea.rows[new_y].cells[new_x].scrollIntoView(false);
        }
    };

    var onMouseUp = function(element) {
        selecting = false;
    };

    var getFontDimensions = function() {
        var t = document.createElement('table');
        var row = t.insertRow();
        var cell = row.insertCell();
        cell.appendChild(document.createTextNode('M'));
        document.body.appendChild(t);

        var size =
            [
                cell.offsetWidth,
                cell.offsetHeight
            ];

        document.body.removeChild(t);

        return size;
    };

    window.addEventListener('load', onWindowLoad, false);

    // keydown: A key is pressed down. Gives scan-code.
    window.addEventListener('keydown', onKeyDown, false);

    // keypress: A character key is pressed. Gives char-code.
    window.addEventListener('keypress', onKeyPress, false);

    return me;
})();
