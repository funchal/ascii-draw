/* jshint browser:true, strict:true, undef: true, unused: true */

var ascii_draw = (function() {
    'use strict';

    var me = {};

    me.addRow = function() {
        var drawingarea = document.getElementById('drawingarea');
        var row = drawingarea.insertRow();
        var length = drawingarea.rows[0].cells.length;
        for (var i = 0; i < length; i++) {
            var cell = row.insertCell();
            cell.appendChild(document.createTextNode('b'));
        }
    };

    me.addCol = function() {
        var drawingarea = document.getElementById('drawingarea');
        var length = drawingarea.rows.length;
        for (var i = 0; i < length; i++) {
            var row = drawingarea.rows[i];
            var cell = row.insertCell();
            cell.appendChild(document.createTextNode('b'));
        }
    };

    me.onWindowLoad = function() {
        for (var r = 0; r < 25; r++) {
            me.addRow();
        }
        for (var c = 0; c < 80; c++) {
            me.addCol();
        }
    };

    window.addEventListener('load', me.onWindowLoad, false);

    return me;
})();