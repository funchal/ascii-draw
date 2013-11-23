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

    me.addRow = function() {
        var drawingarea = document.getElementById('drawingarea');
        var row = drawingarea.insertRow();
        var length = drawingarea.rows[0].cells.length;
        for (var i = 0; i < length; i++) {
            var cell = row.insertCell();
            cell.style.width = font_dimensions[0]+'px';
            cell.style.height = font_dimensions[1]+'px';
            cell.appendChild(document.createTextNode(' '));
        }
    };

    me.addCol = function() {
        var drawingarea = document.getElementById('drawingarea');
        var length = drawingarea.rows.length;
        for (var i = 0; i < length; i++) {
            var row = drawingarea.rows[i];
            var cell = row.insertCell();
            cell.style.width = font_dimensions[0]+'px';
            cell.style.height = font_dimensions[1]+'px';
            cell.appendChild(document.createTextNode(''));
        }
    };

    me.onWindowLoad = function() {

        font_dimensions = me.getFontDimensions();

        // create cells in the drawing area table
        for (var r = 0; r < 20; r++) {
            me.addRow();
        }
        for (var c = 0; c < 80; c++) {
            me.addCol();
        }

        // hightlight the top left cell
        var cell = drawingarea.rows[0].cells[0];
        addClass(cell, 'highlight');
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
            for (var i = nrows; i <= new_y; i++) {
                me.addRow();
            }
            for (var i = ncols; i <= new_x; i++) {
                me.addCol();
            }

            var cell = drawingarea.rows[y].cells[x];
            me.removeClass(cell, 'highlight');

            selected_cell = [new_x, new_y];

            var new_cell = drawingarea.rows[new_y].cells[new_x];
            me.addClass(new_cell, 'highlight');
        }
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

    window.addEventListener('load', me.onWindowLoad, false);
    window.addEventListener('keydown', me.onKeyDown, false);

    return me;
})();
