'use strict';
var utils;
(function (utils) {
    function changeStyleRule(selector, style, value) {
        var stylesheet = document.styleSheets[0];
        var rules = stylesheet.cssRules || stylesheet.rules;

        var match = null;
        for (var i = 0; i != rules.length; i++) {
            if (rules[i].type === CSSRule.STYLE_RULE) {
                var style_rule = rules[i];
                if (style_rule.selectorText == selector) {
                    match = style_rule.style;
                    break;
                }
            }
        }

        if (match === null) {
            if (stylesheet.insertRule) {
                stylesheet.insertRule(selector + ' {' + style + ':' + value + '}', rules.length);
            } else {
                stylesheet.addRule(selector, style + ':' + value);
            }
        } else {
            match[style] = value;
        }
    }
    utils.changeStyleRule = changeStyleRule;

    function computeFontSize() {
        var tmp = document.createElement('table');
        var row = tmp.insertRow();
        var cell = row.insertCell();
        var div = document.createElement('div');
        div.textContent = 'X';
        cell.appendChild(div);
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
///<reference path='utils.ts'/>
'use strict';
var ascii_draw;
(function (ascii_draw) {
    (function (controllers) {
        var Rectangle = utils.Rectangle;
        var CellPosition = utils.Point;

        var selecting = false;
        var mouse_pos = null;

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
                // TODO: if current cell is selected change to move mode
                selecting = true;
                setHollowSelection(ascii_draw.getCellPosition(target), ascii_draw.getCellPosition(target));
                drawRectangle(new Rectangle(ascii_draw.begin_selection, ascii_draw.end_selection, true));
            }
            RectangleController.onMouseDown = onMouseDown;

            function onMouseUp() {
                selecting = false;
            }
            RectangleController.onMouseUp = onMouseUp;

            function onMouseOver(target) {
                var pos = ascii_draw.getCellPosition(target);
                setMousePosition(pos);
                if (selecting) {
                    setHollowSelection(ascii_draw.begin_selection, pos);
                    drawRectangle(new Rectangle(ascii_draw.begin_selection, ascii_draw.end_selection, true));
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
                var rect_pieces = getHollowRectangle(new Rectangle(ascii_draw.begin_selection, ascii_draw.end_selection, true));
                for (var piece = 0; piece < rect_pieces.length; piece++) {
                    ascii_draw.applyToRectangle(rect_pieces[piece], function (cell) {
                        writeToCell(cell, character);
                    });
                }
                if (ascii_draw.begin_selection.isEqual(ascii_draw.end_selection)) {
                    var displacement = [0, 1];
                    var pos = new CellPosition(ascii_draw.begin_selection.row + displacement[0], ascii_draw.begin_selection.col + displacement[1]);
                    setSelection(pos, pos);
                }
            }
            RectangleController.onKeyPress = onKeyPress;

            function exit() {
                console.log('exit');
                utils.removeClass(ascii_draw.rectangle_button, 'pressed');
                setHollowSelection(ascii_draw.begin_selection, ascii_draw.begin_selection);
            }
            RectangleController.exit = exit;

            function drawRectangle(rect) {
                var top = rect.top_left.row;
                var left = rect.top_left.col;
                var bottom = rect.bottom_right.row;
                var right = rect.bottom_right.col;

                // print first row: +---+
                var first_row = ascii_draw.grid.rows[top];
                writeToCell(first_row.cells[left], '+');
                for (var col = left + 1; col <= right - 1; col++) {
                    writeToCell(first_row.cells[col], '-');
                }
                writeToCell(first_row.cells[right], '+');

                for (var row = top + 1; row <= bottom - 1; row++) {
                    var current_row = ascii_draw.grid.rows[row];
                    writeToCell(current_row.cells[left], '|');
                    writeToCell(current_row.cells[right], '|');
                }

                // print last row
                var last_row = ascii_draw.grid.rows[bottom];
                writeToCell(last_row.cells[left], '+');
                for (var col = left + 1; col <= right - 1; col++) {
                    writeToCell(last_row.cells[col], '-');
                }
                writeToCell(last_row.cells[right], '+');
            }
        })(controllers.RectangleController || (controllers.RectangleController = {}));
        var RectangleController = controllers.RectangleController;

        (function (SelectMoveController) {
            function init() {
                reset();
                ascii_draw.begin_selection = new CellPosition(0, 0);
                ascii_draw.end_selection = ascii_draw.begin_selection;
                ascii_draw.setSelected(ascii_draw.getCellAt(ascii_draw.begin_selection), true);
            }
            SelectMoveController.init = init;

            function reset() {
                utils.addClass(ascii_draw.selection_button, 'pressed');
            }
            SelectMoveController.reset = reset;

            function onMouseDown(target) {
                // TODO: if current cell is selected change to move mode
                selecting = true;
                setSelection(ascii_draw.getCellPosition(target), ascii_draw.getCellPosition(target));
            }
            SelectMoveController.onMouseDown = onMouseDown;

            function onMouseUp() {
                selecting = false;
            }
            SelectMoveController.onMouseUp = onMouseUp;

            function onMouseOver(target) {
                var pos = ascii_draw.getCellPosition(target);
                setMousePosition(pos);
                if (selecting) {
                    setSelection(ascii_draw.begin_selection, pos);
                }
            }
            SelectMoveController.onMouseOver = onMouseOver;

            function onMouseLeave() {
                setMousePosition(null);
            }
            SelectMoveController.onMouseLeave = onMouseLeave;

            function onArrowDown(displacement) {
                var pos = new CellPosition(ascii_draw.begin_selection.row + displacement[0], ascii_draw.begin_selection.col + displacement[1]);
                setSelection(pos, pos);
            }
            SelectMoveController.onArrowDown = onArrowDown;
            function onKeyPress(character) {
                ascii_draw.applyToRectangle(new Rectangle(ascii_draw.begin_selection, ascii_draw.end_selection, true), function (cell) {
                    writeToCell(cell, character);
                });
                if (ascii_draw.begin_selection.isEqual(ascii_draw.end_selection)) {
                    var displacement = [0, 1];
                    var pos = new CellPosition(ascii_draw.begin_selection.row + displacement[0], ascii_draw.begin_selection.col + displacement[1]);
                    setSelection(pos, pos);
                }
            }
            SelectMoveController.onKeyPress = onKeyPress;

            function exit() {
                utils.removeClass(ascii_draw.selection_button, 'pressed');
                setSelection(ascii_draw.begin_selection, ascii_draw.begin_selection);
            }
            SelectMoveController.exit = exit;
        })(controllers.SelectMoveController || (controllers.SelectMoveController = {}));
        var SelectMoveController = controllers.SelectMoveController;

        function setMousePosition(new_pos) {
            if (mouse_pos !== null) {
                utils.removeClass(ascii_draw.getCellAt(mouse_pos), 'mouse');
            }
            mouse_pos = new_pos;

            var mousestatus = document.getElementById('mousestatus');
            if (mouse_pos !== null) {
                utils.addClass(ascii_draw.getCellAt(mouse_pos), 'mouse');
                mousestatus.textContent = 'Cursor: ' + mouse_pos;
            } else {
                mousestatus.textContent = '';
            }
        }

        function setSelection(new_begin_selection, new_end_selection) {
            var new_selection = new Rectangle(new_begin_selection, new_end_selection, true);
            var old_selection = new Rectangle(ascii_draw.begin_selection, ascii_draw.end_selection, true);

            if (old_selection.isEqual(new_selection)) {
                return;
            }

            ascii_draw.begin_selection = new_begin_selection;
            ascii_draw.end_selection = new_end_selection;

            var keep = old_selection.intersect(new_selection);
            var clear = old_selection.subtract(keep);
            var paint = new_selection.subtract(keep);

            for (var i = 0; i < paint.length; i++) {
                ascii_draw.applyToRectangle(paint[i], ascii_draw.setSelected, true);
            }

            for (var i = 0; i < clear.length; i++) {
                ascii_draw.applyToRectangle(clear[i], ascii_draw.setSelected, false);
            }

            if (new_selection.getHeight() > 1 || new_selection.getWidth() > 1) {
                ascii_draw.selectionstatus.textContent = 'Selection: ' + new_selection.getHeight() + 'x' + new_selection.getWidth();
            } else {
                ascii_draw.selectionstatus.textContent = '';
            }
        }

        function getHollowRectangle(rect) {
            var inside_rect = new Rectangle(new CellPosition(rect.top_left.row + 1, rect.top_left.col + 1), new CellPosition(rect.bottom_right.row - 1, rect.bottom_right.col - 1));
            var surrounding = rect.subtract(inside_rect);
            return surrounding;
        }

        function setHollowSelection(new_begin_selection, new_end_selection) {
            var new_selection = new Rectangle(new_begin_selection, new_end_selection, true);
            var old_selection = new Rectangle(ascii_draw.begin_selection, ascii_draw.end_selection, true);

            if (old_selection.isEqual(new_selection)) {
                return;
            }

            ascii_draw.begin_selection = new_begin_selection;
            ascii_draw.end_selection = new_end_selection;

            var rect_pieces = getHollowRectangle(old_selection);
            for (var piece = 0; piece < rect_pieces.length; piece++) {
                ascii_draw.applyToRectangle(rect_pieces[piece], ascii_draw.setSelected, false);
            }
            rect_pieces = getHollowRectangle(new_selection);
            for (var piece = 0; piece < rect_pieces.length; piece++) {
                ascii_draw.applyToRectangle(rect_pieces[piece], ascii_draw.setSelected, true);
            }
            var selectionstatus = document.getElementById('selectionstatus');
            if (new_selection.getHeight() > 1 || new_selection.getWidth() > 1) {
                selectionstatus.textContent = 'Selection: ' + new_selection.getHeight() + 'x' + new_selection.getWidth();
            } else {
                selectionstatus.textContent = '';
            }
        }

        function writeToCell(cell, character) {
            cell.children[0].textContent = character;
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

    ascii_draw.grid;
    ascii_draw.begin_selection;
    ascii_draw.end_selection;
    var copypastearea;
    ascii_draw.selection_button;
    ascii_draw.rectangle_button;
    var gridstatus;
    ascii_draw.mousestatus;
    ascii_draw.selectionstatus;
    var redo_button;
    var undo_button;
    var emptyCell = ' ';
    var controller = SelectMoveController;

    var CommandA = (function () {
        function CommandA() {
        }
        CommandA.prototype.execute = function () {
            console.log('CommandA execute');
        };
        CommandA.prototype.unexecute = function () {
            console.log('CommandA unexecute');
        };
        return CommandA;
    })();

    var CommandB = (function () {
        function CommandB() {
        }
        CommandB.prototype.execute = function () {
            console.log('CommandB execute');
        };
        CommandB.prototype.unexecute = function () {
            console.log('CommandB unexecute');
        };
        return CommandB;
    })();

    function getSelectionContent() {
        return 'content\ncontent\ncontent\ncontent\ncontent\ncontent\n';
    }

    function initiateCopyAction() {
        if (window.getSelection && document.createRange) {
            copypastearea.textContent = getSelectionContent();
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
            controller.onKeyPress(String.fromCharCode(event.charCode));
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

            if (displacement && ascii_draw.begin_selection.isEqual(ascii_draw.end_selection) && ascii_draw.begin_selection.isEqual(ascii_draw.end_selection)) {
                controller.onArrowDown(displacement);
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

    function getCellPosition(cell) {
        return new CellPosition(utils.indexInParent(cell.parentElement), utils.indexInParent(cell));
    }
    ascii_draw.getCellPosition = getCellPosition;

    function getCellAt(pos) {
        var row = ascii_draw.grid.rows[pos.row];
        var cell = row.cells[pos.col];
        return cell;
    }
    ascii_draw.getCellAt = getCellAt;

    function applyToRectangle(rect, functor) {
        var params = [];
        for (var _i = 0; _i < (arguments.length - 2); _i++) {
            params[_i] = arguments[_i + 2];
        }
        for (var r = rect.top_left.row; r <= rect.bottom_right.row; r++) {
            var row = ascii_draw.grid.rows[r];
            for (var c = rect.top_left.col; c <= rect.bottom_right.col; c++) {
                var cell = row.cells[c];
                functor.apply(undefined, [cell].concat(params));
            }
        }
    }
    ascii_draw.applyToRectangle = applyToRectangle;

    function setGridSize(new_nrows, new_ncols) {
        var nrows = ascii_draw.grid.rows.length;

        for (var r = nrows; r < new_nrows; r++) {
            ascii_draw.grid.insertRow();
        }

        for (var r = nrows; r > new_nrows; r--) {
            ascii_draw.grid.deleteRow(r - 1);
        }

        for (var r = 0; r < new_nrows; r++) {
            var row = ascii_draw.grid.rows[r];
            var ncols = row.cells.length;
            for (var c = ncols; c < new_ncols; c++) {
                var cell = row.insertCell();
                var div = document.createElement('div');
                div.textContent = emptyCell;
                cell.appendChild(div);
            }

            for (var c = ncols; c > new_ncols; c--) {
                row.deleteCell(c - 1);
            }
        }

        gridstatus.textContent = 'Grid size: ' + new_nrows + 'x' + new_ncols;
    }

    function changeFont() {
        utils.changeStyleRule('td div', 'width', 'auto');
        utils.changeStyleRule('td div', 'height', 'auto');

        var font_size = utils.computeFontSize();

        utils.changeStyleRule('td div', 'width', font_size.width + 'px');
        utils.changeStyleRule('td div', 'height', font_size.height + 'px');
    }

    function setSelected(cell, selected) {
        if (cell['data-selected'] !== selected) {
            cell['data-selected'] = selected;
            if (selected) {
                utils.addClass(cell, 'selected');
            } else {
                utils.removeClass(cell, 'selected');
            }
        } else {
            console.log('bla');
        }
    }
    ascii_draw.setSelected = setSelected;

    function getTargetCell(target) {
        if (target instanceof HTMLDivElement) {
            target = target.parentElement;
        }
        if (target instanceof HTMLTableCellElement) {
            return target;
        } else {
            return null;
        }
    }

    function onMouseDown(event) {
        var target = getTargetCell(event.target);
        if (target !== null) {
            controller.onMouseDown(target);
        }
        event.stopPropagation();
        event.preventDefault();
    }

    function onMouseUp(event) {
        controller.onMouseUp();
        event.stopPropagation();
        event.preventDefault();
    }

    function onMouseOver(event) {
        var target = getTargetCell(event.target);
        if (target !== null) {
            controller.onMouseOver(target);
        }
        event.stopPropagation();
        event.preventDefault();
    }

    function onMouseLeave(event) {
        controller.onMouseLeave();
        event.stopPropagation();
        event.preventDefault();
    }

    function onContextMenu(event) {
        event.stopPropagation();
        event.preventDefault();
    }

    function controllerSwitcher(new_controller) {
        return function () {
            controller.exit();
            controller = new_controller;
            controller.reset();
        };
    }

    function init() {
        ascii_draw.grid = document.getElementById('grid');
        copypastearea = document.getElementById('copypastearea');
        ascii_draw.rectangle_button = document.getElementById('rectangle-button');
        ascii_draw.selection_button = document.getElementById('selection-button');
        undo_button = document.getElementById('undo-button');
        redo_button = document.getElementById('redo-button');
        gridstatus = document.getElementById('gridstatus');
        ascii_draw.selectionstatus = document.getElementById('selectionstatus');
        ascii_draw.mousestatus = document.getElementById('mousestatus');

        commands.invoke(new CommandA());
        commands.invoke(new CommandB());
        commands.invoke(new CommandA());
        commands.invoke(new CommandA());
        commands.invoke(new CommandB());
        commands.invoke(new CommandA());

        changeFont();
        setGridSize(50, 120);
        updateUndoRedo();

        controller.init();

        ascii_draw.grid.addEventListener('mousedown', onMouseDown, false);
        window.addEventListener('mouseup', onMouseUp, false);
        ascii_draw.grid.addEventListener('mouseover', onMouseOver, false);
        ascii_draw.grid.addEventListener('mouseleave', onMouseLeave, false);
        window.addEventListener('contextmenu', onContextMenu, false);
        window.addEventListener('keydown', onKeyDown, false);
        window.addEventListener('keyup', onKeyUp, false);
        window.addEventListener('keypress', onKeyPress, false);

        ascii_draw.rectangle_button.addEventListener('click', controllerSwitcher(RectangleController), false);

        ascii_draw.selection_button.addEventListener('click', controllerSwitcher(SelectMoveController), false);

        undo_button.addEventListener('click', onUndo, false);
        redo_button.addEventListener('click', onRedo, false);
    }
    ascii_draw.init = init;
})(ascii_draw || (ascii_draw = {}));

window.addEventListener('load', ascii_draw.init, false);
