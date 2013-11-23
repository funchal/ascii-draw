/* jshint browser:true, strict:true, undef:true, unused:true */


var ascii_draw = (function() {
    'use strict';

    var me = {};

    var font_dimensions;

    var selected_cell = [0, 0];

    me.get_cell = function(coord) {
        var x, y;
        [x, y] = coord
        return drawingarea.rows[y].cells[x];
    }

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

    me.copyText = function(text) {
        var div = document.getElementById('copyarea');
        div.textContent = text;
        if (document.createRange) {
            var range = document.createRange();
            range.selectNodeContents(div);
            window.getSelection().addRange(range);
            console.log("copy " + text);
        } else {
            console.log("copy failed");
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

        ZeroClipboard.setDefaults({moviePath: 'lib/ZeroClipboard.swf'});
        var copy_button = document.getElementById('copy-button');
        var clipboard = new ZeroClipboard(copy_button);

        clipboard.on('load', function(client, args) {
            me.removeClass(copy_button, "disabled");
        });

        clipboard.on('dataRequested', function(client, args) {
            clip.setText("whatever text you want");
        });

        drawingarea.addEventListener('click', me.onClick, false);
    };

    me.onKeyDown = function(e) {
        var e = e || window.event;

        switch (e.keyCode) {
            case 37: // left arrow
                me.moveSelectedCell(-1, 0);
                break;
            case 38: // up arrow
                me.moveSelectedCell(0, -1);
                break;
            case 39: // right arrow
                me.moveSelectedCell(1, 0);
                break;
            case 40: // down arrow
                me.moveSelectedCell(0, 1);
                break;
        }
    }

    me.isPrintableKeyPress = function(evt) {
        if (typeof evt.which == "undefined") {
            // This is IE, which only fires keypress events for printable keys
            return true;
        } else if (typeof evt.which == "number" && evt.which > 0) {
            // In other browsers except old versions of WebKit, evt.which is
            // only greater than zero if the keypress is a printable key.
            // We need to filter out backspace and ctrl/alt/meta key combinations
            return !evt.ctrlKey && !evt.metaKey && !evt.altKey && evt.which != 8;
        }
        return false;
    }

    me.onKeyPress = function(e) {
        var e = e || window.event;

        if (e.keyCode == 13) {  // 'enter' key
            // TODO: move the selected cell to the cell immediately below the
            // first cell we entered text in.
            return;
        }

        var printable = me.isPrintableKeyPress(e);
        if (printable) {
            var cell = me.get_cell(selected_cell);
            cell.innerHTML = String.fromCharCode(e.charCode);
            me.moveSelectedCell(1, 0);
        }

        /* user pressed CTRL, prepare for copy/paste action */
        if (e.ctrlKey && !e.altKey && !e.shiftKey) {
            switch (e.keyCode) {
                case 67: /*CTRL+C*/
                    var text = 'example text';
                    me.copyText(text);
                    break;
                case 86: /*CTRL+V*/
                    me.pasteText(function(text) {
                        alert("pasted: " + text);
                    });
                    break;
            }
        }
        return true;
    };

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

            var cell = me.get_cell([x, y]);
            me.removeClass(cell, 'highlight');

            selected_cell = [new_x, new_y];

            var new_cell = me.get_cell([new_x, new_y]);
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
    window.addEventListener('keypress', me.onKeyPress, false);

    return me;
})();
