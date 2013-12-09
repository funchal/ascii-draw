'use strict';
var utils;
(function (utils) {
    function changeStyleRule(selector, style, value) {
        var stylesheet = document.styleSheets[0];
        var rules = stylesheet.cssRules || stylesheet.rules;
        var match = null;

        if (rules !== null) {
            for (var i = 0; i != rules.length; i++) {
                if (rules[i].type === CSSRule.STYLE_RULE) {
                    var style_rule = rules[i];
                    if (style_rule.selectorText == selector) {
                        match = style_rule.style;
                        break;
                    }
                }
            }
        }

        if (match === null) {
            if (stylesheet.insertRule && rules !== null) {
                stylesheet.insertRule(selector + ' {' + style + ':' + value + '}', rules.length);
            } else {
                stylesheet.addRule(selector, style + ':' + value);
            }
        } else {
            match[style] = value;
        }
    }
    utils.changeStyleRule = changeStyleRule;

    function stacktrace() {
        console.log(new Error().stack);
    }
    utils.stacktrace = stacktrace;

    function computeFontSize() {
        var tmp = document.createElement('table');
        var row = tmp.insertRow();
        var cell = row.insertCell();
        cell.textContent = 'X';
        document.body.appendChild(tmp);
        var w = cell.clientWidth;
        var h = cell.clientHeight;
        document.body.removeChild(tmp);
        return { width: w, height: h };
    }
    utils.computeFontSize = computeFontSize;

    function addClass(elem, new_class) {
        elem.className = elem.className + ' ' + new_class;
    }
    utils.addClass = addClass;

    function removeClass(elem, old_class) {
        var re = new RegExp('(?:^|\\s)' + old_class + '(?!\\S)', 'g');
        elem.className = elem.className.replace(re, '');
    }
    utils.removeClass = removeClass;

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
    utils.indexInParent = indexInParent;

    var Point = (function () {
        function Point(row, col) {
            if (typeof row === "undefined") { row = 0; }
            if (typeof col === "undefined") { col = 0; }
            this.row = row;
            this.col = col;
        }
        Point.prototype.toString = function () {
            return this.row + 'x' + this.col;
        };

        Point.prototype.isEqual = function (other) {
            return (this.row == other.row && this.col == other.col);
        };
        return Point;
    })();
    utils.Point = Point;

    var Rectangle = (function () {
        function Rectangle(top_left, bottom_right, normalize) {
            this.top_left = top_left;
            this.bottom_right = bottom_right;
            if (normalize) {
                if (this.top_left.row > this.bottom_right.row) {
                    var tmp = this.top_left.row;
                    this.top_left = new Point(this.bottom_right.row, this.top_left.col);
                    this.bottom_right = new Point(tmp, this.bottom_right.col);
                }
                if (this.top_left.col > this.bottom_right.col) {
                    var tmp = this.top_left.col;
                    this.top_left = new Point(this.top_left.row, this.bottom_right.col);
                    this.bottom_right = new Point(this.bottom_right.row, tmp);
                }
            }
        }
        Rectangle.prototype.intersect = function (other) {
            var top_left = new Point(Math.max(this.top_left.row, other.top_left.row), Math.max(this.top_left.col, other.top_left.col));
            var bottom_right = new Point(Math.min(this.bottom_right.row, other.bottom_right.row), Math.min(this.bottom_right.col, other.bottom_right.col));
            return new Rectangle(top_left, bottom_right);
        };

        Rectangle.prototype.getHeight = function () {
            // Warning: can be < 0 if this.isEmpty()
            return this.bottom_right.row - this.top_left.row + 1;
        };

        Rectangle.prototype.getWidth = function () {
            // Warning: can be < 0 if this.isEmpty()
            return this.bottom_right.col - this.top_left.col + 1;
        };

        Rectangle.prototype.isEmpty = function () {
            return (this.top_left.row > this.bottom_right.row) || (this.top_left.col > this.bottom_right.col);
        };

        Rectangle.prototype.isEqual = function (other) {
            return (this.top_left.isEqual(other.top_left) && this.bottom_right.isEqual(other.bottom_right));
        };

        /* Return the difference of this with other as a list of Rectangles.
        Examples:
        this (o), other (x), top (T), left (L), right (R), bottom (B)
        
        this      other     diff
        
        oooooo    ------    TTTTTT
        oooooo    ------    TTTTTT
        oooooo    --xx--    LL  RR
        oooooo    --xx--    LL  RR
        oooooo    ------    BBBBBB
        oooooo    ------    BBBBBB
        
        
        oooooo    ------    TTTTTT
        oooooo    ------    TTTTTT
        oooooo    --xxxx    LL
        oooooo    --xxxx    LL
        oooooo    --xxxx    LL
        oooooo    --xxxx    LL
        xxxx
        xxxx
        
        
        oooooo    xx----      RRRR
        oooooo    ------    BBBBBB
        oooooo    ------    BBBBBB
        oooooo    ------    BBBBBB
        oooooo    ------    BBBBBB
        oooooo    ------    BBBBBB
        
        */
        Rectangle.prototype.subtract = function (other) {
            var rect_array = [];
            if (this.isEmpty()) {
                return rect_array;
            }

            if (other.isEmpty()) {
                rect_array.push(this);
                return rect_array;
            }

            var top_rectangle = new Rectangle(this.top_left, new Point(other.top_left.row - 1, this.bottom_right.col));
            if (!top_rectangle.isEmpty()) {
                rect_array.push(top_rectangle);
            }

            var left_rectangle = new Rectangle(new Point(other.top_left.row, this.top_left.col), new Point(other.bottom_right.row, other.top_left.col - 1));
            if (!left_rectangle.isEmpty()) {
                rect_array.push(left_rectangle);
            }

            var right_rectangle = new Rectangle(new Point(other.top_left.row, other.bottom_right.col + 1), new Point(other.bottom_right.row, this.bottom_right.col));
            if (!right_rectangle.isEmpty()) {
                rect_array.push(right_rectangle);
            }

            var bottom_rectangle = new Rectangle(new Point(other.bottom_right.row + 1, this.top_left.col), this.bottom_right);
            if (!bottom_rectangle.isEmpty()) {
                rect_array.push(bottom_rectangle);
            }
            return rect_array;
        };

        Rectangle.prototype.toString = function () {
            return this.top_left + '/' + this.bottom_right;
        };
        return Rectangle;
    })();
    utils.Rectangle = Rectangle;

    (function (commands) {
        var history = [];
        var limit = 100;
        var current = 0;

        function invoke(cmd) {
            history.splice(current, history.length - current, cmd);
            if (history.length > limit) {
                history.shift();
                current--;
            }
            redo();
        }
        commands.invoke = invoke;

        function undo() {
            if (canUndo()) {
                current--;
                history[current].unexecute();
            }
        }
        commands.undo = undo;

        function redo() {
            if (canRedo()) {
                history[current].execute();
                current++;
            }
        }
        commands.redo = redo;

        function canUndo() {
            return (current > 0);
        }
        commands.canUndo = canUndo;

        function canRedo() {
            return (current < history.length);
        }
        commands.canRedo = canRedo;
    })(utils.commands || (utils.commands = {}));
    var commands = utils.commands;
})(utils || (utils = {}));
'use strict';
var ascii_draw;
(function (ascii_draw) {
    (function (grid) {
        var CellPosition = utils.Point;

        grid.container;
        var nrows = 0;
        var ncols = 0;

        ;
        ;

        function init() {
            grid.container = document.getElementById('grid');
            changeFont();
            setSize(50, 120);
        }
        grid.init = init;

        function getRow(index) {
            return grid.container.children[index];
        }
        grid.getRow = getRow;

        function getCell(index, row) {
            return row.children[index];
        }
        grid.getCell = getCell;

        function getCellPosition(cell) {
            return new CellPosition(utils.indexInParent(cell.parentElement), utils.indexInParent(cell));
        }
        grid.getCellPosition = getCellPosition;

        function getTargetCell(target) {
            if (target instanceof HTMLSpanElement) {
                return target;
            } else {
                return null;
            }
        }
        grid.getTargetCell = getTargetCell;

        function setSize(new_nrows, new_ncols) {
            for (var r = nrows; r < new_nrows; r++) {
                grid.container.appendChild(document.createElement('div'));
            }

            for (var r = nrows; r > new_nrows; r--) {
                grid.container.removeChild(grid.container.children[r]);
            }

            for (var r = 0; r < new_nrows; r++) {
                var row = getRow(r);
                for (var c = ncols; c < new_ncols; c++) {
                    var cell = row.appendChild(document.createElement('span'));
                    cell.textContent = ascii_draw.emptyCell;
                }

                for (var c = ncols; c > new_ncols; c--) {
                    row.removeChild(row.children[r]);
                }
            }

            nrows = new_nrows;
            ncols = new_ncols;

            ascii_draw.gridstatus.textContent = 'Grid size: ' + nrows + 'x' + ncols + ' (' + nrows * ncols + ')';
        }

        function changeFont() {
            utils.changeStyleRule('#grid span', 'width', 'auto');
            utils.changeStyleRule('#grid span', 'height', 'auto');
            utils.changeStyleRule('#grid div', 'height', 'auto');

            var font_size = utils.computeFontSize();

            utils.changeStyleRule('#grid span', 'width', font_size.width + 'px');
            utils.changeStyleRule('#grid span', 'height', font_size.height + 'px');
            utils.changeStyleRule('#grid div', 'height', font_size.height + 'px');
        }
    })(ascii_draw.grid || (ascii_draw.grid = {}));
    var grid = ascii_draw.grid;
})(ascii_draw || (ascii_draw = {}));
'use strict';
var ascii_draw;
(function (ascii_draw) {
    (function (selection) {
        var Rectangle = utils.Rectangle;

        var contents = [];

        function clear() {
            for (var i = contents.length; i > 0; i--) {
                remove(i - 1);
            }
        }
        selection.clear = clear;

        /* must not overlap any existing selection */
        function add(sel) {
            ascii_draw.applyToRectangle(sel, setSelected, true);
            contents.push(sel);
        }
        selection.add = add;

        function remove(index) {
            ascii_draw.applyToRectangle(contents[index], setSelected, false);
            contents.splice(index, 1);
        }
        selection.remove = remove;

        function getContents() {
            return 'content\ncontent\ncontent\ncontent\ncontent\ncontent\n';
        }
        selection.getContents = getContents;

        function setSelected(cell, selected) {
            if (cell['data-selected'] !== selected) {
                cell['data-selected'] = selected;
                if (selected) {
                    utils.addClass(cell, 'selected');
                } else {
                    utils.removeClass(cell, 'selected');
                }
            } else {
                console.log('selected');
            }
        }
        selection.setSelected = setSelected;
    })(ascii_draw.selection || (ascii_draw.selection = {}));
    var selection = ascii_draw.selection;
})(ascii_draw || (ascii_draw = {}));
///<reference path='utils.ts'/>
///<reference path='grid.ts'/>
///<reference path='selection.ts'/>
'use strict';
var ascii_draw;
(function (ascii_draw) {
    (function (controllers) {
        var Rectangle = utils.Rectangle;
        var CellPosition = utils.Point;

        (function (RectangleController) {
            function init() {
                console.log('init');
                reset();
            }
            RectangleController.init = init;

            function reset() {
                console.log('reset');
                utils.addClass(ascii_draw.rectangle_button, 'pressed');
            }
            RectangleController.reset = reset;

            function onMouseDown(target) {
                // TODO: if current cell is highlighted change to move mode
                highlighting = true;
                setHollowHighlight(ascii_draw.grid.getCellPosition(target), ascii_draw.grid.getCellPosition(target));
                drawRectangle(new Rectangle(controllers.begin_highlight, controllers.end_highlight, true));
            }
            RectangleController.onMouseDown = onMouseDown;

            function onMouseUp() {
                highlighting = false;
            }
            RectangleController.onMouseUp = onMouseUp;

            function onMouseOver(target) {
                var pos = ascii_draw.grid.getCellPosition(target);
                setMousePosition(pos);
                if (highlighting) {
                    setHollowHighlight(controllers.begin_highlight, pos);
                    drawRectangle(new Rectangle(controllers.begin_highlight, controllers.end_highlight, true));
                }
            }
            RectangleController.onMouseOver = onMouseOver;

            function onMouseLeave() {
                setMousePosition(null);
            }
            RectangleController.onMouseLeave = onMouseLeave;

            function onArrowDown(displacement) {
                // Do nothing
            }
            RectangleController.onArrowDown = onArrowDown;

            function onKeyPress(character) {
                var rect_pieces = getHollowRectangle(new Rectangle(controllers.begin_highlight, controllers.end_highlight, true));
                for (var piece = 0; piece < rect_pieces.length; piece++) {
                    ascii_draw.applyToRectangle(rect_pieces[piece], writeToCell, character);
                }
                if (controllers.begin_highlight.isEqual(controllers.end_highlight)) {
                    var displacement = [0, 1];
                    var pos = new CellPosition(controllers.begin_highlight.row + displacement[0], controllers.begin_highlight.col + displacement[1]);
                    controllers.setHighlight(pos, pos);
                }
            }
            RectangleController.onKeyPress = onKeyPress;

            function exit() {
                console.log('exit');
                utils.removeClass(ascii_draw.rectangle_button, 'pressed');
                setHollowHighlight(controllers.begin_highlight, controllers.begin_highlight);
            }
            RectangleController.exit = exit;

            function drawRectangle(rect) {
                var top = rect.top_left.row;
                var left = rect.top_left.col;
                var bottom = rect.bottom_right.row;
                var right = rect.bottom_right.col;

                // print first row: +---+
                var first_row = ascii_draw.grid.getRow(top);
                writeToCell(ascii_draw.grid.getCell(left, first_row), '+');
                for (var col = left + 1; col <= right - 1; col++) {
                    writeToCell(ascii_draw.grid.getCell(col, first_row), '-');
                }
                writeToCell(ascii_draw.grid.getCell(right, first_row), '+');

                for (var row = top + 1; row <= bottom - 1; row++) {
                    var current_row = ascii_draw.grid.getRow(row);
                    writeToCell(ascii_draw.grid.getCell(left, current_row), '|');
                    writeToCell(ascii_draw.grid.getCell(right, current_row), '|');
                }

                // print last row
                var last_row = ascii_draw.grid.getRow(bottom);
                writeToCell(ascii_draw.grid.getCell(left, last_row), '+');
                for (var col = left + 1; col <= right - 1; col++) {
                    writeToCell(ascii_draw.grid.getCell(col, last_row), '-');
                }
                writeToCell(ascii_draw.grid.getCell(right, last_row), '+');
            }
        })(controllers.RectangleController || (controllers.RectangleController = {}));
        var RectangleController = controllers.RectangleController;

        (function (SelectMoveController) {
            function init() {
                reset();
                controllers.begin_highlight = new CellPosition(0, 0);
                controllers.end_highlight = controllers.begin_highlight;
                ascii_draw.selection.clear();
                ascii_draw.selection.add(new Rectangle(controllers.begin_highlight, controllers.end_highlight, true));
            }
            SelectMoveController.init = init;

            function reset() {
                utils.addClass(ascii_draw.selection_button, 'pressed');
            }
            SelectMoveController.reset = reset;

            function onMouseDown(target) {
                // TODO: if current cell is highlighted change to move mode
                highlighting = true;
                controllers.setHighlight(ascii_draw.grid.getCellPosition(target), ascii_draw.grid.getCellPosition(target));
            }
            SelectMoveController.onMouseDown = onMouseDown;

            function onMouseUp() {
                if (highlighting) {
                    //commands.invoke(new ChangeHighlight(begin_highlight, end_highlight));
                    var new_selection = new Rectangle(controllers.begin_highlight, controllers.end_highlight, true);
                    controllers.setHighlight(new CellPosition(0, 0), new CellPosition(0, 0));
                    highlighting = false;

                    ascii_draw.selection.clear();
                    ascii_draw.selection.add(new_selection);
                }
            }
            SelectMoveController.onMouseUp = onMouseUp;

            function onMouseOver(target) {
                var pos = ascii_draw.grid.getCellPosition(target);
                setMousePosition(pos);
                if (highlighting) {
                    controllers.setHighlight(controllers.begin_highlight, pos);
                }
            }
            SelectMoveController.onMouseOver = onMouseOver;

            function onMouseLeave() {
                setMousePosition(null);
            }
            SelectMoveController.onMouseLeave = onMouseLeave;

            function onArrowDown(displacement) {
                var pos = new CellPosition(controllers.begin_highlight.row + displacement[0], controllers.begin_highlight.col + displacement[1]);
                controllers.setHighlight(pos, pos);
            }
            SelectMoveController.onArrowDown = onArrowDown;
            function onKeyPress(character) {
                ascii_draw.applyToRectangle(new Rectangle(controllers.begin_highlight, controllers.end_highlight, true), writeToCell, character);
                if (controllers.begin_highlight.isEqual(controllers.end_highlight)) {
                    var displacement = [0, 1];
                    var pos = new CellPosition(controllers.begin_highlight.row + displacement[0], controllers.begin_highlight.col + displacement[1]);
                    controllers.setHighlight(pos, pos);
                }
            }
            SelectMoveController.onKeyPress = onKeyPress;

            function exit() {
                utils.removeClass(ascii_draw.selection_button, 'pressed');
                controllers.setHighlight(controllers.begin_highlight, controllers.begin_highlight);
            }
            SelectMoveController.exit = exit;
        })(controllers.SelectMoveController || (controllers.SelectMoveController = {}));
        var SelectMoveController = controllers.SelectMoveController;

        controllers.begin_highlight;
        controllers.end_highlight;

        var highlighting = false;
        var mouse_pos = null;

        controllers.current = SelectMoveController;

        function swap(new_controller) {
            return function () {
                controllers.current.exit();
                controllers.current = new_controller;
                controllers.current.reset();
            };
        }
        controllers.swap = swap;

        function init() {
            controllers.current.init();
        }
        controllers.init = init;

        function setMousePosition(new_pos) {
            if (mouse_pos !== null) {
                var cell = ascii_draw.grid.getCell(mouse_pos.col, ascii_draw.grid.getRow(mouse_pos.row));
                utils.removeClass(cell, 'mouse');
            }
            mouse_pos = new_pos;

            var mousestatus = document.getElementById('mousestatus');
            if (mouse_pos !== null) {
                var cell = ascii_draw.grid.getCell(mouse_pos.col, ascii_draw.grid.getRow(mouse_pos.row));
                utils.addClass(cell, 'mouse');
                mousestatus.textContent = 'Cursor: ' + mouse_pos;
            } else {
                mousestatus.textContent = '';
            }
        }

        function setHighlight(new_begin_highlight, new_end_highlight) {
            var new_highlight = new Rectangle(new_begin_highlight, new_end_highlight, true);
            var old_highlight = new Rectangle(controllers.begin_highlight, controllers.end_highlight, true);

            if (old_highlight.isEqual(new_highlight)) {
                return;
            }

            controllers.begin_highlight = new_begin_highlight;
            controllers.end_highlight = new_end_highlight;

            var keep = old_highlight.intersect(new_highlight);
            var clear = old_highlight.subtract(keep);
            var paint = new_highlight.subtract(keep);

            for (var i = 0; i < paint.length; i++) {
                ascii_draw.applyToRectangle(paint[i], setHighlighted, true);
            }

            for (var i = 0; i < clear.length; i++) {
                ascii_draw.applyToRectangle(clear[i], setHighlighted, false);
            }

            if (new_highlight.getHeight() > 1 || new_highlight.getWidth() > 1) {
                ascii_draw.selectionstatus.textContent = 'Highlight: ' + new_highlight.getHeight() + 'x' + new_highlight.getWidth();
            } else {
                ascii_draw.selectionstatus.textContent = '';
            }
        }
        controllers.setHighlight = setHighlight;

        function getHollowRectangle(rect) {
            var inside_rect = new Rectangle(new CellPosition(rect.top_left.row + 1, rect.top_left.col + 1), new CellPosition(rect.bottom_right.row - 1, rect.bottom_right.col - 1));
            var surrounding = rect.subtract(inside_rect);
            return surrounding;
        }

        function setHollowHighlight(new_begin_highlight, new_end_highlight) {
            var new_highlight = new Rectangle(new_begin_highlight, new_end_highlight, true);
            var old_highlight = new Rectangle(controllers.begin_highlight, controllers.end_highlight, true);

            if (old_highlight.isEqual(new_highlight)) {
                return;
            }

            controllers.begin_highlight = new_begin_highlight;
            controllers.end_highlight = new_end_highlight;

            var rect_pieces = getHollowRectangle(old_highlight);
            for (var piece = 0; piece < rect_pieces.length; piece++) {
                ascii_draw.applyToRectangle(rect_pieces[piece], setHighlighted, false);
            }
            rect_pieces = getHollowRectangle(new_highlight);
            for (var piece = 0; piece < rect_pieces.length; piece++) {
                ascii_draw.applyToRectangle(rect_pieces[piece], setHighlighted, true);
            }
            var selectionstatus = document.getElementById('selectionstatus');
            if (new_highlight.getHeight() > 1 || new_highlight.getWidth() > 1) {
                selectionstatus.textContent = 'Highlight: ' + new_highlight.getHeight() + 'x' + new_highlight.getWidth();
            } else {
                selectionstatus.textContent = '';
            }
        }

        function writeToCell(cell, character) {
            cell.textContent = character;
        }

        function setHighlighted(cell, highlighted) {
            if (cell['data-highlighted'] !== highlighted) {
                cell['data-highlighted'] = highlighted;
                if (highlighted) {
                    utils.addClass(cell, 'highlighted');
                } else {
                    utils.removeClass(cell, 'highlighted');
                }
            } else {
                console.log('highlighted');
            }
        }
    })(ascii_draw.controllers || (ascii_draw.controllers = {}));
    var controllers = ascii_draw.controllers;
})(ascii_draw || (ascii_draw = {}));
///<reference path='controllers.ts'/>
///<reference path='utils.ts'/>
'use strict';
var ascii_draw;
(function (ascii_draw) {
    var Rectangle = utils.Rectangle;
    var CellPosition = utils.Point;
    var SelectMoveController = ascii_draw.controllers.SelectMoveController;
    var RectangleController = ascii_draw.controllers.RectangleController;
    var commands = utils.commands;

    var copypastearea;

    ascii_draw.selection_button;
    ascii_draw.rectangle_button;
    var redo_button;
    var undo_button;

    ascii_draw.gridstatus;
    ascii_draw.mousestatus;
    ascii_draw.selectionstatus;

    ascii_draw.emptyCell = ' ';

    function initiateCopyAction() {
        if (window.getSelection && document.createRange) {
            copypastearea.textContent = ascii_draw.selection.getContents();
            var sel = window.getSelection();
            var range = document.createRange();
            range.selectNodeContents(copypastearea);
            sel.removeAllRanges();
            sel.addRange(range);
        } else {
            console.log('fail to copy');
        }
    }

    function completeCopyAction() {
        copypastearea.value = '';
        console.log('copy');
    }

    function initiatePasteAction() {
        copypastearea.value = '';
        copypastearea.focus();
    }

    function completePasteAction() {
        console.log('paste: ' + copypastearea.value);
        copypastearea.value = '';
    }

    function onUndo() {
        commands.undo();
        updateUndoRedo();
    }

    function onRedo() {
        commands.redo();
        updateUndoRedo();
    }

    function updateUndoRedo() {
        if (commands.canUndo()) {
            undo_button.disabled = false;
        } else {
            undo_button.disabled = true;
        }

        if (commands.canRedo()) {
            redo_button.disabled = false;
        } else {
            redo_button.disabled = true;
        }
    }

    function onKeyUp(event) {
        if (event.ctrlKey && !event.altKey && !event.shiftKey) {
            switch (event.keyCode) {
                case 67:
                    completeCopyAction();
                    break;
                case 86:
                    completePasteAction();
                    break;
                case 88:
                    completeCopyAction();
                    break;
            }
        }
        event.stopPropagation();
    }

    function onKeyPress(event) {
        if (!event.ctrlKey && !event.altKey && !event.metaKey && event.charCode > 0) {
            ascii_draw.controllers.current.onKeyPress(String.fromCharCode(event.charCode));
            event.preventDefault();
        }
        event.stopPropagation();
    }

    function onKeyDown(event) {
        if (!event.ctrlKey && !event.altKey && !event.shiftKey && !event.metaKey) {
            var displacement = null;
            switch (event.keyCode) {
                case 37:
                    displacement = [0, -1];
                    event.preventDefault();
                    break;
                case 38:
                    displacement = [-1, 0];
                    event.preventDefault();
                    break;
                case 39:
                    displacement = [0, 1];
                    event.preventDefault();
                    break;
                case 40:
                    displacement = [1, 0];
                    event.preventDefault();
                    break;
                case 9:
                    event.preventDefault();
                    break;
                case 13:
                    event.preventDefault();
                    break;
                case 8:
                    // TODO: print a space character
                    event.preventDefault();
                    break;
                case 27:
                    event.preventDefault();
                    break;
                case 46:
                    event.preventDefault();
                    break;
            }

            if (displacement && ascii_draw.controllers.begin_highlight.isEqual(ascii_draw.controllers.end_highlight)) {
                ascii_draw.controllers.current.onArrowDown(displacement);
            }
        }

        if (event.ctrlKey && !event.altKey && !event.shiftKey && !event.metaKey) {
            switch (event.keyCode) {
                case 67:
                    initiateCopyAction();
                    break;
                case 86:
                    initiatePasteAction();
                    break;
                case 88:
                    initiateCopyAction();
                    break;
                case 89:
                    onRedo();
                    break;
                case 90:
                    onUndo();
                    break;
            }
        }
        event.stopPropagation();
    }

    function applyToRectangle(rect, functor, param) {
        for (var r = rect.top_left.row; r <= rect.bottom_right.row; r++) {
            var row = ascii_draw.grid.getRow(r);
            for (var c = rect.top_left.col; c <= rect.bottom_right.col; c++) {
                var cell = ascii_draw.grid.getCell(c, row);
                functor(cell, param);
            }
        }
    }
    ascii_draw.applyToRectangle = applyToRectangle;

    function onMouseDown(event) {
        var target = ascii_draw.grid.getTargetCell(event.target);
        if (target !== null) {
            ascii_draw.controllers.current.onMouseDown(target);
        }
        event.stopPropagation();
        event.preventDefault();
    }

    function onMouseUp(event) {
        ascii_draw.controllers.current.onMouseUp();
        event.stopPropagation();
        event.preventDefault();
    }

    function onMouseOver(event) {
        var target = ascii_draw.grid.getTargetCell(event.target);
        if (target !== null) {
            ascii_draw.controllers.current.onMouseOver(target);
        }
        event.stopPropagation();
        event.preventDefault();
    }

    function onMouseLeave(event) {
        ascii_draw.controllers.current.onMouseLeave();
        event.stopPropagation();
        event.preventDefault();
    }

    function onContextMenu(event) {
        event.stopPropagation();
        event.preventDefault();
    }

    function init() {
        copypastearea = document.getElementById('copypastearea');
        ascii_draw.rectangle_button = document.getElementById('rectangle-button');
        ascii_draw.selection_button = document.getElementById('selection-button');
        undo_button = document.getElementById('undo-button');
        redo_button = document.getElementById('redo-button');
        ascii_draw.gridstatus = document.getElementById('gridstatus');
        ascii_draw.selectionstatus = document.getElementById('selectionstatus');
        ascii_draw.mousestatus = document.getElementById('mousestatus');

        ascii_draw.grid.init();
        ascii_draw.controllers.init();

        updateUndoRedo();

        ascii_draw.grid.container.addEventListener('mousedown', onMouseDown, false);
        window.addEventListener('mouseup', onMouseUp, false);
        ascii_draw.grid.container.addEventListener('mouseover', onMouseOver, false);
        ascii_draw.grid.container.addEventListener('mouseleave', onMouseLeave, false);
        window.addEventListener('contextmenu', onContextMenu, false);
        window.addEventListener('keydown', onKeyDown, false);
        window.addEventListener('keyup', onKeyUp, false);
        window.addEventListener('keypress', onKeyPress, false);

        ascii_draw.rectangle_button.addEventListener('click', ascii_draw.controllers.swap(RectangleController), false);

        ascii_draw.selection_button.addEventListener('click', ascii_draw.controllers.swap(SelectMoveController), false);

        undo_button.addEventListener('click', onUndo, false);
        redo_button.addEventListener('click', onRedo, false);
    }
    ascii_draw.init = init;
})(ascii_draw || (ascii_draw = {}));

window.addEventListener('load', ascii_draw.init, false);
