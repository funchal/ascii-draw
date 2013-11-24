/* jshint bitwise:true, browser:true, strict:true, undef:true, unused:true */
/* jshint curly:true, indent:4, forin:true, latedef:true, quotmark:single */
/* jshint trailing:true, maxlen:80, devel:true */

var ascii_draw = (function() {
    'use strict';

    var me = {};

    var font_dimensions;

    var selected_cell = [0, 0];

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
        var cell = drawingarea.rows[selected_cell[0]].cells[selected_cell[1]];
        addClass(cell, 'highlight');

        initClipboard();

        drawingarea.addEventListener('click', onClick, false);
    };

    var onKeyDown = function(event) {
        var e = event || window.event;

        switch (e.keyCode) {
            case 37: // left arrow
                moveSelectedCell(-1, 0);
                break;
            case 38: // up arrow
                moveSelectedCell(0, -1);
                break;
            case 39: // right arrow
                moveSelectedCell(1, 0);
                break;
            case 40: // down arrow
                moveSelectedCell(0, 1);
                break;
        }
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
            var cell = getCellAt(selected_cell);
            cell.innerHTML = String.fromCharCode(e.charCode);
            moveSelectedCell(1, 0);
        }

        /* user pressed CTRL, prepare for copy/paste action */
        if (e.ctrlKey && !e.altKey && !e.shiftKey) {
            switch (e.keyCode) {
                case 67: /*CTRL+C*/
                    copyAction(true /*is_keyboard*/);
                    break;
                case 86: /*CTRL+V*/
                    me.pasteText(function(text) {
                        alert('pasted: ' + text);
                    });
                    break;
            }
        }
        return true;
    };

    var moveSelectedCell = function(dx, dy) {
        var new_x = selected_cell[0] + dx;
        var new_y = selected_cell[1] + dy;

        if (0 <= new_y && 0 <= new_x) {
            // add rows and columns if necessary
            resizeTable(new_y+1, new_x+1, true);

            var cell = getCellAt(selected_cell);
            removeClass(cell, 'highlight');

            selected_cell = [new_x, new_y];

            var new_cell = getCellAt([new_x, new_y]);
            addClass(new_cell, 'highlight');
        }

        /* scroll to the selected cell */
        // FIXME this is bugged
        // drawingarea.rows[new_y].cells[new_x].scrollIntoView(false);
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

    var onClick = function(element) {
        var cell = element.target;
        var col = indexInParent(cell);
        var row = indexInParent(cell.parentElement);
        moveSelectedCell(col - selected_cell[0], row - selected_cell[1]);
    };

    window.addEventListener('load', onWindowLoad, false);
    window.addEventListener('keydown', onKeyDown, false);
    window.addEventListener('keypress', onKeyPress, false);

    return me;
})();
