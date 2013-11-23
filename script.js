/* jshint browser:true, strict:true, undef: true, unused: true */

var ascii_draw = (function() {
    'use strict';

    var me = {};

    var font_dimensions;

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
        for (var r = 0; r < 5; r++) {
            me.addRow();
        }
        for (var c = 0; c < 8; c++) {
            me.addCol();
        }

    };

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

    return me;
})();
