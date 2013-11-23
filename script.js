/* jshint browser:true, strict:true, undef:true, unused:true */


var ascii_draw = (function() {
    'use strict';

    var me = {};

    var font_dimensions;

    var selected_cell = [0, 0];

    me.removeClass = function(elem, old_class) {
        var re = new RegExp('(?:^|\\s)' + old_class + '(?!\\S)', 'g');
        elem.className = elem.className.replace(re, '');
    }

    me.addClass = function(elem, new_class) {
        elem.className = elem.className + ' ' + new_class;
    }

    /* find the index of a given element in its parent */
    function indexInParent(element) {
        var children = element.parentElement.children;
        for (var i = 0; i < children.length; i++) {
             if (children[i] == element) {
                return i;
            }
        }
        return -1;
    }

    /* resize the table by adding or removing rows and columns */
    me.resize = function(new_rows, new_cols, grow_only) {
        var drawingarea = document.getElementById('drawingarea');

        var rows = drawingarea.rows.length;

        if (grow_only) {
            new_rows = Math.max(new_rows, rows);
        }

        if (new_rows < rows) {
            for (var i = rows - new_rows; i > 0; i--) {
                drawingarea.deleteRow(i);
            }
        } else if (new_rows > rows) {
            for (var i = 0; i < (new_rows - rows); i++) {
                drawingarea.insertRow();
            }
        }

        if (grow_only) {
            new_cols = Math.max(new_cols, drawingarea.rows[0].cells.length);
        }

        for (var i = 0; i < new_rows; i++) {
            var row = drawingarea.rows[i];
            var cols = row.cells.length;
            if (new_cols < cols) {
                for (var j = cols - new_cols; j > 0; j--) {
                    row.deleteCell(i);
                }
            } else {
                for (var j = 0; j < (new_cols - cols); j++) {
                    var cell = row.insertCell();
                    cell.style.width = font_dimensions[0]+'px';
                    cell.style.height = font_dimensions[1]+'px';
                    cell.appendChild(document.createTextNode(' '));
                }
            }
        }
    };

    me.onWindowLoad = function() {
        var drawingarea = document.getElementById('drawingarea');

        font_dimensions = me.getFontDimensions();

        // create cells in the drawing area table
        me.resize(25, 80, false);

        // hightlight selected cell
        var x, y;
        [x, y] = selected_cell;
        var cell = drawingarea.rows[x].cells[y];
        me.addClass(cell, 'highlight');

        drawingarea.addEventListener('click', me.onClick, false);
    };

    me.onKeyDown = function(e) {
        var e = e || window.event;

        [x, y] = selected_cell;

        if (e.keyCode == '37') {
            // left arrow
            me.moveSelectedCell(-1, 0);
        }
        else if (e.keyCode == '38') {
            // up arrow
            me.moveSelectedCell(0, -1);
        }
        else if (e.keyCode == '39') {
            // right arrow
            me.moveSelectedCell(1, 0);
        }
        else if (e.keyCode == '40') {
            // down arrow
            me.moveSelectedCell(0, 1);
        }
    }

    me.moveSelectedCell = function(dx, dy) {
        var x, y;
        [x, y] = selected_cell;
        var new_x = x + dx;
        var new_y = y + dy;
        var nrows = drawingarea.rows.length;
        var ncols = drawingarea.rows[0].cells.length;

        if (0 <= new_y && 0 <= new_x) {

            // add rows and columns if necessary
            me.resize(new_y+1, new_x+1, true);

            var cell = drawingarea.rows[y].cells[x];
            me.removeClass(cell, 'highlight');

            selected_cell = [new_x, new_y];

            var new_cell = drawingarea.rows[new_y].cells[new_x];
            me.addClass(new_cell, 'highlight');
        }

        /* scroll to the selected cell */
        // FIXME this is bugged
        // drawingarea.rows[new_y].cells[new_x].scrollIntoView(false);
    }

    me.getFontDimensions = function() {
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

    me.onClick = function(element) {
        var cell = element.target;
        var col = indexInParent(cell);
        var row = indexInParent(cell.parentElement);
        me.moveSelectedCell(col - selected_cell[0], row - selected_cell[1]);
    };

    window.addEventListener('load', me.onWindowLoad, false);
    window.addEventListener('keydown', me.onKeyDown, false);

    return me;
})();
